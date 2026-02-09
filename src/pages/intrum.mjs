import { PUP } from "../scraper.mjs";
import { intrum } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import { createFoldersAndGetName, parseNorwegianAmount } from "../utilities.mjs";
import { saveValidatedJSON, IntrumManualDebtSchema, DebtSchema } from "../schemas.mjs";
import { HANDLER_TIMEOUT_MS } from "../constants.mjs";

const fs = require('fs/promises');

/**
 * Maps raw Intrum debt data to standardized DebtSchema format
 * Extracts and parses amounts, case IDs, and creditor information
 * @param {Array<Object>} rawDebts - Array of raw debt objects from Intrum
 * @param {string} [debtCollectorName='Intrum'] - Name of the debt collector
 * @returns {Array<Object>} Array of objects matching DebtSchema format
 */
function mapToDebtSchema(rawDebts, debtCollectorName = "Intrum") {
  return rawDebts.map((item) => {

    // Use caseNumber for caseID
    let caseID = item.caseNumber || "";
    if (caseID === null || caseID === undefined) caseID = "";

    // Use creditorName for originalCreditorName
    let originalCreditorName = item.creditorName || "";
    if (originalCreditorName === null || originalCreditorName === undefined) originalCreditorName = "";

    // Use 'Total' or 'totalAmount' for totalAmount
    let totalAmount = item["Total"] || item.totalAmount || 0;
    totalAmount = parseNorwegianAmount(totalAmount);

    // Use 'Hovedkrav' for originalAmount
    let originalAmount = item["Hovedkrav"] || 0;
    originalAmount = parseNorwegianAmount(originalAmount);

    // Sum all values that start with 'Forsinkelsesrenter', plus Omkostninger, Salær, Rettslig gebyr
    let interestAndFines = 0;
    for (const key of Object.keys(item)) {
      if (key.toLowerCase().startsWith("forsinkelsesrenter")) {
        interestAndFines += parseNorwegianAmount(item[key]);
      }
    }
    interestAndFines += parseNorwegianAmount(item["Omkostninger"]);
    interestAndFines += parseNorwegianAmount(item["Salær"]);
    interestAndFines += parseNorwegianAmount(item["Rettslig gebyr"]);

    // debtType and comment are optional
    let debtType = item.debtType || undefined;
    let comment = item.comment || undefined;

    return {
      caseID: String(caseID),
      totalAmount,
      originalAmount,
      interestAndFines,
      originalDueDate: null, // Not available
      debtCollectorName,
      originalCreditorName: String(originalCreditorName),
      debtType,
      comment,
    };
  });
}

/**
 * Validates and saves Intrum debts in standardized DebtSchema format
 * Filters out invalid entries and saves to a separate _DebtSchema.json file
 * @param {string} filePath - Base path for saving the file (will be modified to add _DebtSchema suffix)
 * @param {Array<Object>} rawDebts - Array of raw debt objects to validate and save
 * @returns {Promise<void>}
 */
async function saveIntrumDebtsAsDebtSchema(filePath, rawDebts) {
  const mapped = mapToDebtSchema(rawDebts);
  // Validate each debt, filter out invalid
  const validDebts = mapped.filter((d) => {
    const result = DebtSchema.safeParse(d);
    if (!result.success) {
      console.warn("DebtSchema validation failed for entry:", d, result.error.issues);
      return false;
    }
    return true;
  });
  if (validDebts.length === 0) {
    console.warn("No valid debts to save for Intrum.");
    return;
  }
  const out = { debts: validDebts, timestamp: new Date().toISOString() };
  const outPath = filePath.replace(/(\.json)?$/, "_DebtSchema.json");
  await fs.writeFile(outPath, JSON.stringify(out, null, 2), "utf-8");
  console.log(`Saved Intrum debts in DebtSchema format to ${outPath}`);
}

/**
 * Handles the Intrum login automation flow, extracts debt case overview and detailed information
 * @param {string} nationalID - The national identity number to use for BankID login
 * @param {(page: import('puppeteer').Page, nationalID: string) => void} setupPageHandlers - Function to setup page response handlers for saving network responses
 * @param {{onComplete?: Function, onTimeout?: Function}} callbacks - Callbacks for completion and timeout
 * @returns {Promise<{browser: import('puppeteer').Browser, page: import('puppeteer').Page}>} - Returns browser and page instances
 * @throws {Error} - Throws if login button cannot be found or clicked
 */
export async function handleIntrumLogin(nationalID, setupPageHandlers, callbacks = {}) {
  const { onComplete, onTimeout } = callbacks;
  let timeoutTimer = null;
  const { browser, page } = await PUP.openPage(intrum.url);

  console.log(`Opened ${intrum.name} at ${intrum.url}`);

  // Setup page handlers for saving responses
  if (setupPageHandlers) {
    setupPageHandlers(page, nationalID);
  }


  try {
      // Click the "Logg inn" button with id="signicatOIDC"
      await page.waitForSelector('#signicatOIDC', { visible: true });
      await page.click('#signicatOIDC');
      console.log('Clicked "Logg inn" button');
    } catch (error) {
      console.error('Error clicking "Logg inn" button:', error);
      throw error;
    }


  // Use shared BankID login flow
  await loginWithBankID(page, nationalID);

  // Start 60-second timeout timer after BankID login
  if (onTimeout) {
    timeoutTimer = setTimeout(() => {
      console.log('Intrum handler timed out after ' + (HANDLER_TIMEOUT_MS / 1000) + ' seconds');
      onTimeout('HANDLER_TIMEOUT');
    }, HANDLER_TIMEOUT_MS);
  }

    // Check if there are no cases in the system
  try {
    const noCasesElement = await page.waitForSelector('.warning-message', { visible: true }).catch(() => console.log('No warning message found'));
    if (noCasesElement) {
      const warningText = await page.evaluate(el => el.textContent, noCasesElement);
      if (warningText.includes('Vi finner ingen saker i vårt system.')) {
        console.log('No cases found in Intrum system. Finishing execution.');
        if (timeoutTimer) clearTimeout(timeoutTimer);
        if (onComplete) {
          setTimeout(() => onComplete('NO_DEBT_FOUND'), 1000);
        }
        return { browser, page };
      }
    }
  } catch (error) {
    console.log('No warning message found, continuing with debt case extraction');
  }

  // Wait for debt case containers to appear
  // Using multiple selectors as fallback since Intrum's class names may vary
  await page.waitForSelector('.case-container, .debt-case, [class*="case"]', { visible: true }).catch(() => {
    console.log('No debt cases found or page took too long to load');
  });

  // Extract initial debt case overview from the main page
  const debtCases = await page.evaluate(() => {
    const cases = [];
    
    // Find all case containers - using broad selector as Intrum's structure varies
    const caseElements = document.querySelectorAll('.case-container, .debt-case, [class*="case"]');
    
    caseElements.forEach(caseEl => {
      const caseData = {};
      
      // Extract case number
      const caseNumberEl = caseEl.querySelector('.label');
      if (caseNumberEl) {
        const match = caseNumberEl.textContent.match(/Saksnummer\s+(\d+)/);
        caseData.caseNumber = match ? match[1] : null;
      }
      
      // Extract total amount
      const totalAmountEl = caseEl.querySelector('.case-total-amount-value');
      if (totalAmountEl) {
        caseData.totalAmount = totalAmountEl.textContent.replace(/\s/g, '').replace(',', '.');
      }
      
      // Extract creditor name
      const creditorEl = caseEl.querySelector('.creditor-name');
      if (creditorEl) {
        caseData.creditorName = creditorEl.textContent.trim();
      }
      
      if (Object.keys(caseData).length > 0) {
        cases.push(caseData);
      }
    });
    
    return cases;
  });
  
  console.log('Extracted debt cases:', debtCases);

  const filePath = createFoldersAndGetName(intrum.name, nationalID, "Intrum", "ManuallyFoundDebt", true);
  const data = { debtCases, timestamp: new Date().toISOString() };
  console.log(`Saving debt data to ${filePath}\n\n\n----------------`);

  try {
     await saveValidatedJSON(filePath, data, IntrumManualDebtSchema);
      // Also save in DebtSchema format
      await saveIntrumDebtsAsDebtSchema(filePath, debtCases);
  } catch (error) {
    console.error('Error writing debt data from Intrum to file:', error);
  }
 

  // Find all "Detaljer på sak" buttons and process each one
  // Helper function to get detail buttons
  const getDetailButtons = async () => {
    await page.waitForSelector('span.button-text', { visible: true });
    const buttons = await page.$$('span.button-text');
    const detailButtons = [];
    
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent.trim());
      if (text === 'Detaljer på sak') {
        detailButtons.push(button);
      }
    }
    return detailButtons;
  };
  
  const initialButtons = await getDetailButtons();
  const totalCases = initialButtons.length;
  console.log(`Found ${totalCases} detail buttons to process`);
  
  const allDetailedInfo = [];

  for (let i = 0; i < totalCases; i++) {
    console.log(`Processing case ${i + 1}/${totalCases}`);
    
    try {
      // Get fresh button reference for current index
      const currentButtons = await getDetailButtons();
      const clickableElement = await currentButtons[i].evaluateHandle(el => el.closest('button, a, [role="button"]'));
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        clickableElement.click()
      ]);

      const detailedInfo = await page.evaluate(() => {
        const details = {};
        const rows = document.querySelectorAll('.global-table tr');
        
        rows.forEach(row => {
          const label = row.querySelector('.table-label, .bold');
          const amount = row.querySelector('.table-amount');
          
          if (label && amount) {
            const labelText = label.textContent.trim();
            const amountText = amount.textContent.replace(/\s/g, '').replace(',', '.').replace('NOK', '').trim();
            details[labelText] = amountText;
          }
        });
        
        return details;
      });
      
      allDetailedInfo.push(detailedInfo);
      console.log(`Case ${i + 1} details:`, detailedInfo);
      

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.goBack()
      ]);
    } catch (e) {
      console.error(`Failed to process case ${i + 1}:`, e);
    }
  }
  
  console.log('All detailed case information:', allDetailedInfo);

  // Save detailed info with better structure
  const detailedInfoFilePath = createFoldersAndGetName(intrum.name, nationalID, "Intrum", "DetailedDebtInfo", true);
  
  // Map detailed info to include case numbers for better tracking
  const structuredDetailedData = allDetailedInfo.map((details, index) => ({
    caseNumber: debtCases[index]?.caseNumber || `unknown_${index + 1}`,
    details,
    timestamp: new Date().toISOString()
  }));
  
  const detailedData = { 
    cases: structuredDetailedData, 
    totalCases: structuredDetailedData.length,
    timestamp: new Date().toISOString() 
  };
  
  try {
    await fs.writeFile(detailedInfoFilePath, JSON.stringify(detailedData, null, 2));
    console.log(`Saved detailed info for ${structuredDetailedData.length} cases to ${detailedInfoFilePath}`);
  } catch (error) {
    console.error(`Failed to write detailed Intrum info to file "${detailedInfoFilePath}" for nationalID ${nationalID}:`, error);
  }

  if (timeoutTimer) clearTimeout(timeoutTimer);
  if (onComplete) {
    setTimeout(() => onComplete('DEBT_FOUND'), 1000);
  }
  return { browser, page };
}
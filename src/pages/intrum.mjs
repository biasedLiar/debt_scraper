import { PUP } from "../scraper.mjs";
import { intrum } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import { createFoldersAndGetName } from "../utilities.mjs";
import { saveValidatedJSON, IntrumManualDebtSchema, DebtSchema } from "../schemas.mjs";
import { HANDLER_TIMEOUT_MS } from "../constants.mjs";

const fs = require('fs/promises');

/**
 * Maps raw Intrum debt data to DebtSchema format
 * @param {Array<Object>} rawDebts
 * @param {string} debtCollectorName
 * @returns {Array<Object>} Array of objects matching DebtSchema
 */
function mapToDebtSchema(rawDebts, debtCollectorName = "Intrum") {
  return rawDebts.map((item) => {
    // Parse numbers, fallback to 0 if not present
    const parseNum = (val) => {
      if (val === undefined || val === null || val === "") return 0;
      if (typeof val === "number") return val;
      const n = Number(("" + val).replace(/\s/g, "").replace(",", "."));
      return isNaN(n) ? 0 : n;
    };

    // Use caseNumber for caseID
    let caseID = item.caseNumber || "";
    if (caseID === null || caseID === undefined) caseID = "";

    // Use creditorName for originalCreditorName
    let originalCreditorName = item.creditorName || "";
    if (originalCreditorName === null || originalCreditorName === undefined) originalCreditorName = "";

    // Use 'Total' or 'totalAmount' for totalAmount
    let totalAmount = item["Total"] || item.totalAmount || 0;
    totalAmount = parseNum(totalAmount);

    // Use 'Hovedkrav' for originalAmount
    let originalAmount = item["Hovedkrav"] || 0;
    originalAmount = parseNum(originalAmount);

    // Sum interest, omkostninger, salær, rettslig gebyr for interestAndFines
    let interestAndFines = 0;
    interestAndFines += parseNum(item["Forsinkelsesrenter (21.01.2026)"]);
    interestAndFines += parseNum(item["Omkostninger"]);
    interestAndFines += parseNum(item["Salær"]);
    interestAndFines += parseNum(item["Rettslig gebyr"]);
    // Always keep 0 if sum is 0

    // debtType and comment are optional
    let debtType = item.debtType || undefined;
    let comment = item.comment || undefined;

    return {
      caseID: String(caseID),
      totalAmount,
      originalAmount,
      interestAndFines,
      originalDueDate: undefined, // Not available
      debtCollectorName,
      originalCreditorName: String(originalCreditorName),
      debtType,
      comment,
    };
  });
}

/**
 * Validates and saves Intrum debts in DebtSchema format
 * @param {string} filePath
 * @param {Array<Object>} rawDebts
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
  console.log(`✓ Saved Intrum debts in DebtSchema format to ${outPath}`);
}

/**
 * Handles the Intrum login automation flow
 * @param {string} nationalID - The national identity number to use for login
 * @param {Function} setupPageHandlers - Function to setup page response handlers
 * @param {{onComplete?: Function, onTimeout?: Function}} callbacks - Callbacks object with onComplete and onTimeout functions
 * @returns {Promise<{browser: any, page: any}>}
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

  await page.waitForSelector('.case-container, .debt-case, [class*="case"]', { visible: true }).catch(() => {
    console.log('No debt cases found or page took too long to load');
  });


  const debtCases = await page.evaluate(() => {
    const cases = [];
    
    // Find all case containers
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
  await page.waitForSelector('span.button-text', { visible: true });
  const detailsButtons = await page.$$('span.button-text');
  const detailsButtonsToClick = [];
  
  for (const button of detailsButtons) {
    const text = await button.evaluate(el => el.textContent.trim());
    if (text === 'Detaljer på sak') {
      detailsButtonsToClick.push(button);
    }
  }
  
  console.log(`Found ${detailsButtonsToClick.length} detail buttons to process`);
  
  const allDetailedInfo = [];
  


  for (let i = 0; i < detailsButtonsToClick.length; i++) {
    console.log(`Processing case ${i + 1}/${detailsButtonsToClick.length}`);
    
    try {

      const clickableElement = await detailsButtonsToClick[i].evaluateHandle(el => el.closest('button, a, [role="button"]'));
      await clickableElement.click();

      //litt usikker på beste løsning her
      await new Promise(r => setTimeout(r, 4000));

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
      

      await page.goBack();
      await new Promise(r => setTimeout(r, 4000));
      
      if (i < detailsButtonsToClick.length - 1) {
        const newButtons = await page.$$('span.button-text');
        detailsButtonsToClick.length = 0;
        for (const button of newButtons) {
          const text = await button.evaluate(el => el.textContent.trim());
          if (text === 'Detaljer på sak') {
            detailsButtonsToClick.push(button);
          }
        }
      }
    } catch (e) {
      console.error(`Failed to process case ${i + 1}:`, e);
    }
  }
  
  console.log('All detailed case information:', allDetailedInfo);

  const detailedInfoFilePath = createFoldersAndGetName(intrum.name, nationalID, "Intrum", "DetailedDebtInfo", true);
  const detailedData = { allDetailedInfo, timestamp: new Date().toISOString() };
  try {
    // Note: not updated to use schema validation yet due to some bugs
    await fs.writeFile(detailedInfoFilePath, JSON.stringify(detailedData, null, 2));
  } catch (error) {
    console.error(`Failed to write detailed Intrum info to file "${detailedInfoFilePath}" for nationalID ${nationalID}:`, error);
  }

  if (timeoutTimer) clearTimeout(timeoutTimer);
  if (onComplete) {
    setTimeout(() => onComplete('DEBT_FOUND'), 1000);
  }
  return { browser, page };
}
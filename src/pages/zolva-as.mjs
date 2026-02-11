import { PUP } from "../services/scraper.mjs";
import { zolva } from "../services/data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import { HANDLER_TIMEOUT_MS } from "../utils/constants.mjs";
import { createFoldersAndGetName, createExtractedFoldersAndGetName } from "../utils/utilities.mjs";
import { DebtSchema, DebtCollectionSchema } from "../utils/schemas.mjs";
const fs = require('fs/promises');
/**
 * Handles the Zolva AS login automation flow and extracts debt table data
 * @param {string} nationalID - The national identity number to use for BankID login
 * @param {(page: import('puppeteer').Page, nationalID: string) => void} setupPageHandlers - Function to setup page response handlers for saving network responses
 * @param {{onComplete?: Function, onTimeout?: Function}} callbacks - Callbacks for completion and timeout
 * @returns {Promise<{browser: import('puppeteer').Browser, page: import('puppeteer').Page}>} - Returns browser and page instances
 */
export async function handleZolvaLogin(nationalID, setupPageHandlers, callbacks = {}) {
  const { onComplete, onTimeout } = callbacks;
  let timeoutTimer = null;
  const { browser, page } = await PUP.openPage(zolva.url);

  console.log(`Opened ${zolva.name} at ${zolva.url}`);

  // Setup page handlers for saving responses
  if (setupPageHandlers) {
    setupPageHandlers(page, nationalID);
  }

  // Wait for and click the login button
  try {
    await page.waitForSelector(
      "button.c-btn.c-btn--variant-nets.mb-1",
      { visible: true  }
    );
    await page.click(
      "button.c-btn.c-btn--variant-nets.mb-1"
    );
    console.log("Clicked BankID login button");
  } catch (e) {
    console.error("Could not find/click button:", e);
  }

  // Use shared BankID login flow
  await loginWithBankID(page, nationalID);

  // Start 60-second timeout timer after BankID login
  if (onTimeout) {
    timeoutTimer = setTimeout(() => {
      console.log('Zolva handler timed out after ' + (HANDLER_TIMEOUT_MS / 1000) + ' seconds');
      onTimeout('HANDLER_TIMEOUT');
    }, HANDLER_TIMEOUT_MS);
  }

  // Check for error message indicating no debtor found
  try {
    await page.waitForSelector('.validation-summary-errors, table.table.table-bordered', { visible: true });
    const errorMessage = await page.evaluate(() => {
      const errorElement = document.querySelector('.validation-summary-errors li');
      return errorElement ? errorElement.textContent.trim() : null;
    });
    
    if (errorMessage === 'Ingen debitor funnet for SSN-nummer') {
      console.log('No debitor found for this SSN number');
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (onComplete) {
        setTimeout(() => onComplete('NO_DEBT_FOUND'), 1000);
      }
      return { browser, page };
    }
  } catch (error) {
    // No error message found, continue with normal flow
    console.log('No error message found, proceeding with data extraction');
  }



  // Wait for the table to load
  try {
    await page.waitForSelector('table.table.table-bordered', { visible: true });
  } catch (error) {
    console.log('Table not found or took too long to load:', error.message);
    console.log('Page might not have any debt data to display');
    return { browser, page };
  }
  // Check if table shows "Ingen data å vise"
    const hasNoData = await page.evaluate(() => {
      const noDataCell = document.querySelector('td.react-bs-table-no-data');
      return noDataCell !== null;
    });

    if (hasNoData) {
      console.log('Table shows "Ingen data å vise" - no debt data available');
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (onComplete) {
        setTimeout(() => onComplete('NO_DEBT_FOUND'), 1000);
      }
      return { browser, page };
    }

  // Extract table data
  const tableData = await page.evaluate(() => {
    const rows = document.querySelectorAll('table.table.table-bordered tbody tr');
    return Array.from(rows).map(row => {
      const cells = row.querySelectorAll('td');
      return {
        saksnummer: cells[0]?.innerText.trim() || '',
        regDato: cells[1]?.innerText.trim() || '',
        kreditor: cells[2]?.innerText.trim() || '',
        saldo: cells[3]?.innerText.trim() || ''
      };
    });
  });

  console.log(`Found ${tableData.length} rows in the table`);
  console.log('Table data:', tableData);

  // Transform to DebtSchema format
  const debts = tableData.map(row => {
    // Parse saldo (remove spaces and convert comma to period)
    const saldoNumber = row.saldo 
      ? parseFloat(row.saldo.replace(/\s/g, '').replace(',', '.').replace('kr', ''))
      : 0;

    return {
      caseID: row.saksnummer || 'N/A',
      totalAmount: saldoNumber,
      originalAmount: undefined,
      interestAndFines: undefined,
      originalDueDate: undefined,
      debtCollectorName: 'Zolva AS',
      originalCreditorName: row.kreditor || 'Unknown',
      debtType: undefined,
      comment: row.regDato ? `Reg.dato: ${row.regDato}` : undefined,
    };
  });

  // Validate each debt against DebtSchema
  const validatedDebts = debts.map((debt, index) => {
    const result = DebtSchema.safeParse(debt);
    if (!result.success) {
      console.warn(`Validation warning for debt ${index + 1} (caseID: ${debt.caseID}):`, result.error.errors);
      return debt;
    }
    return result.data;
  });

  // Create DebtCollectionSchema object
  const totalAmount = validatedDebts.reduce((sum, d) => sum + (d.totalAmount || 0), 0);
  const debtCollectionObj = {
    creditSite: 'Zolva AS',
    debts: validatedDebts,
    isCurrent: true,
    totalAmount
  };

  // Validate against DebtCollectionSchema
  const collectionValidationResult = DebtCollectionSchema.safeParse(debtCollectionObj);
  if (!collectionValidationResult.success) {
    console.error('DebtCollectionSchema validation failed for Zolva AS:', collectionValidationResult.error);
  }
  const validatedCollection = collectionValidationResult.success ? collectionValidationResult.data : debtCollectionObj;

  // Save validated collection to extracted_data folder
  const extractedDataPath = createExtractedFoldersAndGetName('Zolva AS', nationalID);
  await fs.writeFile(extractedDataPath, JSON.stringify(validatedCollection, null, 2));
  console.log(`Saved validated debt collection to ${extractedDataPath}`);

  // Save the table data
    const detailedInfoFilePath = createFoldersAndGetName("Zolva", nationalID, "Zolva", "DetailedDebtInfo", true);
    await fs.writeFile(detailedInfoFilePath, JSON.stringify(tableData, null, 2));
    console.log(`Saved table data to ${detailedInfoFilePath}`);
  
  if (timeoutTimer) clearTimeout(timeoutTimer);
  if (onComplete) {
    setTimeout(() => onComplete('DEBT_FOUND'), 1000);
  }
  return { browser, page };
}

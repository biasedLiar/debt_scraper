import { PUP } from "../scraper.mjs";
import { zolva } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
const fs = require('fs/promises');
/**
 * Handles the Zolva AS login automation flow
 * @param {string} nationalID - The national identity number to use for login
 * @param {Function} setupPageHandlers - Function to setup page response handlers
 * @param {Function} scrapingCompleteCallback - Callback to signal scraping is complete
 * @returns {Promise<{browser: any, page: any}>}
 */
export async function handleZolvaLogin(nationalID, setupPageHandlers, scrapingCompleteCallback) {
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

  // Check for error message indicating no debtor found
  try {
    await page.waitForSelector('.validation-summary-errors', { visible: true });
    const errorMessage = await page.evaluate(() => {
      const errorElement = document.querySelector('.validation-summary-errors li');
      return errorElement ? errorElement.textContent.trim() : null;
    });
    
    if (errorMessage === 'Ingen debitor funnet for SSN-nummer') {
      console.log('No debitor found for this SSN number');
      if (scrapingCompleteCallback) {
        setTimeout(() => scrapingCompleteCallback("NO_DEBT_FOUND"), 1000);
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
      if (scrapingCompleteCallback) {
        setTimeout(() => scrapingCompleteCallback("NO_DEBT_FOUND"), 1000);
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


  // Save the table data
    const detailedInfoFilePath = createFoldersAndGetName("Zolva", nationalID, "Zolva", "DetailedDebtInfo", true);
    await fs.writeFile(detailedInfoFilePath, JSON.stringify(tableData, null, 2));
    console.log(`Saved table data to ${detailedInfoFilePath}`);
  
  if (scrapingCompleteCallback) {
    setTimeout(() => scrapingCompleteCallback("DEBT_FOUND"), 1000);
  }
  return { browser, page };
}

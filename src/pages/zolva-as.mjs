import { PUP } from "../scraper.mjs";
import { zolva } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
const fs = require('fs/promises');
/**
 * Handles the Zolva AS login automation flow
 * @param {string} nationalID - The national identity number to use for login
 * @returns {Promise<{browser: any, page: any}>}
 */
export async function handleZolvaLogin(nationalID, setupPageHandlers) {
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

  // Wait for the table to load
  try {
    await page.waitForSelector('table.table.table-bordered', { visible: true });
  } catch (error) {
    console.log('Table not found or took too long to load:', error.message);
    console.log('Page might not have any debt data to display');
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
  return { browser, page };
}

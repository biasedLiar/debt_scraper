import { PUP } from "../scraper.mjs";
import { tfBank } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";

/**
 * Handles the tfBank login automation flow
 * @param {string} nationalID - The national identity number to use for login
 * @returns {Promise<{browser: any, page: any}>}
 */
export async function handleTfBankLogin(nationalID, setupPageHandlers) {
  const { browser, page } = await PUP.openPage(tfBank.url);
  
  console.log(`Opened ${tfBank.name} at ${tfBank.url}`);
  
  // Setup page handlers for saving responses
  if (setupPageHandlers) {
    setupPageHandlers(page, nationalID);
  }

  // Click the BankID button
  await page.waitForSelector('div.btn.authButton.NorwegianBankId');
  await page.click('div.btn.authButton.NorwegianBankId');
 
  // Use shared BankID login flow
  await loginWithBankID(page, nationalID);

  return { browser, page };
}

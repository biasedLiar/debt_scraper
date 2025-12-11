import { PUP } from "../scraper.mjs";
import { intrum } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";

/**
 * Handles the Digipost login automation flow
 * @param {string} nationalID - The national identity number to use for login
 * @returns {Promise<{browser: any, page: any}>}
 */
export async function handleIntrumLogin(nationalID, setupPageHandlers) {
  const { browser, page } = await PUP.openPage(intrum.url);
  
  console.log(`Opened ${intrum.name} at ${intrum.url}`);
  
  // Setup page handlers for saving responses
  if (setupPageHandlers) {
    setupPageHandlers(page, nationalID);
  }
 
  // Use shared BankID login flow
  await loginWithBankID(page, nationalID);

  return { browser, page };
}

import { si } from '../data.mjs';
import { PUP } from '../scraper.mjs';
import { loginWithBankID } from './bankid-login.mjs';

/**
 * Handles the Statens Innkrevingssentral login automation flow
 * @param {string} nationalID - The national identity number to use for login
 * @returns {Promise<{browser: any, page: any}>}
 */
export async function handleSILogin(nationalID) {
  const { browser, page } = await PUP.openPage(si.url);
  
  console.log(`Opened ${si.name} at ${si.url}`);
  
  // Use shared BankID login flow
  await loginWithBankID(page, nationalID);

  return { browser, page }; 
}
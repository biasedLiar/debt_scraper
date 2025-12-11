import { si } from '../data.mjs';
import { PUP } from '../scraper.mjs';

/**
 * Reusable BankID login flow
 * @param {any} page - Puppeteer page object
 * @param {string} nationalID - The national identity number to use for login
 */
export async function loginWithBankID(page, nationalID) {
  // Wait for and click the BankID link
  try {
    await page.waitForSelector('a[href="/authorize/bankid"]', { timeout: 5000 });
    await page.click('a[href="/authorize/bankid"]');
    console.log('Clicked BankID link');
  } catch (e) {
    console.error('Could not find/click BankID link:', e);
  }
  
  //Needs to be optimized, improvised solution for now
  await new Promise(resolve => setTimeout(resolve, 5000)); // wait for navigation
  
  // Wait for and fill in the national identity number input
  try {
    if (nationalID) {
      await page.type('input#nnin', nationalID);
      console.log('Filled in national identity number');
    } else {
      console.log('No value to enter in national identity number field');
    }
  } catch (e) {
    console.error('Could not find/fill national identity number input:', e);
  }
  
  // Wait for and click the continue button
  try {
    await page.waitForSelector('button#nnin-next-button', { timeout: 5000 });
    await page.click('button#nnin-next-button');
    console.log('Clicked continue button');
  } catch (e) {
    console.error('Could not find/click continue button:', e);
  }
}


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
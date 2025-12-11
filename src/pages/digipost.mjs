import { PUP } from "../scraper.mjs";
import { digiPost } from "../data.mjs";

/**
 * Handles the Digipost login automation flow
 * @param {string} nationalID - The national identity number to use for login
 * @returns {Promise<{browser: any, page: any}>}
 */
export async function handleDigipostLogin(nationalID) {
  const { browser, page } = await PUP.openPage(digiPost.url);
  
  console.log(`Opened ${digiPost.name} at ${digiPost.url}`);
  
  // Wait for and click the login button
  try {
    await page.waitForSelector('button.dds-button.dds-button--primary.dds-button--size-large', { timeout: 5000 });
    await page.click('button.dds-button.dds-button--primary.dds-button--size-large');
    console.log('Clicked login button');
  } catch (e) {
    console.error('Could not find/click button:', e);
  }

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

  return { browser, page };
}

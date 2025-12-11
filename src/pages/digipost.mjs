import { PUP } from "../scraper.mjs";
import { digiPost } from "../data.mjs";
import { loginWithBankID } from "./statens-innkrevingssentral.mjs";

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

  // Use shared BankID login flow
  await loginWithBankID(page, nationalID);

  return { browser, page };
}

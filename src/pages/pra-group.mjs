

import { PUP } from "../scraper.mjs";
import { praGroup } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";

/**
 * Handles the PRA Group login automation flow
 * @param {string} nationalID - The national identity number to use for login
 * @returns {Promise<{browser: any, page: any}>}
 */
export async function handlePraGroupLogin(nationalID, setupPageHandlers) {
  const { browser, page } = await PUP.openPage(praGroup.url);

  console.log(`Opened ${praGroup.name} at ${praGroup.url}`);

  // Setup page handlers for saving responses
  if (setupPageHandlers) {
    setupPageHandlers(page, nationalID);
  }

await new Promise((r) => setTimeout(r, 3000)); // wait for 3 seconds
  // Wait for and click the login button
  try {
    await page.waitForSelector("#loginButtonId", { timeout: 5000 });
    await page.click("#loginButtonId");
    console.log("Clicked BankID login button");
  } catch (e) {
    console.error("Could not find/click button:", e);
  }

  // Use shared BankID login flow
  await loginWithBankID(page, nationalID);

  await new Promise((r) => setTimeout(r, 5000)); // wait for 5 seconds

  return { browser, page };
}

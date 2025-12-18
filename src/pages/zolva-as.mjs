import { PUP } from "../scraper.mjs";
import { zolva } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";

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
      { timeout: 5000 }
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

  await new Promise((r) => setTimeout(r, 5000)); // wait for 5 seconds

  return { browser, page };
}
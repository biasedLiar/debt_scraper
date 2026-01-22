import { si } from "../data.mjs";
import { PUP } from "../scraper.mjs";
import { loginWithBankID } from "./bankid-login.mjs";

/**
 * Handles the Statens Innkrevingssentral login automation flow
 * @param {string} nationalID - The national identity number to use for login
 * @param {Function} setupPageHandlers - Function to setup page response handlers
 * @param {{onComplete?: Function}} callbacks - Callbacks object with onComplete function
 * @returns {Promise<{browser: any, page: any}>}
 */
export async function handleSILogin(nationalID, setupPageHandlers, callbacks = {}) {
  const { onComplete, onTimeout } = callbacks;
  let timeoutTimer = null;
  const { browser, page } = await PUP.openPage(si.url);

  console.log(`Opened ${si.name} at ${si.url}`);

  // Setup page handlers for saving responses
  if (setupPageHandlers) {
    setupPageHandlers(page, nationalID);
  }

  // Use shared BankID login flow
  await loginWithBankID(page, nationalID);

  // Start 60-second timeout timer after BankID login
  if (onTimeout) {
    timeoutTimer = setTimeout(() => {
      console.log('SI handler timed out after 60 seconds');
      onTimeout('HANDLER_TIMEOUT');
    }, 60000);
  }

  // Find and log the debt amount
  const debtElement = await page.$("span.ce26PEIo");
  if (debtElement) {
    const debtText = await page.evaluate((el) => el.textContent, debtElement);
    console.log("Debt amount:", debtText);
    // Note: SI also gets completion signal from setupPageHandlers when JSON response arrives
  } else {
    console.log("Debt element not found");
    if (timeoutTimer) clearTimeout(timeoutTimer);
    if (onComplete) {
      setTimeout(() => onComplete("NO_DEBT_FOUND"), 1000);
    }
  }

  return { browser, page };
}

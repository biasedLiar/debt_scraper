import { si } from "../data.mjs";
import { PUP } from "../scraper.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import { HANDLER_TIMEOUT_MS } from "../constants.mjs";

/**
 * Handles the Statens Innkrevingssentral login automation flow
 * @param {string} nationalID - The national identity number to use for login
 * @param {Function} setupPageHandlers - Function to setup page response handlers
 * @param {{onComplete?: Function, onTimeout?: Function}} callbacks - Callbacks object with onComplete and onTimeout functions
 * @returns {Promise<{browser: any, page: any}>}
 */
export async function handleSILogin(nationalID, setupPageHandlers, callbacks = {}) {
  const { onComplete, onTimeout } = callbacks;
  let timeoutTimer = null;
  const { browser, page } = await PUP.openPage(si.url);

  console.log(`Opened ${si.name} at ${si.url}`);

  // Setup page handlers for saving responses
  if (setupPageHandlers) {
    setupPageHandlers(page, nationalID, onComplete);
  }

  // Use shared BankID login flow
  await loginWithBankID(page, nationalID);

  // Start 60-second timeout timer after BankID login
  if (onTimeout) {
    timeoutTimer = setTimeout(() => {
      console.log('SI handler timed out after ' + (HANDLER_TIMEOUT_MS / 1000) + ' seconds');
      onTimeout('HANDLER_TIMEOUT');
    }, HANDLER_TIMEOUT_MS);
  }

  // Find and log the debt amount, not that important, as the files are provided through JSON responses
  const debtElement = await page.waitForSelector("span.ce26PEIo", {visible: true, timeout: 60000}).catch(() => null);
  
  if (debtElement) {
    const debtText = await page.evaluate((el) => el.textContent, debtElement);
    console.log(`Found debt through UI, not JSON as expected: ${debtText}`);
    if (timeoutTimer) clearTimeout(timeoutTimer);
    if (onComplete) {
      setTimeout(() => onComplete("HANDLER_TIMEOUT"), 10000);
    }
    // Note: SI also gets completion signal from setupPageHandlers when JSON response arrives
  } else {
    console.log("No debt found through UI.");
    if (timeoutTimer) clearTimeout(timeoutTimer);
    if (onComplete) {
        setTimeout(() => onComplete("HANDLER_TIMEOUT"), 10000);
    }
  }

  return { browser, page };
}

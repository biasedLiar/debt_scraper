import { si } from "../services/data.mjs";
import { PUP } from "../services/scraper.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import { HANDLER_TIMEOUT_MS, SLOW_DOWN_BANK_ID } from "../utils/constants.mjs";
import { waitForContinue } from "../utils/pageHelpers.mjs";

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

  const startUrl = SLOW_DOWN_BANK_ID ? "https://skatteetaten.no" : si.url;
  const { browser, page } = await PUP.openPage(startUrl);

  console.log(`Opened ${si.name} at ${startUrl}`);

  // Register handlers before login so responses during the BankID flow are
  // captured. onComplete is deferred: if it fires during the pause it is held
  // and only forwarded after the user clicks Continue.
  let continueClicked = false;
  let pendingComplete = null;
  const deferredOnComplete = (result) => {
    if (continueClicked) {
      onComplete && onComplete(result);
    } else {
      pendingComplete = result;
    }
  };

  if (setupPageHandlers) {
    setupPageHandlers(page, nationalID, deferredOnComplete);
  }

  await loginWithBankID(page, nationalID);

  await waitForContinue(`Paused after BankID login on ${si.name}`);
  continueClicked = true;

  // Fire any completion that arrived while paused
  if (pendingComplete !== null) {
    setTimeout(() => onComplete && onComplete(pendingComplete), 500);
  }

  // Start 60-second timeout timer after BankID login
  if (onTimeout) {
    timeoutTimer = setTimeout(() => {
      console.log('SI handler timed out after ' + (HANDLER_TIMEOUT_MS / 1000) + ' seconds');
      onTimeout('HANDLER_TIMEOUT');
    }, HANDLER_TIMEOUT_MS);
  }

  if (SLOW_DOWN_BANK_ID) {
    try {
      await page.waitForSelector("aria/Krav og betaling", { visible: true, timeout: 120000 });
      await page.click("aria/Krav og betaling");
      await page.waitForSelector(".NavigationTile-module_title__ezDhE", { visible: true, timeout: 120000 });
      await page.evaluate(() => {
        const links = document.querySelectorAll('a');
        for (const link of links) {
          if (link.textContent.includes('Bøter, erstatningskrav eller andre krav')) {
            link.click();
            return;
          }
        }
      });
    } catch (err) {
      console.log('SI navigation interrupted (browser may have closed after data capture):', err.message);
    }
  } 

  return { browser, page };
}

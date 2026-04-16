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

  // Defer onComplete until after the user clicks Continue, so the browser
  // isn't closed by the caller while we're still waiting at the pause.
  let pendingComplete = null;
  let resolveResponse;
  const responseReceived = new Promise((resolve) => { resolveResponse = resolve; });
  const deferredOnComplete = (result) => {
    pendingComplete = result;
    resolveResponse();
  };

  if (setupPageHandlers) {
    setupPageHandlers(page, nationalID, deferredOnComplete);
  }

  await loginWithBankID(page, nationalID);

  // Start 60-second timeout timer after BankID login
  if (onTimeout) {
    timeoutTimer = setTimeout(() => {
      console.log('SI handler timed out after ' + (HANDLER_TIMEOUT_MS / 1000) + ' seconds');
      onTimeout('HANDLER_TIMEOUT');
    }, HANDLER_TIMEOUT_MS);
  }

  // Run navigation in the background — don't block on it, wait for the response instead
  if (SLOW_DOWN_BANK_ID) {
    (async () => {
      try {
        console.log('SI: waiting for "Krav og betaling" link...');
        await page.waitForSelector("aria/Krav og betaling", { visible: true, timeout: 120000 });
        console.log('SI: clicking "Krav og betaling"');
        await page.click("aria/Krav og betaling");
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
        console.log('SI: waiting for NavigationTile...');
        await page.waitForSelector("aria/Bøter, erstatningskrav eller andre krav", { visible: true, timeout: 120000 });
        console.log('SI: looking for "Bøter, erstatningskrav eller andre krav" link...');
        await page.click("aria/Bøter, erstatningskrav eller andre krav");
        console.log('SI: link clicked:', clicked);
      } catch (err) {
        console.log('SI navigation error:', err.message);
      }
    })();
  }

  // Wait for the response, then show the continue button
  await responseReceived;

  await waitForContinue(`Paused after operations on ${si.name}`);

  setTimeout(() => onComplete && onComplete(pendingComplete), 500);

  return { browser, page };
}

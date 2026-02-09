import { LIBS } from "./libs.mjs";
import { DEFAULT_TIMEOUT_MS } from "./constants.mjs";
import { handleError, ErrorType, ErrorSeverity } from "./errorHandler.mjs";

/**
 *
 * @type {null | import("puppeteer").Browser}
 */
let browser = null;

/**
 * Prevents multiple simultaneous browser launches
 * @type {Promise<import("puppeteer").Browser> | null}
 */
let browserLaunchPromise = null;

/**
 *
 * @param url {string}
 * @returns {Promise<{browser: import("puppeteer").Browser, page: import("puppeteer").Page}>}
 */
const openPage = async (url) => {
  if (!url) {
    throw Error("URL must start with a valid url");
  }

  try {
    if (browser) {
      //TODO ADD a page to the current browser.
    } else {
      console.log("A new browser is created.");
      
      // Prevent multiple simultaneous browser launches
      if (browserLaunchPromise) {
        console.log("Waiting for existing browser launch to complete...");
        browser = await browserLaunchPromise;
      } else {
        browserLaunchPromise = LIBS.puppeteer.launch({
          headless: false,
          args: ["--no-sandbox, --window-size"],
          // This will make the webcontent fill entire browser-instance.
          defaultViewport: null,
        });
        
        browser = await browserLaunchPromise;
        browserLaunchPromise = null;
      }

      // Set up download behavior for all pages
      browser.on('targetcreated', async (target) => {
        console.log('targetcreated');
        if (target.type() !== 'page') {
          return;
        }
        try {
          const pageList = await browser.pages();
          pageList.forEach((page) => {
            page._client.send('Page.setDownloadBehavior', {
              behavior: 'allow',
              downloadPath: './pdfDownloaded/',
            });
          });
        } catch (e) {
          console.log("targetcreated error:", e);
        }
      });

      browser.once("disconnected", () => {
        console.log("Disconnected!");
        if (browser) {
          browser.close();
          browser = null;
        }
      });
    }

    const [page] = await browser.pages();
    page.setDefaultTimeout(DEFAULT_TIMEOUT_MS);

    await page.goto(url);

    return { browser, page };
  } catch (error) {
    handleError(error, ErrorType.BROWSER, ErrorSeverity.ERROR, { url });
    
    // Cleanup on failure
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Failed to close browser after error:', closeError);
      }
      browser = null;
    }
    browserLaunchPromise = null;
    
    throw error;
  }
};

/**
 * Closes the current browser and resets the browser variable
 * @returns {Promise<void>}
 */
const closeBrowser = async () => {
  if (browser) {
    try {
      await browser.close();
      console.log("Browser closed successfully");
    } catch (error) {
      handleError(error, ErrorType.BROWSER, ErrorSeverity.WARNING, { action: 'closeBrowser' });
    } finally {
      browser = null;
      browserLaunchPromise = null;
    }
  }
};

export const PUP = {
  openPage,
  closeBrowser,
};

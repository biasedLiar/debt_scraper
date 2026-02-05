import { LIBS } from "./libs.mjs";
import { DEFAULT_TIMEOUT_MS } from "./constants.mjs";

/**
 *
 * @type {null | import("puppeteer").Browser}
 */
let browser = null;

/**
 *
 * @param url {string}
 * @returns {Promise<{browser: import("puppeteer").Browser, page: import("puppeteer").Page}>}
 */
const openPage = async (url) => {
  if (!url) {
    throw Error("URL must start with a valid url");
  }

  if (browser) {
    //TODO ADD a page to the current browser.
  } else {
    console.log("A new browser is created.");
    browser = await LIBS.puppeteer.launch({
      headless: false,
      args: ["--no-sandbox, --window-size"],
      // This will make the webcontent fill entire browser-instance.
      defaultViewport: null,
    });

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
};

/**
 * Closes the current browser and resets the browser variable
 * @returns {Promise<void>}
 */
const closeBrowser = async () => {
  if (browser) {
    await browser.close();
    browser = null;
    console.log("Browser closed and reset");
  }
};

export const PUP = {
  openPage,
  closeBrowser,
};

import { LIBS } from "./libs.mjs";

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

    browser.once("disconnected", () => {
      console.log("Disconnected!");
      if (browser) {
        browser.close();
        browser = null;
      }
    });
  }

  const [page] = await browser.pages(true);

  await page.goto(url);

  return { browser, page };
};

export const PUP = {
  openPage,
};

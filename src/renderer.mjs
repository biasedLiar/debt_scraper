/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
import { div, button } from "./dom.mjs";
import { si, digiPost } from "./data.mjs";
import { PUP } from "./scraper.mjs";
import { U } from "./U.mjs";

/**
 *
 * @param url {string}
 * @returns {Promise<void>}
 */
const openPage = async (url) => {
  const { browser, page } = await PUP.openPage(url);

  // @ts-ignore
  page.on("request", (r) => {
    console.log(r.url());
  });
  // @ts-ignore
  page.on("response", async (r) => {
    console.log(r.url());
    console.log(r.ok());

    try {
      const data = await r.text();
      if (U.isJson(data)) {
        console.log(data);
      }
    } catch (e) {
      console.error(e);
    }
  });
};

const di = div();
di.innerText = "Hello World from dom!";

const siButton = button("Gå til si", (ev) => {
  openPage(si.url);
});
const digipostButton = button("Digipost", (ev) => {
  openPage(digiPost.url);
});

document.body.append(siButton);
document.body.append(digipostButton);

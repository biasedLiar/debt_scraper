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

const program = async () => {
  const { browser, page } = await PUP.setUpScraper(digiPost.url);

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
      // console.log(data);
    } catch (e) {
      // console.error(e);
    }
  });
};

const di = div();
di.innerText = "Hello World from dom!";
const btn = button("Gå til si", (ev) => {
  program();
});

document.body.append(btn);

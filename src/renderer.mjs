/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
import { div, button, h1, h2, input } from "./dom.mjs";
import { si, digiPost, kredinor, intrum, tfBank } from "./data.mjs";
import { PUP } from "./scraper.mjs";
import { savePage, createFoldersAndGetName } from "./utilies.mjs";
import { U } from "./U.mjs";

const fs = require("fs");

/**
 *
 * @param url {string}
 * @returns {Promise<void>}
 */
const openPage = async (url) => {
  const nameInput = document.getElementById("nameInput");
  const userName = nameInput ? nameInput.value.trim() || "Unknown" : "Unknown";

  const { browser, page } = await PUP.openPage(url);

  // @ts-ignore
  page.on("request", (r) => {
    console.log(r.url());
  });
  // @ts-ignore
  page.on("response", async (r) => {
    console.log(r.url());
    console.log(r.ok());

    var pageName = (await page.title()).replace(/\s+/g, "_").toLowerCase();
    if (savePage(pageName)) {
      try {
        const filename = createFoldersAndGetName(pageName, userName);

        const data = await r.text();
        if (U.isJson(data)) {
          console.log(data);
          fs.writeFile(filename, data, function (err) {
            if (err) {
              console.log(err);
            }
          });
        }
      } catch (e) {
        console.error("Error:", e);
      }
    }
  });
};

const kredinorButton = button("Kredinor", () => openPage(kredinor.url));
const intrumButton = button("Intrum", () => openPage(intrum.url));
const tfBankButton = button("tfBank", () => openPage(tfBank.url));
const di = div();
di.innerText = "Hello World from dom!";

const heading = h1("Gjeldshjelperen");
const heading2 = h2(
  "Et verktøy for å få oversikt over gjelden din fra forskjellige selskaper"
);
const nameInput = input("Skriv inn navnet", "nameInput");
const siButton = button("Gå til si", (ev) => {
  openPage(si.url);
});
const digipostButton = button("Digipost", (ev) => {
  openPage(digiPost.url);
});
document.body.append(heading);
document.body.append(heading2);
document.body.append(nameInput);

document.body.append(siButton);
document.body.append(digipostButton);
document.body.append(kredinorButton);
document.body.append(intrumButton);
document.body.append(tfBankButton);

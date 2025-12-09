/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
import { div, button, h1, h2 } from "./dom.mjs";
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
  const { browser, page } = await PUP.openPage(url);

  // @ts-ignore
  page.on("request", (r) => {
    console.log(r.url());
  });
  // @ts-ignore
  page.on("response", async (r) => {
    console.log(r.url());
    console.log(r.ok());

<<<<<<< HEAD
    try {
      const data = await r.text();
      var dateObj = new Date();
      const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, "0");
      const day = dateObj.getUTCDate().toString().padStart(2, "0");
      const year = dateObj.getUTCFullYear();

      const newDate = year + "_" + month + "_" + day;
      var pageName = (await page.title()).replace(/\s+/g, "_").toLowerCase();
      if (!fs.existsSync("./exports")) {
        fs.mkdirSync("./exports");
      }

      if (!fs.existsSync("./exports/" + newDate)) {
        fs.mkdirSync("./exports/" + newDate);
      }

      if (!fs.existsSync("./exports/" + newDate + "/" + pageName)) {
        fs.mkdirSync("./exports/" + newDate + "/" + pageName);
      }

      if (U.isJson(data)) {
        console.log(data);
        fs.writeFile(
          "./exports/" +
            newDate +
            "/" +
            pageName +
            "/" +
            dateObj.getTime() +
            ".json",
          data,
          function (err) {
            if (err) {
              console.log(err);
            }
          }
        );
      }
    } catch (e) {
      console.error("Error:", e);
=======
    
    var pageName = (await page.title()).replace(/\s+/g, '_').toLowerCase();
    if (savePage(pageName)){
      try {
        const filename = createFoldersAndGetName(pageName);
  
        const data = await r.text();
        if (U.isJson(data)) {
          console.log(data);
          fs.writeFile(filename, data, function(err) {
            if (err) {
                console.log(err);
            }
          });
        }
      } catch (e) {
        console.error("Error:", e);
      }
>>>>>>> 2d6290bf0121ed6e0d5ae4c59f22a0e640aff4c5
    }
  });
};

const kredinorButton = button("Kredinor", () => openPage(kredinor.url));
const intrumButton = button("Intrum", () => openPage(intrum.url));
const tfBankButton = button("tfBank", () => openPage(tfBank.url));
const di = div();
di.innerText = "Hello World from dom!";

const heading = h1("Gjeld i Norge ");
const heading2 = h2(
  "Et verktøy for å få oversikt over gjelden din fra forskjellige selskaper"
);
const siButton = button("Gå til si", (ev) => {
  openPage(si.url);
});
const digipostButton = button("Digipost", (ev) => {
  openPage(digiPost.url);
});
document.body.append(heading);
document.body.append(heading2);
document.body.append(siButton);
document.body.append(digipostButton);
document.body.append(kredinorButton);
document.body.append(intrumButton);
document.body.append(tfBankButton);

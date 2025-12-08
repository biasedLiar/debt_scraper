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

    try {
      const data = await r.text();
      var dateObj  = new Date();
      const month   = (dateObj.getUTCMonth() + 1).toString().padStart(2,"0");;
      const day     = dateObj.getUTCDate().toString().padStart(2,"0");
      const year    = dateObj.getUTCFullYear();

      const newDate = year + "_" + month + "_" + day;
      var pageName = (await page.title()).replace(/\s+/g, '_').toLowerCase();
      console.log(pageName);
      console.log("./exports/" + newDate + "/" + pageName + ".json");


      if (!fs.existsSync("./exports/" + newDate)){
          fs.mkdirSync("./exports/" + newDate);
      }
      if (U.isJson(data)) {
        console.log(data);
        fs.writeFile("./exports/" + newDate + "/" + pageName + "/" + dateObj.getTime() + ".json", data, function(err) {
          if (err) {
              console.log(err);
          }
        });
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

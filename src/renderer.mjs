/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
import { div, button, h1, h2, input, visualizeDebt } from "./dom.mjs";
import { tfBank } from "./data.mjs";
import { PUP } from "./scraper.mjs";
import { savePage, createFoldersAndGetName } from "./utilities.mjs";
import { U } from "./U.mjs";
import { handleDigipostLogin } from "./pages/digipost.mjs";
import { handleSILogin } from "./pages/statens-innkrevingssentral.mjs";
import { handleKredinorLogin } from "./pages/kredinor.mjs";
import { handleIntrumLogin } from "./pages/intrum.mjs";
import { read_json } from "./json_reader.mjs";

const fs = require("fs");

/**
 *
 * @param url {string}
 * @returns {Promise<void>}
 */
const openPage = async (url) => {
  const nationalIdInput = document.getElementById("nationalIdInput");
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() || "Unknown" : "Unknown";

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
        const filename = createFoldersAndGetName(pageName, nationalID);

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


const tfBankButton = button("tfBank", () => openPage(tfBank.url));
const di = div();
di.innerText = "Hello World from dom!";

const heading = h1("Gjeldshjelperen");
const heading2 = h2(
  "Et verktøy for å få oversikt over gjelden din fra forskjellige selskaper"
);
const nationalIdInput = input("Skriv inn fødselsnummer", "nationalIdInput");
const siButton = button("Gå til si", async (ev) => {
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : '';
  await handleSILogin(nationalID);
});
const digipostButton = button("Digipost", async (ev) => {
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : '';
  await handleDigipostLogin(nationalID);
});

const intrumButton = button("Intrum", async (ev) => {
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : '';
  await handleIntrumLogin(nationalID);
});


const kredinorButton = button("Kredinor", async (ev) => {
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : '';
  await handleKredinorLogin(nationalID);
});



const buttonsContainer = div();
buttonsContainer.append(siButton);
buttonsContainer.append(digipostButton);
buttonsContainer.append(kredinorButton);
buttonsContainer.append(intrumButton);
buttonsContainer.append(tfBankButton);

document.body.append(heading);
document.body.append(heading2);
document.body.append(nationalIdInput);
document.body.append(buttonsContainer);

const {debts_paid, debts_unpaid} = read_json("Statens Innkrevingssentral");
console.log("debtUnpaidVisualization: ", debts_unpaid);


const debtUnpaidVisualization = visualizeDebt(debts_unpaid);

document.body.append(debtUnpaidVisualization);

const debtsPaidVisualization = visualizeDebt(debts_paid);

document.body.append(debtsPaidVisualization);



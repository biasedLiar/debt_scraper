/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
import { div, button, h1, h2, input, visualizeDebt, visualizeTotalDebts } from "./dom.mjs";
import { div, button, h1, h2, input, visualizeDebt, visualizeTotalDebts } from "./dom.mjs";
import { PUP } from "./scraper.mjs";
import { savePage, createFoldersAndGetName, fileContainsNameOfUser, transferFilesAfterLogin } from "./utilities.mjs";
import { U } from "./U.mjs";
import { handleDigipostLogin } from "./pages/digipost.mjs";
import { handleSILogin } from "./pages/statens-innkrevingssentral.mjs";
import { handleKredinorLogin } from "./pages/kredinor.mjs";
import { handleIntrumLogin } from "./pages/intrum.mjs";
import { handleTfBankLogin } from "./pages/tfbank.mjs";
import { read_json, convertlistsToJson } from "./json_reader.mjs";

import { read_json, convertlistsToJson } from "./json_reader.mjs";


const fs = require("fs");
 
let currentWebsite = null;
let userName = null;
let totalDebtAmount = 0;
const offlineMode = true;

const addToTotalDebtAmount = (amount) => {
  totalDebtAmount += amount;
  document.body.querySelector(".total-debt-amount").innerText = totalDebtAmount.toLocaleString('no-NO') + " kr";
}
let totalDebtAmount = 0;
const showPaidDebts = true;
const offlineMode = true;

const foundUnpaidDebts = {
  foundCreditors: [],
  totalAmount: 0, 
  debts: {}
}

const foundPaidDebts = {
  foundCreditors: [],
  totalAmount: 0, 
  debts: {}
}


/**
 * @param {DebtCollection} debtData
 */
const foundDebtBlock = (debtData) => {
  if (debtData.totalAmount <= 0) {
    return;
  }
  
  if (!foundUnpaidDebts.foundCreditors.includes(debtData.creditSite) && debtData.isCurrent) {
    foundUnpaidDebts.foundCreditors.push(debtData.creditSite);
    foundUnpaidDebts.totalAmount += debtData.totalAmount;
    foundUnpaidDebts.debts[debtData.creditSite] = debtData;

    const debtUnpaidVisualization = visualizeDebt(debtData);
    summaryDiv.append(debtUnpaidVisualization);
    
    document.body.querySelector(".total-debt-amount").innerText = foundUnpaidDebts.totalAmount.toLocaleString('no-NO') + " kr";
  }

  if (!foundPaidDebts.foundCreditors.includes(debtData.creditSite) && !debtData.isCurrent) {
    foundPaidDebts.foundCreditors.push(debtData.creditSite);
    foundPaidDebts.totalAmount += debtData.totalAmount;
    foundPaidDebts.debts[debtData.creditSite] = debtData;
    if (showPaidDebts) {
      const debtPaidVisualization = visualizeDebt(debtData);
      summaryDiv.append(debtPaidVisualization);
    }
  }
}

/**
 * Sets up page response handlers to save JSON data
 * @param {any} page - Puppeteer page object
 * @param {string} nationalID - The national identity number
 */
export const setupPageHandlers = (page, nationalID) => {
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
        const data = await r.text();
        const isJson = U.isJson(data);
        const outerFolder = userName ? userName : nationalID;
        const filename = createFoldersAndGetName(pageName, outerFolder, currentWebsite, r.url(), isJson);
        
        console.log("Response data length:", data);
        fs.writeFile(filename, data, function (err) {
          if (err) {
            console.log(err);
          }
        });

        if (fileContainsNameOfUser(filename)) {
          userName = JSON.parse(data).navn.replace(/[^a-zA-Z0-9]/g, "_");
          document.body.querySelector("h1").innerText = "Gjeldshjelper for " + userName.replaceAll("_", " ");
          transferFilesAfterLogin(pageName, userName, currentWebsite, nationalID);
        }

        if (isJson && JSON.parse(data).krav !== undefined) {
          
          const { debts_paid, debts_unpaid } = read_json(currentWebsite, JSON.parse(data).krav);
          foundDebtBlock(debts_unpaid);
          foundDebtBlock(debts_paid);
      
          if (offlineMode) {
            const doucment2 = "..\\exports\\22088242312\\2025_12_15\\Kredinor\\Kredinor\\fulldebtdetails.json";
            const { debtList, creditorList, saksnummerList } = require(doucment2);
            const debts_unpaid2 = convertlistsToJson(debtList, creditorList, saksnummerList, "Kredinor");
            foundDebtBlock(debts_unpaid2);       
          }
        }
      } catch (e) {
        console.error("Error:", e);
      }
    }
  });
};

/**
 *
 * @param url {string}
 * @returns {Promise<void>}
 */
const openPage = async (url) => {
  const nationalIdInput = document.getElementById("nationalIdInput");
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() || "Unknown" : "Unknown";

  const { browser, page } = await PUP.openPage(url);

  setupPageHandlers(page, nationalID);
};


const tfBankButton = button("tfBank", async (ev) => {
  currentWebsite = "tfBank";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : '';
  await handleTfBankLogin(nationalID, setupPageHandlers);
});
const di = div();
di.innerText = "Hello World from dom!";

const heading = h1("Gjeldshjelperen");
const heading2 = h2(
  "Et verktøy for å få oversikt over gjelden din fra forskjellige selskaper", "main-subheading"
);
const nationalIdInput = input("Skriv inn fødselsnummer", "nationalIdInput");

const siButton = button("Gå til si", async (ev) => {
  currentWebsite = "SI";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : '';
  await handleSILogin(nationalID, setupPageHandlers);
});
const digipostButton = button("Digipost", async (ev) => {
  currentWebsite = "Digipost";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : '';
  await handleDigipostLogin(nationalID, setupPageHandlers);
});

const intrumButton = button("Intrum", async (ev) => {
  currentWebsite = "Intrum";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : '';
  await handleIntrumLogin(nationalID, setupPageHandlers);
});


const kredinorButton = button("Kredinor", async (ev) => {
  currentWebsite = "Kredinor";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : '';
  await handleKredinorLogin(nationalID, () => userName, setupPageHandlers);
  await handleKredinorLogin(nationalID, () => userName, setupPageHandlers);
});

// Add Enter key listener to nationalIdInput to trigger SI button
nationalIdInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    siButton.click();
  }
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

nationalIdInput.focus();

const totalVisualization = visualizeTotalDebts(totalDebtAmount.toLocaleString('no-NO') + " kr");
document.body.append(totalVisualization);


const summaryDiv = div({ class: "summary-container" });

if (offlineMode) {
  const doucment = "..\\exports\\Kjetil\\2025_12_10\\tidligere_krav_-_statens_innkrevingssentral\\1765372278120.json";
  const data = require(doucment);
  const { debts_paid, debts_unpaid } = read_json("SI", data.krav);
  foundDebtBlock(debts_unpaid);
  foundDebtBlock(debts_paid);    

  const doucment2 = "..\\exports\\22088242312\\2025_12_15\\Kredinor\\Kredinor\\fulldebtdetails.json";
  const { debtList, creditorList, saksnummerList } = require(doucment2);
  const debts_unpaid2 = convertlistsToJson(debtList, creditorList, saksnummerList, "Ikke-kredinor");
  foundDebtBlock(debts_unpaid2);             
}

document.body.append(summaryDiv);


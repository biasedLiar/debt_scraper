/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
import { div, button, h1, h2, input, visualizeDebt, visualizeTotalDebts } from "./dom.mjs";
import { PUP } from "./scraper.mjs";
import { savePage, createFoldersAndGetName, fileContainsNameOfUser, transferFilesAfterLogin } from "./utilities.mjs";
import { U } from "./U.mjs";
import { handleDigipostLogin } from "./pages/digipost.mjs";
import { handleSILogin } from "./pages/statens-innkrevingssentral.mjs";
import { handleKredinorLogin } from "./pages/kredinor.mjs";
import { handleIntrumLogin } from "./pages/intrum.mjs";
import { handleTfBankLogin } from "./pages/tfbank.mjs";
import { handlePraGroupLogin } from "./pages/pra-group.mjs";
import { handleZolvaLogin } from "./pages/zolva-as.mjs";
import { read_json } from "./json_reader.mjs";

const fs = require("fs");

// Set to true to show paid debts as well
const showPaidDebts = true;

// Set to true to enable offline mode for testing
const offlineMode = false;
const offlineSIFile = "";
const offlineKredinorFile = "";

 
let currentWebsite = null;
let userName = null;
let totalDebtAmount = 0;
let scrapingCompleteCallback = null; // Callback to signal scraping is done

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
const displayDebtData = (debtData) => {
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
          userName = JSON.parse(data).navn.replace(/[^a-zA-Z0-9æøåÆØÅ]/g, "_");
          const h1Element = document.body.querySelector("h1");
          if (h1Element) {
            h1Element.innerText = "Gjeldshjelper for " + userName.replaceAll("_", " ");
          }
          transferFilesAfterLogin(pageName, userName, currentWebsite, nationalID);
        }

        if (isJson && JSON.parse(data).krav !== undefined) {
          
          const { debts_paid, debts_unpaid } = read_json(currentWebsite, JSON.parse(data).krav);
          displayDebtData(debts_unpaid);
          displayDebtData(debts_paid);
      
          if (offlineMode) {
            const doucment2 = offlineKredinorFile;
            const { debtList, creditorList, saksnummerList } = require(doucment2);
            const debts_unpaid2 = convertListsToJson(debtList, creditorList, saksnummerList, "Kredinor");
            displayDebtData(debts_unpaid2);       
          }
          
          // Signal that scraping is complete for this website
          if (scrapingCompleteCallback) {
            console.log("Scraping complete, signaling callback...");
            setTimeout(() => scrapingCompleteCallback(), 2000); // Small delay to ensure all data is processed
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
 * @param {string} url
 * @returns {Promise<void>}
 */
const openPage = async (url) => {
  const nationalIdInput = document.getElementById("nationalIdInput");
  const nationalID = nationalIdInput
    ? nationalIdInput.value.trim() || "Unknown"
    : "Unknown";

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
const nationalIdInput = input("Skriv inn fødselsnummer", "nationalIdInput", "number");

const siButton = button("Gå til si", async (ev) => {
  currentWebsite = "SI";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
  await handleSILogin(nationalID, setupPageHandlers);
});
const digipostButton = button("Digipost", async (ev) => {
  currentWebsite = "Digipost";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
  await handleDigipostLogin(nationalID, setupPageHandlers);
});

const intrumButton = button("Intrum", async (ev) => {
  currentWebsite = "Intrum";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
  await handleIntrumLogin(nationalID, setupPageHandlers);
});

const kredinorButton = button("Kredinor", async (ev) => {
  currentWebsite = "Kredinor";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : '';
  await handleKredinorLogin(nationalID, () => userName, setupPageHandlers);
  //await handleKredinorLogin(nationalID, () => userName, setupPageHandlers);
});


const praGroupButton = button("PRA Group", async (ev) => {
  currentWebsite = "PRA Group";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : '';
  await handlePraGroupLogin(nationalID, setupPageHandlers);
});
const zolvaButton = button("Zolva AS", async (ev) => { 
  currentWebsite = "Zolva AS";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : '';
  await handleZolvaLogin(nationalID, setupPageHandlers);
});

const visitAllButton = button("Visit All Websites", async (ev) => {
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
  
  if (!nationalID) {
    alert("Please enter national ID first");
    return;
  }

  // Disable button during execution
  ev.target.disabled = true;
  ev.target.innerText = "Visiting websites...";

  const websites = [
    { name: "SI", handler: () => handleSILogin(nationalID, setupPageHandlers) },
    { name: "Kredinor", handler: () => handleKredinorLogin(nationalID, ()=>userName, setupPageHandlers) },
    { name: "Intrum", handler: () => handleIntrumLogin(nationalID, setupPageHandlers) },
    { name: "Digipost", handler: () => handleDigipostLogin(nationalID, setupPageHandlers) },
    { name: "tfBank", handler: () => handleTfBankLogin(nationalID, setupPageHandlers) },
    { name: "PRA Group", handler: () => handlePraGroupLogin(nationalID, setupPageHandlers) },
    { name: "Zolva AS", handler: () => handleZolvaLogin(nationalID, setupPageHandlers) }
  ];

  try {
    for (let i = 0; i < websites.length; i++) {
      const site = websites[i];
      currentWebsite = site.name;
      
      ev.target.innerText = `Visiting ${site.name} (${i + 1}/${websites.length})...`;
      console.log(`Starting visit to ${site.name}`);
      
      // Create a promise that will be resolved when scraping is complete
      const scrapingPromise = new Promise((resolve) => {
        scrapingCompleteCallback = resolve;
        
        // Also set a timeout fallback in case scraping doesn't complete
        setTimeout(() => {
          console.log(`Timeout reached for ${site.name}, moving on...`);
          resolve();
        }, 60000); // 60 second max wait per site
      });
      
      // Open the website
      const { browser, page } = await site.handler();
      
      // Wait for scraping to complete (signaled by the callback)
      console.log(`Waiting for ${site.name} scraping to complete...`);
      await scrapingPromise;
      
      // Reset callback
      scrapingCompleteCallback = null;
      
      // Close the browser automatically
      console.log(`Closing ${site.name} browser...`);
      await PUP.closeBrowser();
      
      // Small delay between websites
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    alert("Finished visiting all websites!");
  } catch (error) {
    console.error("Error during website visits:", error);
    alert("An error occurred. Check console for details.");
    // Clean up
    scrapingCompleteCallback = null;
    try {
      await PUP.closeBrowser();
    } catch (e) {
      console.error("Error closing browser:", e);
    }
  } finally {
    // Re-enable button
    ev.target.disabled = false;
    ev.target.innerText = "Visit All Websites";
  }
});

// Add Enter key listener to nationalIdInput to trigger SI button
nationalIdInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    siButton.click();
  }
});

const buttonsContainer = div();
buttonsContainer.append(visitAllButton);
buttonsContainer.append(siButton);
buttonsContainer.append(digipostButton);
buttonsContainer.append(kredinorButton);
buttonsContainer.append(intrumButton);
buttonsContainer.append(tfBankButton);
buttonsContainer.append(praGroupButton);
buttonsContainer.append(zolvaButton);
document.body.append(heading);
document.body.append(heading2);
document.body.append(nationalIdInput);
document.body.append(buttonsContainer);

nationalIdInput.focus();

const totalVisualization = visualizeTotalDebts(totalDebtAmount.toLocaleString('no-NO') + " kr");
document.body.append(totalVisualization);


const summaryDiv = div({ class: "summary-container" });

if (offlineMode) {
  const doucment = offlineSIFile
  const data = require(doucment);
  const { debts_paid, debts_unpaid } = read_json("SI", data.krav);
  displayDebtData(debts_unpaid);
  displayDebtData(debts_paid);    

  const doucment2 = offlineKredinorFile
  const { debtList, creditorList, saksnummerList } = require(doucment2);
  const debts_unpaid2 = convertListsToJson(debtList, creditorList, saksnummerList, "Ikke-kredinor");
  displayDebtData(debts_unpaid2);             
}

document.body.append(summaryDiv);


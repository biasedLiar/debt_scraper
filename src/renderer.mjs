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
import { 
  read_json, 
  calculateForsinkelsesrenterSum, 
  calculateHovedkravSum,
  calculateOmkostningerSum,
  calculateSalærSum,
  calculateRettsligGebyrSum,
  calculateTotalSaldoSum,
  findHighForsinkelsesrenterCases
} from "./json_reader.mjs";
import { detailedDebtConfig } from "./detailedDebtConfig.js";

const fs = require("fs");
const path = require("path");

/**
 * Validates Norwegian national ID (fødselsnummer)
 * @param {string} nationalID - The national ID to validate
 * @returns {{valid: boolean, error?: string}}
 */
const validateNationalID = (nationalID) => {
  const trimmed = nationalID.trim();
  
  if (!trimmed) {
    return { valid: false, error: "Fødselsnummer er påkrevd" };
  }
  
  if (trimmed.length !== 11) {
    return { valid: false, error: "Fødselsnummer må være nøyaktig 11 siffer" };
  }
  
  return { valid: true };
};

/**
 * Shows validation error message to user
 * @param {string} message - Error message to display
 */
const showValidationError = (message) => {
  const existingError = document.querySelector('.validation-error');
  if (existingError) {
    existingError.remove();
  }
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'validation-error';
  errorDiv.textContent = message;
  errorDiv.style.color = 'red';
  errorDiv.style.marginLeft = '0.5rem';
  errorDiv.style.fontSize = '0.9rem';
  
  nationalIdInput.style.borderColor = 'red';
  nationalIdInput.insertAdjacentElement('afterend', errorDiv);
  
  setTimeout(() => {
    errorDiv.remove();
    nationalIdInput.style.borderColor = '';
  }, 4000);
};

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
          //This is important for visit all websites, do not remove
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
  const validation = validateNationalID(nationalID);
  if (!validation.valid) {
    showValidationError(validation.error);
    return;
  }
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
  const validation = validateNationalID(nationalID);
  if (!validation.valid) {
    showValidationError(validation.error);
    return;
  }
  await handleSILogin(nationalID, setupPageHandlers);
});
const digipostButton = button("Digipost", async (ev) => {
  currentWebsite = "Digipost";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
  const validation = validateNationalID(nationalID);
  if (!validation.valid) {
    showValidationError(validation.error);
    return;
  }
  await handleDigipostLogin(nationalID, setupPageHandlers);
});

const intrumButton = button("Intrum", async (ev) => {
  currentWebsite = "Intrum";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
  const validation = validateNationalID(nationalID);
  if (!validation.valid) {
    showValidationError(validation.error);
    return;
  }
  await handleIntrumLogin(nationalID, setupPageHandlers);
});

const kredinorButton = button("Kredinor", async (ev) => {
  currentWebsite = "Kredinor";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : '';
  const validation = validateNationalID(nationalID);
  if (!validation.valid) {
    showValidationError(validation.error);
    return;
  }
  await handleKredinorLogin(nationalID, () => userName, setupPageHandlers);
});


const praGroupButton = button("PRA Group", async (ev) => {
  currentWebsite = "PRA Group";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : '';
  const validation = validateNationalID(nationalID);
  if (!validation.valid) {
    showValidationError(validation.error);
    return;
  }
  await handlePraGroupLogin(nationalID, setupPageHandlers);
});
const zolvaButton = button("Zolva AS", async (ev) => { 
  currentWebsite = "Zolva AS";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : '';
  const validation = validateNationalID(nationalID);
  if (!validation.valid) {
    showValidationError(validation.error);
    return;
  }
  await handleZolvaLogin(nationalID, setupPageHandlers);
});

const visitAllButton = button("Visit All Websites", async (ev) => {
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
  
  const validation = validateNationalID(nationalID);
  if (!validation.valid) {
    showValidationError(validation.error);
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
        
        // timeout fallback in case scraping doesn't complete
        setTimeout(() => {
          console.log(`Timeout reached for ${site.name}, moving on...`);
          resolve();
        }, 30000); // 30s max wait time
      });
      
      // Open the website and do the scraping
      await site.handler();
      
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
    visitAllButton.click();
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

// Display all detailed debt info sums if available
const detailedDebtInfoPath = path.join(__dirname, "..", "exports", detailedDebtConfig.nationalID, detailedDebtConfig.date, detailedDebtConfig.creditor, detailedDebtConfig.creditor, "detaileddebtinfo.json");
if (fs.existsSync(detailedDebtInfoPath)) {
  const detailedDebtContainer = div({ class: "detailed-debt-container" });
  const creditorHeader = h2(detailedDebtConfig.creditor, "creditor-header");
  detailedDebtContainer.appendChild(creditorHeader);

  const hovedkravSum = calculateHovedkravSum(detailedDebtInfoPath);
  const hovedkravDiv = div({ class: "debt-line-item" });
  hovedkravDiv.innerHTML = `<span class="debt-label">Hovedkrav:</span> <span class="debt-value">${hovedkravSum.toLocaleString('no-NO', {minimumFractionDigits: 2, maximumFractionDigits: 2})} kr</span>`;
  detailedDebtContainer.appendChild(hovedkravDiv);

  const forsinkelsesSum = calculateForsinkelsesrenterSum(detailedDebtInfoPath);
  const forsinkelsesDiv = div({ class: "debt-line-item" });
  forsinkelsesDiv.innerHTML = `<span class="debt-label">Forsinkelsesrenter:</span> <span class="debt-value">${forsinkelsesSum.toLocaleString('no-NO', {minimumFractionDigits: 2, maximumFractionDigits: 2})} kr</span>`;
  detailedDebtContainer.appendChild(forsinkelsesDiv);

  const omkostningerSum = calculateOmkostningerSum(detailedDebtInfoPath);
  const omkostningerDiv = div({ class: "debt-line-item" });
  omkostningerDiv.innerHTML = `<span class="debt-label">Omkostninger:</span> <span class="debt-value">${omkostningerSum.toLocaleString('no-NO', {minimumFractionDigits: 2, maximumFractionDigits: 2})} kr</span>`;
  detailedDebtContainer.appendChild(omkostningerDiv);

  const salærSum = calculateSalærSum(detailedDebtInfoPath);
  const salærDiv = div({ class: "debt-line-item" });
  salærDiv.innerHTML = `<span class="debt-label">Salær:</span> <span class="debt-value">${salærSum.toLocaleString('no-NO', {minimumFractionDigits: 2, maximumFractionDigits: 2})} kr</span>`;
  detailedDebtContainer.appendChild(salærDiv);

  const rettsligGebyrSum = calculateRettsligGebyrSum(detailedDebtInfoPath);
  const rettsligGebyrDiv = div({ class: "debt-line-item" });
  rettsligGebyrDiv.innerHTML = `<span class="debt-label">Rettslig gebyr:</span> <span class="debt-value">${rettsligGebyrSum.toLocaleString('no-NO', {minimumFractionDigits: 2, maximumFractionDigits: 2})} kr</span>`;
  detailedDebtContainer.appendChild(rettsligGebyrDiv);

  const totalSaldoSum = calculateTotalSaldoSum(detailedDebtInfoPath);
  const totalSaldoDiv = div({ class: "debt-line-item" });
  totalSaldoDiv.innerHTML = `<span class="debt-label">Total saldo:</span> <span class="debt-value">${totalSaldoSum.toLocaleString('no-NO', {minimumFractionDigits: 2, maximumFractionDigits: 2})} kr</span>`;
  detailedDebtContainer.appendChild(totalSaldoDiv);

  document.body.append(detailedDebtContainer);

  // Display cases with high Forsinkelsesrenter
  const limit = 20000;
  const highCases = findHighForsinkelsesrenterCases(detailedDebtInfoPath, limit);
  if (highCases.length > 0) {
    const highCasesContainer = div({ class: "high-cases-container" });
    const highCasesHeader = h2(`Saker med Forsinkelsesrenter over 20,000 kr (${highCases.length} saker)`, "debt-small-header");
    highCasesContainer.appendChild(highCasesHeader);

    const casesList = div({ class: "high-cases-list" });
    highCases.forEach(caseItem => {
      const caseDiv = div({ class: "high-case-item" });
      caseDiv.innerHTML = `
        <div class="case-header">Sak #${caseItem.caseNumber}</div>
        <div class="case-detail">Forsinkelsesrenter: <strong>${caseItem.forsinkelsesrenter.toLocaleString('no-NO', {minimumFractionDigits: 2, maximumFractionDigits: 2})} kr</strong></div>
        <div class="case-detail">Hovedkrav: ${caseItem.hovedkrav.toLocaleString('no-NO', {minimumFractionDigits: 2, maximumFractionDigits: 2})} kr</div>
        <div class="case-detail">Total saldo: ${caseItem.totalSaldo.toLocaleString('no-NO', {minimumFractionDigits: 2, maximumFractionDigits: 2})} kr</div>
      `;
      casesList.appendChild(caseDiv);
    });

    highCasesContainer.appendChild(casesList);
    document.body.append(highCasesContainer);
  }
}


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


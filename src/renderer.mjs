/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
import {
  div,
  button,
  h1,
  h2,
  hLine,
  input,
  visualizeDebt,
  visualizeTotalDebts,
  errorBox,
  infoBox
} from "./dom.mjs";
import { PUP } from "./scraper.mjs";
import { savePage, createFoldersAndGetName, fileKnownToContainName, transferFilesAfterLogin, readAllDebtForPerson, isJson } from "./utilities.mjs";
import { ERROR_MESSAGE_DISPLAY_MS, VALIDATION_ERROR_DISPLAY_MS } from "./constants.mjs";
import { validateNationalID, showValidationErrorInDOM } from "./validation.mjs";
import { handleError, ErrorType, ErrorSeverity } from "./errorHandler.mjs";
import { handleDigipostLogin } from "./pages/digipost.mjs";
import { handleSILogin } from "./pages/statens-innkrevingssentral.mjs";
import { handleKredinorLogin } from "./pages/kredinor.mjs";
import { handleIntrumLogin } from "./pages/intrum.mjs";
import { handlePraGroupLogin } from "./pages/pra-group.mjs";
import { handleZolvaLogin } from "./pages/zolva-as.mjs";
import { read_json_for_si, read_json } from "./json_reader.mjs";
import { displayDetailedDebtInfo } from "./detailedDebtDisplay.mjs";

const fs = require("fs");
const path = require("path");

// Try to import detailedDebtConfig, but use empty object if it fails or is empty
let detailedDebtConfig = {};

/**
 * Shows scrape debt error message to user
 * @param {string} title - Error title
 * @param {string} message - Error message to display
 */
const showScrapeDebtError = (title, message) => {
  const existingScrapeDebtError = document.querySelector(".error-box");
  if (existingScrapeDebtError) {
    existingScrapeDebtError.remove();
  }
  const errorBoxElement = errorBox(title, message);

  totalVisualization.insertAdjacentElement("beforebegin", errorBoxElement);

  setTimeout(() => {
    errorBoxElement.remove();
  }, ERROR_MESSAGE_DISPLAY_MS);
};


/**
 * Shows info message to user
 * @param {string} title - Info title
 * @param {string} message - Info message to display
 */
const showInfoBox = (title, message) => {
  const existingInfoBox = document.querySelector(".info-box");
  if (existingInfoBox) {
    existingInfoBox.remove();
  }
  const infoBoxElement = infoBox(title, message);

  totalVisualization.insertAdjacentElement("beforebegin", infoBoxElement);
  setTimeout(() => {
    infoBoxElement.remove();
  }, ERROR_MESSAGE_DISPLAY_MS);
};

/** * Helper function to create debt collector button handlers with consistent pattern
 * @param {string} siteName - Name of the debt collector site
 * @param {Function} handlerFunction - The handler function to call for scraping
 * @param {Object} [options] - Optional configuration
 * @param {boolean} [options.requiresUserName=false] - Whether handler needs userName parameter
 * @returns {Function} Click handler function
 */
const createDebtCollectorButtonHandler = (siteName, handlerFunction, options = {}) => {
  return async (ev) => {
    try {
      currentWebsite = siteName;
      const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
      const validation = validateNationalID(nationalID);
      if (!validation.valid) {
        showValidationErrorInDOM(nationalIdInput, nationalIdContainer, validation.error, VALIDATION_ERROR_DISPLAY_MS);
        return;
      }

      // Create promises for completion and timeout
      let completeCallback, timeoutCallback;
      const completePromise = new Promise((resolve) => { completeCallback = resolve; });
      const timeoutPromise = new Promise((resolve) => { timeoutCallback = resolve; });

      // Start the handler with appropriate parameters
      if (options.requiresUserName) {
        handlerFunction(nationalID, () => userName, setupPageHandlers, {
          onComplete: completeCallback,
          onTimeout: timeoutCallback
        });
      } else {
        handlerFunction(nationalID, setupPageHandlers, {
          onComplete: completeCallback,
          onTimeout: timeoutCallback
        });
      }

      // Wait for result
      const result = await Promise.race([completePromise, timeoutPromise]);

      // Handle result
      handleScrapingResult(result, siteName, ev.target);
    } catch (error) {
      handleError(error, ErrorType.UNKNOWN, ErrorSeverity.ERROR, { siteName, nationalID: '***' });
      showScrapeDebtError("Feil", `Feil ved innhenting av data fra ${siteName}`);
      if (ev.target) {
        ev.target.classList.remove('btn-visited');
        ev.target.classList.add('btn-visit-failed');
      }
    } finally {
      // Ensure browser is always closed
      try {
        await PUP.closeBrowser();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  };
};

/** * Handles the result from a scraping operation
 * @param {string} result - The result status
 * @param {string} siteName - The name of the site being scraped
 * @param {HTMLElement} [buttonElement] - Optional button element to update with visited/failed class
 * @returns {boolean} - Whether the visit was successful (DEBT_FOUND or NO_DEBT_FOUND)
 */
const handleScrapingResult = (result, siteName, buttonElement = null) => {
  let isSuccessful = false;
  
  switch (result) {
    case 'HANDLER_TIMEOUT':
      console.warn(`${siteName} handler timed out after BankID login (60s).`);
      showScrapeDebtError("Tidsavbrudd", `Tidsavbrudd ved henting av gjeldsinformasjon fra ${siteName}.`);
      break;
    case 'DEBT_FOUND':
      console.info(`${siteName} scraping completed successfully, found debt.`);
      isSuccessful = true;
      break;
    case 'NO_DEBT_FOUND':
      console.info(`${siteName} scraping completed successfully, found no debt.`);
      isSuccessful = true;
      break;
    case 'MESSAGES_PROCESSED':
      console.info(`${siteName} scraping completed successfully, processed mails.`);
      isSuccessful = true;
      break;
    case 'TOO_MANY_FAILED_ATTEMPTS':
      console.warn(`${siteName} unsuccessful, too many failed attempts.`);
      showScrapeDebtError("For mange mislykkede påloggingsforsøk", `For mange mislykkede påloggingsforsøk fra ${siteName}.`);
      break;
    case 'UNEXPECTED_STATE':
      console.warn(`${siteName} scraping completed with unexpected state.`);
      showScrapeDebtError("Uventet tilstand", `Innhenting av gjeldsinformasjon fra ${siteName} fullførte ikke siden programmet ikke fant et forventet element ("Totalt skylder du ...")`);
      break;
    default:
      console.error(`${siteName} scraping unsuccessful, something went wrong.`);
      showScrapeDebtError("Feil under innhenting", `Noe gikk galt under innhenting av gjeldsinformasjon fra ${siteName}.`);
      break;
  }
  
  // Update button class if provided
  if (buttonElement) {
    if (isSuccessful) {
      buttonElement.classList.remove('btn-visit-failed');
      buttonElement.classList.add('btn-visited');
    } else {
      buttonElement.classList.remove('btn-visited');
      buttonElement.classList.add('btn-visit-failed');
    }
  }
  
  return isSuccessful;
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
let scrapingCompleteCallback = null; 
let timedOutCallback = null; // Callback to signal scraping is done

const foundUnpaidDebts = {
  foundCreditors: [],
  totalAmount: 0,
  debts: {},
};

const foundPaidDebts = {
  foundCreditors: [],
  totalAmount: 0,
  debts: {},
};

/**
 * @param {DebtCollection} debtData
 */
const displayDebtData = (debtData) => {
  if (debtData.totalAmount <= 0) {
    return;
  }

  if (
    !foundUnpaidDebts.foundCreditors.includes(debtData.creditSite) &&
    debtData.isCurrent
  ) {
    foundUnpaidDebts.foundCreditors.push(debtData.creditSite);
    foundUnpaidDebts.totalAmount += debtData.totalAmount;
    foundUnpaidDebts.debts[debtData.creditSite] = debtData;

    const debtUnpaidVisualization = visualizeDebt(debtData);
    summaryDiv.append(debtUnpaidVisualization);

    document.body.querySelector(".total-debt-amount").innerText =
      foundUnpaidDebts.totalAmount.toLocaleString("no-NO") + " kr";
  }

  if (
    !foundPaidDebts.foundCreditors.includes(debtData.creditSite) &&
    !debtData.isCurrent
  ) {
    foundPaidDebts.foundCreditors.push(debtData.creditSite);
    foundPaidDebts.totalAmount += debtData.totalAmount;
    foundPaidDebts.debts[debtData.creditSite] = debtData;
    if (showPaidDebts) {
      const debtPaidVisualization = visualizeDebt(debtData);
      summaryDiv.append(debtPaidVisualization);
    }
  }
};

/**
 * Sets up page response handlers to save JSON data
 * @param {any} page - Puppeteer page object
 * @param {string} nationalID - The national identity number
 */
export const setupPageHandlers = (page, nationalID, onComplete) => {
  // @ts-ignore
  page.on("request", (r) => {
    console.log(r.url());
  });
  // @ts-ignore
  page.on("response", async (r) => {
    console.log(r.url());
    console.log(r.ok());
    
    // Get response text once and store it
    let data;
    try {
      data = await r.text();
    } catch (e) {
      console.log("Could not get text:", e);
      return;
    }

    try {
      await page.title();
    } catch (e) {
      console.log("Could not get page title:", e);
      return;
    }

    if (!(await page.title())) {
      console.error("Current website not set, cannot save page");
      return;
    }
    console.log("Page name for saving:", (await page.title()));
    var pageName = (await page.title())
      .replace(/\s+/g, "_")
      .replace(/[<>:"/\\|?*]/g, "_")
      .toLowerCase();
    if (savePage(pageName)) {
      try {
        // Skip requests that don't have a body (OPTIONS, failed requests, etc.)
        if (r.request().method() === "OPTIONS" || !r.ok()) {
          console.log("Skipping non-OK or OPTIONS request");
          return;
        }
        const isJsonResult = isJson(data);
        const outerFolder = userName ? userName : nationalID;
        const filename = createFoldersAndGetName(
          pageName,
          outerFolder,
          currentWebsite,
          r.url(),
          isJsonResult
        );

        console.log("Response data length:", data);
        fs.writeFile(filename, data, function (err) {
          if (err) {
            console.log(err);
          }
        });

        if (fileKnownToContainName(filename)) {
          userName = JSON.parse(data).navn.replace(/[^a-zA-Z0-9æøåÆØÅ]/g, "_");
          const h1Element = document.body.querySelector("h1");
          //This is important for visit all websites, do not remove
          if (h1Element) {
            h1Element.innerText =
              "Gjeldshjelper for " + userName.replaceAll("_", " ");
          }
          transferFilesAfterLogin(
            pageName,
            userName,
            currentWebsite,
            nationalID
          );
        }

        if (isJsonResult && JSON.parse(data).krav !== undefined) {
          const { debts_paid, debts_unpaid } = read_json_for_si(
            currentWebsite,
            JSON.parse(data).krav
          );
          const outputPath = createFoldersAndGetName("SI", nationalID, "SI", "DebtsInDebtSchemaFormat", true);
          fs.writeFileSync(outputPath, JSON.stringify(debts_unpaid, null, 2), 'utf-8');

          displayDebtData(debts_unpaid);

          // Signal that scraping is complete for this website
          if (onComplete) {
            if (debts_unpaid.totalAmount > 0) {
              console.log("Scraping complete, signaling callback...");
              setTimeout(() => onComplete('DEBT_FOUND'), 500);
            } else { 
              // SI often finds debt via json so fast it seems as if the site has crashed.
              // So info box is displayed to show that scraping is complete with no debt found.
              console.log("Scraping complete, signaling callback...");
              showInfoBox("Ingen gjeld", `Det er ingen gjeld hos ${currentWebsite}.`);
              setTimeout(() => onComplete('NO_DEBT_FOUND'), 500);
            }
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



const di = div();
di.innerText = "Hello World from dom!";

const heading = h1("Gjeldshjelperen");
const heading2 = h2(
  "Et verktøy for å få oversikt over gjelden din fra forskjellige selskaper",
  "main-subheading new-paragraph"
);

const hLine1 = hLine();
const hLine2 = hLine();

const nationalIdHeader = h2(
  "Skriv inn fødselsnummer og trykk start for å hente gjeld fra alle selskaper:",
  "main-subheading"
);

const heading3 = h2(
  "Eller hent gjeld fra individuelle sider:",
  "main-subheading"
);

const nationalIdInput = input(
  "Skriv inn fødselsnummer",
  "nationalIdInput",
  "number"
);

const siButton = button("Statens Innkrevingssentral", 
  createDebtCollectorButtonHandler('SI', handleSILogin)
);
const digipostButton = button("Digipost", 
  createDebtCollectorButtonHandler('Digipost', handleDigipostLogin)
);

const intrumButton = button("Intrum", 
  createDebtCollectorButtonHandler('Intrum', handleIntrumLogin)
);

const kredinorButton = button("Kredinor", 
  createDebtCollectorButtonHandler('Kredinor', handleKredinorLogin, { requiresUserName: true })
);

const praGroupButton = button("PRA Group", 
  createDebtCollectorButtonHandler('PRA Group', handlePraGroupLogin)
);
const zolvaButton = button("Zolva AS", 
  createDebtCollectorButtonHandler('Zolva AS', handleZolvaLogin)
);

const visitAllButton = button(
  "Start",
  async (ev) => {
    const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";

    const validation = validateNationalID(nationalID);
    if (!validation.valid) {
      showValidationErrorInDOM(nationalIdInput, nationalIdContainer, validation.error, VALIDATION_ERROR_DISPLAY_MS);
      return;
    }

    // Disable button during execution
    ev.target.disabled = true;
    ev.target.innerText = "Starter applikasjon...";

    const websites = [
       
      {
        name: "SI",
        button: siButton,
        handler: (callbacks) => handleSILogin(nationalID, setupPageHandlers, callbacks),
      },
      {
        name: "Kredinor",
        button: kredinorButton,
        handler: (callbacks) =>
          handleKredinorLogin(nationalID, () => userName, setupPageHandlers, callbacks),
      },
      {
        name: "Intrum",
        button: intrumButton,
        handler: (callbacks) => handleIntrumLogin(nationalID, setupPageHandlers, callbacks),
      },
      {
        name: "PRA Group",
        button: praGroupButton,
        handler: (callbacks) => handlePraGroupLogin(nationalID, setupPageHandlers, callbacks),
      },
      {
        name: "Zolva AS",
        button: zolvaButton,
        handler: (callbacks) => handleZolvaLogin(nationalID, setupPageHandlers, callbacks),
      },
      {
        name: "Digipost",
        button: digipostButton,
        handler: (callbacks) => handleDigipostLogin(nationalID, setupPageHandlers, callbacks),
      },
    ];

    try {
      for (let i = 0; i < websites.length; i++) {
        const site = websites[i];
        currentWebsite = site.name;

        ev.target.innerText = `Besøker ${site.name} (${i + 1}/${websites.length})...`;
        console.log(`Starting visit to ${site.name}`);

        // Create a promise that will be resolved when scraping is complete
        const scrapingPromise = new Promise((resolve) => {
          scrapingCompleteCallback = resolve;
        });

        // Create a promise that will be resolved when timeout occurs
        const timedOutPromise = new Promise((resolve) => {
          timedOutCallback = resolve;
        });

        // Wait for scraping to complete (signaled by the callback)
        console.log(`Waiting for ${site.name} scraping to complete...`);

        // Open the website and do the scraping (pass callbacks object to handler)
        site.handler({ 
          onComplete: scrapingCompleteCallback,
          onTimeout: timedOutCallback 
        });
        
        // Wait for either the callback or a timeout
        const result = await Promise.race([scrapingPromise, timedOutPromise]);
        
        // Handle result and get success status
        const siteVisitSuccessful = handleScrapingResult(result, site.name, site.button);


        // Reset callback
        scrapingCompleteCallback = null;

        // Close the browser automatically
        console.log(`Closing ${site.name} browser...`);
        await PUP.closeBrowser();
        
        console.log(`Closed ${site.name} browser.`);
        // Small delay between websites
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log(`Proceeding to next website...`);
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
      ev.target.innerText = "Start";
    }
  },
  "main-start-button"
);

// Add Enter key listener to nationalIdInput to trigger Visit All Websites button
nationalIdInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    visitAllButton.click();
  }
});

const nationalIdContainer = div({ class: "national-id-container" });
nationalIdContainer.append(nationalIdInput);
nationalIdContainer.append(visitAllButton);

const buttonsContainer = div();
buttonsContainer.append(siButton);
buttonsContainer.append(kredinorButton);
buttonsContainer.append(intrumButton);
buttonsContainer.append(praGroupButton);
buttonsContainer.append(zolvaButton);
buttonsContainer.append(digipostButton);
document.body.append(heading);
// document.body.append(heading2);
// document.body.append(hLine1);
document.body.append(nationalIdHeader);
document.body.append(nationalIdContainer);
document.body.append(heading3);
document.body.append(buttonsContainer);
document.body.append(hLine2);

nationalIdInput.focus();

const totalVisualization = visualizeTotalDebts(
  totalDebtAmount.toLocaleString("no-NO") + " kr"
);
document.body.append(totalVisualization);

// Display all detailed debt info sums if available
displayDetailedDebtInfo(detailedDebtConfig);

const summaryDiv = div({ class: "summary-container" });

// Function to load and display saved debt data for a person
const loadSavedDebtData = (personId) => {
  if (!personId || personId.length !== 11) return;
  
  try {
    const debtData = readAllDebtForPerson(personId);
    if (debtData.totalDebt > 0) {
      foundUnpaidDebts.foundCreditors = [];
      foundUnpaidDebts.totalAmount = debtData.totalDebt;
      foundUnpaidDebts.debts = {};

      // Update the total debt display
      const totalDebtElement = document.body.querySelector(".total-debt-amount");
      if (totalDebtElement) {
        totalDebtElement.innerText = debtData.totalDebt.toLocaleString('no-NO') + " kr";
      }

      // Clear summary container
      summaryDiv.innerHTML = '';

      // Group debts by creditor and display, using new format for each case
      Object.entries(debtData.debtsByCreditor).forEach(([creditor, totalAmount]) => {
        const creditorDebts = debtData.detailedDebts.filter(d => d.creditor === creditor);
        // Map each debt to the new format
        const standardizedDebts = creditorDebts.map(d => ({
          caseID: d.id || 'Unknown',
          totalAmount: d.amount,
          originalAmount: d.originalAmount ?? null,
          interestAndFines: d.interestAndFines ?? null,
          originalDueDate: d.originalDueDate ?? null,
          debtCollectorName: creditor,
          originalCreditorName: d.originalCreditorName ?? creditor
        }));
        const debtCollection = {
          debtCollectorName: creditor,
          isCurrent: true,
          totalAmount: totalAmount,
          debts: standardizedDebts
        };

        foundUnpaidDebts.foundCreditors.push(creditor);
        foundUnpaidDebts.debts[creditor] = debtCollection;

        const debtVisualization = visualizeDebt(debtCollection);
        summaryDiv.append(debtVisualization);
      });

      // Log details to console
      console.log(`\n=== DEBT ANALYSIS ===`);
      console.log(`Total Debt: ${debtData.totalDebt.toLocaleString('no-NO')} kr`);
      console.log('\nBy Creditor:');
      Object.entries(debtData.debtsByCreditor).forEach(([creditor, amount]) => {
        console.log(`  ${creditor}: ${amount.toLocaleString('no-NO')} kr`);
      });
      console.log(`\nTotal number of debts: ${debtData.detailedDebts.length}`);
      console.log('=================================\n');
    }
  } catch (error) {
    console.error('Error calculating total debt:', error);
  }
};

// Load saved debt data when input changes
nationalIdInput.addEventListener('blur', () => {
  loadSavedDebtData(nationalIdInput.value.trim());
});

// Also trigger on input (with debounce)
let inputTimeout;
nationalIdInput.addEventListener('input', () => {
  clearTimeout(inputTimeout);
  inputTimeout = setTimeout(() => {
    const personId = nationalIdInput.value.trim();
    if (personId.length === 11) {
      loadSavedDebtData(personId);
    }
  }, 500);
});

if (offlineMode) {
  const document = offlineSIFile;
  const data = require(document);
  const { debts_paid, debts_unpaid } = read_json("SI", data.krav);
  displayDebtData(debts_unpaid);
  displayDebtData(debts_paid);

  const document2 = offlineKredinorFile;
  const { debtList, creditorList, saksnummerList } = require(document2);
  const debts_unpaid2 = convertListsToJson(
    debtList,
    creditorList,
    saksnummerList,
    "Ikke-kredinor"
  );
  displayDebtData(debts_unpaid2);
}

document.body.append(summaryDiv);



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
} from "./dom.mjs";
import { PUP } from "./scraper.mjs";
import {
  savePage,
  createFoldersAndGetName,
  fileKnownToContainName,
  transferFilesAfterLogin,
} from "./utilities.mjs";
import { U } from "./U.mjs";
import { handleDigipostLogin } from "./pages/digipost.mjs";
import { handleSILogin } from "./pages/statens-innkrevingssentral.mjs";
import { handleKredinorLogin } from "./pages/kredinor.mjs";
import { handleIntrumLogin } from "./pages/intrum.mjs";
import { handlePraGroupLogin } from "./pages/pra-group.mjs";
import { handleZolvaLogin } from "./pages/zolva-as.mjs";
import { read_json } from "./json_reader.mjs";
import { displayDetailedDebtInfo } from "./detailedDebtDisplay.mjs";

const fs = require("fs");
const path = require("path");

// Try to import detailedDebtConfig, but use empty object if it fails or is empty
let detailedDebtConfig = {};
try {
  const imported = await import("./detailedDebtConfig.js");
  detailedDebtConfig = imported.detailedDebtConfig || {};
} catch (e) {
  console.log("detailedDebtConfig not available (this is OK)");
}

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
  const existingError = document.querySelector(".validation-error");
  if (existingError) {
    existingError.remove();
  }

  const errorDiv = document.createElement("div");
  errorDiv.className = "validation-error";
  errorDiv.textContent = message;
  errorDiv.style.color = "red";
  errorDiv.style.marginLeft = "0.5rem";
  errorDiv.style.fontSize = "0.9rem";

  nationalIdInput.style.borderColor = "red";
  nationalIdContainer.insertAdjacentElement("afterend", errorDiv);

  setTimeout(() => {
    errorDiv.remove();
    nationalIdInput.style.borderColor = "";
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
export const setupPageHandlers = (page, nationalID) => {
  // @ts-ignore
  page.on("request", (r) => {
    console.log(r.url());
  });
  // @ts-ignore
  page.on("response", async (r) => {
    console.log(r.url());
    console.log(r.ok());
    try {
      await r.text();
    } catch (e) {
      console.log("Could not get text:", e);
      return;
    }
    if (!(await page.title())) {
      console.error("Current website not set, cannot save page");
      return;
    }
    console.log("Page name for saving:", (await page.title()));
    var pageName = (await page.title()).replace(/\s+/g, "_").toLowerCase();
    if (savePage(pageName)) {
      try {
        // Skip requests that don't have a body (OPTIONS, failed requests, etc.)
        if (r.request().method() === "OPTIONS" || !r.ok()) {
          console.log("Skipping non-OK or OPTIONS request");
          return;
        }

        const data = await r.text();
        const isJson = U.isJson(data);
        const outerFolder = userName ? userName : nationalID;
        const filename = createFoldersAndGetName(
          pageName,
          outerFolder,
          currentWebsite,
          r.url(),
          isJson
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

        if (isJson && JSON.parse(data).krav !== undefined) {
          const { debts_paid, debts_unpaid } = read_json(
            currentWebsite,
            JSON.parse(data).krav
          );
          displayDebtData(debts_unpaid);
          displayDebtData(debts_paid);

          if (offlineMode) {
            const doucment2 = offlineKredinorFile;
            const { debtList, creditorList, saksnummerList } = require(
              doucment2
            );
            const debts_unpaid2 = convertListsToJson(
              debtList,
              creditorList,
              saksnummerList,
              "Kredinor"
            );
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

const siButton = button("Statens Innkrevingssentral", async (ev) => {
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
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
  const validation = validateNationalID(nationalID);
  if (!validation.valid) {
    showValidationError(validation.error);
    return;
  }
  await handleKredinorLogin(nationalID, () => userName, setupPageHandlers);
});

const praGroupButton = button("PRA Group", async (ev) => {
  currentWebsite = "PRA Group";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
  const validation = validateNationalID(nationalID);
  if (!validation.valid) {
    showValidationError(validation.error);
    return;
  }
  await handlePraGroupLogin(nationalID, setupPageHandlers);
});
const zolvaButton = button("Zolva AS", async (ev) => {
  currentWebsite = "Zolva AS";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
  const validation = validateNationalID(nationalID);
  if (!validation.valid) {
    showValidationError(validation.error);
    return;
  }
  await handleZolvaLogin(nationalID, setupPageHandlers);
});

const visitAllButton = button(
  "Start",
  async (ev) => {
    const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";

    const validation = validateNationalID(nationalID);
    if (!validation.valid) {
      showValidationError(validation.error);
      return;
    }

    // Disable button during execution
    ev.target.disabled = true;
    ev.target.innerText = "Starter applikasjon...";

    const websites = [
      {
        name: "Kredinor",
        handler: () =>
          handleKredinorLogin(nationalID, () => userName, setupPageHandlers, scrapingCompleteCallback),
      },
      {
        name: "Intrum",
        handler: () => handleIntrumLogin(nationalID, setupPageHandlers, scrapingCompleteCallback),
      },
      {
        name: "SI",
        handler: () => handleSILogin(nationalID, setupPageHandlers),
      },
      {
        name: "Digipost",
        handler: () => handleDigipostLogin(nationalID, setupPageHandlers),
      },
      {
        name: "PRA Group",
        handler: () => handlePraGroupLogin(nationalID, setupPageHandlers),
      },
      {
        name: "Zolva AS",
        handler: () => handleZolvaLogin(nationalID, setupPageHandlers),
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

// Add Enter key listener to nationalIdInput to trigger SI button
nationalIdInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    visitAllButton.click();
  }
});

const nationalIdContainer = div({ class: "national-id-container" });
nationalIdContainer.append(nationalIdInput);
nationalIdContainer.append(visitAllButton);

const buttonsContainer = div();
buttonsContainer.append(siButton);
buttonsContainer.append(digipostButton);
buttonsContainer.append(kredinorButton);
buttonsContainer.append(intrumButton);
buttonsContainer.append(praGroupButton);
buttonsContainer.append(zolvaButton);
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

if (offlineMode) {
  const doucment = offlineSIFile;
  const data = require(doucment);
  const { debts_paid, debts_unpaid } = read_json("SI", data.krav);
  displayDebtData(debts_unpaid);
  displayDebtData(debts_paid);

  const doucment2 = offlineKredinorFile;
  const { debtList, creditorList, saksnummerList } = require(doucment2);
  const debts_unpaid2 = convertListsToJson(
    debtList,
    creditorList,
    saksnummerList,
    "Ikke-kredinor"
  );
  displayDebtData(debts_unpaid2);
}

document.body.append(summaryDiv);

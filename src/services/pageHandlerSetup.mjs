/**
 * Page Handler Setup - Handles Puppeteer page event handlers
 * Sets up response handlers for saving JSON data during scraping
 */

const fs = require("fs");

import { savePage, createFoldersAndGetName, fileKnownToContainName, transferFilesAfterLogin, isJson, createExtractedFoldersAndGetName } from "../utils/utilities.mjs";
import { read_json_for_si } from "../utils/json_reader.mjs";
import { DebtCollectionSchema } from "../utils/schemas.mjs";
import { sessionState } from "../ui/uiState.mjs";
import { showInfoBox } from "../ui/uiNotifications.mjs";

/**
 * Sets up page response handlers to save JSON data
 * @param {any} page - Puppeteer page object
 * @param {string} nationalID - The national identity number
 * @param {Function} displayDebtData - Function to display debt data
 * @param {Function} [onComplete] - Callback when scraping is complete
 */
export function setupPageHandlers(page, nationalID, displayDebtData, onComplete) {
  // @ts-ignore
  page.on("request", (r) => {
    // console.log(r.url());
  });
  
  // @ts-ignore
  page.on("response", async (r) => {
    // console.log(r.url());
    //console.log(r.ok());
    
    // Get response text once and store it
    let data;
    try {
      data = await r.text();
    } catch (e) {
      // console.log("Could not get text:", e);
      return;
    }

    let pageTitle;
    try {
      pageTitle = await page.title();
    } catch (e) {
      console.log("Could not get page title:", e);
      return;
    }

    if (!pageTitle) {
      console.log("Current website not set due to moving on to new site before file was saved. URL:", r.url());
      return;
    }
    
    // console.log("Page name for saving:", pageTitle);
    var pageName = pageTitle
      .replace(/\s+/g, "_")
      .replace(/[<>:"/\\|?*]/g, "_")
      .toLowerCase();
      
    if (savePage(pageName)) {
      try {
        // Skip requests that don't have a body (OPTIONS, failed requests, etc.)
        if (r.request().method() === "OPTIONS" || !r.ok()) {
          // console.log("Skipping non-OK or OPTIONS request");
          return;
        }
        
        const isJsonResult = isJson(data);
        const outerFolder = sessionState.userName ? sessionState.userName : nationalID;
        const filename = createFoldersAndGetName(
          pageName,
          outerFolder,
          sessionState.currentWebsite,
          r.url(),
          isJsonResult
        );

        // console.log("Response data:", data);
        fs.writeFile(filename, data, function (err) {

          if (err) {
            // console.log(err);
          }
        });

        if (fileKnownToContainName(filename)) {
          sessionState.userName = JSON.parse(data).navn.replace(/[^a-zA-Z0-9æøåÆØÅ]/g, "_");
          const h1Element = document.body.querySelector("h1");
          
          // This is important for visit all websites, do not remove
          if (h1Element) {
            h1Element.innerText = "Gjeldshjelper for " + sessionState.userName.replaceAll("_", " ");
          }
          
          transferFilesAfterLogin(
            pageName,
            sessionState.userName,
            sessionState.currentWebsite,
            nationalID
          );
        }

        if (isJsonResult && JSON.parse(data).krav !== undefined) {
          const { debts_paid, debts_unpaid } = read_json_for_si(
            sessionState.currentWebsite,
            JSON.parse(data).krav
          );
          
          // Validate against DebtCollectionSchema
          const validationResult = DebtCollectionSchema.safeParse(debts_unpaid);
          if (!validationResult.success) {
            console.error('DebtCollectionSchema validation failed for SI debts:', validationResult.error);
          }
          const validatedDebts = validationResult.success ? validationResult.data : debts_unpaid;
          
          const outputPath = createExtractedFoldersAndGetName(
            "SI", 
            nationalID
          );
          fs.writeFileSync(outputPath, JSON.stringify(validatedDebts, null, 2), 'utf-8');

          

          if (displayDebtData) {
            displayDebtData(validatedDebts);
          }

          // Signal that scraping is complete for this website
          if (onComplete) {
            if (validatedDebts.totalAmount > 0) {
              console.log("Scraping complete, signaling callback...");
              setTimeout(() => onComplete('DEBT_FOUND'), 500);
            } else { 
              // SI often finds debt via json so fast it seems as if the site has crashed.
              // So info box is displayed to show that scraping is complete with no debt found.
              console.log("Scraping complete, signaling callback...");
              showInfoBox("Ingen gjeld", `Det er ingen gjeld hos ${sessionState.currentWebsite}.`);
              setTimeout(() => onComplete('NO_DEBT_FOUND'), 500);
            }
          }
        }
      } catch (e) {
        console.error("Error:", e);
      }
    }
  });
}

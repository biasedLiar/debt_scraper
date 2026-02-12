/**
 * Scraping service - Handles scraping orchestration and button handlers
 * Manages the entire scraping workflow
 */

import { PUP } from "./scraper.mjs";
import { validateNationalID, showValidationErrorInDOM } from "../utils/validation.mjs";
import { VALIDATION_ERROR_DISPLAY_MS } from "../utils/constants.mjs";
import { handleError, ErrorType, ErrorSeverity } from "../utils/errorHandler.mjs";
import { showScrapeDebtError, showInfoBox } from "../ui/uiNotifications.mjs";
import { sessionState } from "../ui/uiState.mjs";
import { loadSavedDebtData } from "./dataLoader.mjs";

/**
 * Handles the result from a scraping operation
 * @param {string} result - The result status ('DEBT_FOUND', 'NO_DEBT_FOUND', 'HANDLER_TIMEOUT', etc.)
 * @param {string} siteName - The name of the site being scraped
 * @param {HTMLElement} [buttonElement] - Optional button element to update
 * @param {string} [personId] - Optional person ID to load saved debt data
 * @param {HTMLElement} [summaryDiv] - Optional summary container for displaying debt
 * @returns {boolean} - Whether the visit was successful
 */
export function handleScrapingResult(result, siteName, buttonElement = null, personId = null, summaryDiv = null) {
  let isSuccessful = false;
  
  switch (result) {
    case 'HANDLER_TIMEOUT':
      console.warn(`${siteName} handler timed out after BankID login (60s).`);
      showScrapeDebtError("Tidsavbrudd", `Tidsavbrudd ved henting av gjeldsinformasjon fra ${siteName}.`);
      break;
    case 'DEBT_FOUND':
      console.info(`${siteName} scraping completed successfully, found debt.`);
      isSuccessful = true;
      // Load saved debt data if personId and summaryDiv are provided
      if (personId && summaryDiv) {
        loadSavedDebtData(personId, summaryDiv);
      }
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
      showScrapeDebtError(
        "For mange mislykkede påloggingsforsøk", 
        `For mange mislykkede påloggingsforsøk fra ${siteName}.`
      );
      break;
    case 'UNEXPECTED_STATE':
      console.warn(`${siteName} scraping completed with unexpected state.`);
      showScrapeDebtError(
        "Uventet tilstand", 
        `Innhenting av gjeldsinformasjon fra ${siteName} fullførte ikke siden programmet ikke fant et forventet element ("Totalt skylder du ...")`
      );
      break;
    default:
      console.error(`${siteName} scraping unsuccessful, something went wrong.`);
      showScrapeDebtError(
        "Feil under innhenting", 
        `Noe gikk galt under innhenting av gjeldsinformasjon fra ${siteName}.`
      );
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
}

/**
 * Creates a button handler for a debt collector site
 * @param {string} siteName - Name of the debt collector site
 * @param {Function} handlerFunction - The handler function to call
 * @param {Function} setupPageHandlers - Function to setup page handlers
 * @param {HTMLInputElement} nationalIdInput - The national ID input element
 * @param {HTMLElement} nationalIdContainer - The national ID container for validation errors
 * @param {HTMLElement} summaryDiv - The summary container for displaying debt
 * @param {Object} [options] - Optional configuration
 * @param {boolean} [options.requiresUserName=false] - Whether handler needs userName parameter
 * @returns {Function} Click handler function
 */
export function createDebtCollectorButtonHandler(
  siteName, 
  handlerFunction, 
  setupPageHandlers,
  nationalIdInput,
  nationalIdContainer,
  summaryDiv,
  options = {}
) {
  return async (ev) => {
    try {
      sessionState.currentWebsite = siteName;
      const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
      const validation = validateNationalID(nationalID);
      
      if (!validation.valid) {
        showValidationErrorInDOM(
          nationalIdInput, 
          nationalIdContainer, 
          validation.error, 
          VALIDATION_ERROR_DISPLAY_MS
        );
        return;
      }

      // Create promises for completion and timeout
      let completeCallback, timeoutCallback;
      const completePromise = new Promise((resolve) => { completeCallback = resolve; });
      const timeoutPromise = new Promise((resolve) => { timeoutCallback = resolve; });

      // Start the handler with appropriate parameters
      if (options.requiresUserName) {
        handlerFunction(
          nationalID, 
          () => sessionState.userName, 
          setupPageHandlers, 
          {
            onComplete: completeCallback,
            onTimeout: timeoutCallback
          }
        );
      } else {
        handlerFunction(
          nationalID, 
          setupPageHandlers, 
          {
            onComplete: completeCallback,
            onTimeout: timeoutCallback
          }
        );
      }

      // Wait for result
      const result = await Promise.race([completePromise, timeoutPromise]);

      // Handle result
      handleScrapingResult(result, siteName, ev.target, nationalID, summaryDiv);
    } catch (error) {
      handleError(error, ErrorType.UNKNOWN, ErrorSeverity.ERROR, { 
        siteName, 
        nationalID: '***' 
      });
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
}

/**
 * Creates the "Visit All" button handler
 * @param {Array} websites - Array of website configurations
 * @param {HTMLInputElement} nationalIdInput - National ID input element
 * @param {HTMLElement} nationalIdContainer - Container for validation errors
 * @param {Function} setupPageHandlers - Function to setup page handlers
 * @param {HTMLElement} summaryDiv - The summary container for displaying debt
 * @returns {Function} Click handler function
 */
export function createVisitAllButtonHandler(
  websites, 
  nationalIdInput, 
  nationalIdContainer,
  setupPageHandlers,
  summaryDiv
) {
  return async (ev) => {
    const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";

    const validation = validateNationalID(nationalID);
    if (!validation.valid) {
      showValidationErrorInDOM(
        nationalIdInput, 
        nationalIdContainer, 
        validation.error, 
        VALIDATION_ERROR_DISPLAY_MS
      );
      return;
    }

    // Disable button during execution
    ev.target.disabled = true;
    ev.target.innerText = "Starter applikasjon...";

    try {
      for (let i = 0; i < websites.length; i++) {
        const site = websites[i];
        sessionState.currentWebsite = site.name;

        ev.target.innerText = `Besøker ${site.name} (${i + 1}/${websites.length})...`;
        console.log(`Starting visit to ${site.name}`);

        // Create promises for completion and timeout
        const scrapingPromise = new Promise((resolve) => {
          sessionState.scrapingCompleteCallback = resolve;
        });

        const timedOutPromise = new Promise((resolve) => {
          sessionState.timedOutCallback = resolve;
        });

        console.log(`Waiting for ${site.name} scraping to complete...`);

        // Start the scraping with callbacks
        site.handler({ 
          onComplete: sessionState.scrapingCompleteCallback,
          onTimeout: sessionState.timedOutCallback 
        });
        
        // Wait for result
        const result = await Promise.race([scrapingPromise, timedOutPromise]);
        
        // Handle result
        handleScrapingResult(result, site.name, site.button, nationalID, summaryDiv);

        // Reset callback
        sessionState.scrapingCompleteCallback = null;
        sessionState.timedOutCallback = null;

        // Close the browser
        console.log(`Closing ${site.name} browser...`);
        await PUP.closeBrowser();
        console.log(`Closed ${site.name} browser.`);
        
        // Delay between websites
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log(`Proceeding to next website...`);
      }

      alert("Finished visiting all websites!");

    } catch (error) {
      console.error("Error during website visits:", error);
      alert("An error occurred. Check console for details.");
      
      // Cleanup
      sessionState.scrapingCompleteCallback = null;
      sessionState.timedOutCallback = null;
      
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
  };
}

/**
 * UI notification and display components
 * Handles error boxes, info boxes, and debt display updates
 */

import { errorBox, infoBox, visualizeDebt } from "./dom.mjs";
import { ERROR_MESSAGE_DISPLAY_MS } from "../utils/constants.mjs";
import { foundUnpaidDebts, foundPaidDebts, config } from "./uiState.mjs";

// Reference to totalVisualization element (set via setTotalVisualization)
let totalVisualizationElement = null;

/**
 * Sets the total visualization element reference
 * @param {HTMLElement} element - The total visualization element
 */
export function setTotalVisualization(element) {
  totalVisualizationElement = element;
}

/**
 * Shows error message to user
 * @param {string} title - Error title
 * @param {string} message - Error message to display
 */
export function showScrapeDebtError(title, message) {
  const existingScrapeDebtError = document.querySelector(".error-box");
  if (existingScrapeDebtError) {
    existingScrapeDebtError.remove();
  }
  const errorBoxElement = errorBox(title, message);

  if (totalVisualizationElement) {
    totalVisualizationElement.insertAdjacentElement("beforebegin", errorBoxElement);
  } else {
    document.body.prepend(errorBoxElement);
  }

  setTimeout(() => {
    errorBoxElement.remove();
  }, ERROR_MESSAGE_DISPLAY_MS);
}

/**
 * Shows info message to user
 * @param {string} title - Info title
 * @param {string} message - Info message to display
 */
export function showInfoBox(title, message) {
  const existingInfoBox = document.querySelector(".info-box");
  if (existingInfoBox) {
    existingInfoBox.remove();
  }
  const infoBoxElement = infoBox(title, message);

  if (totalVisualizationElement) {
    totalVisualizationElement.insertAdjacentElement("beforebegin", infoBoxElement);
  } else {
    document.body.prepend(infoBoxElement);
  }
  
  setTimeout(() => {
    infoBoxElement.remove();
  }, ERROR_MESSAGE_DISPLAY_MS);
}

/**
 * Updates the total debt display element
 * @param {number} amount - The total debt amount
 */
export function updateTotalDebtDisplay(amount) {
  const totalDebtElement = document.body.querySelector(".total-debt-amount");
  if (totalDebtElement) {
    totalDebtElement.innerText = amount.toLocaleString("no-NO") + " kr";
  }
}

/**
 * Displays debt data and updates the summary
 * @param {DebtCollection} debtData - The debt collection to display
 * @param {HTMLElement} summaryDiv - The summary container element
 */
export function displayDebtData(debtData, summaryDiv) {
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

    updateTotalDebtDisplay(foundUnpaidDebts.totalAmount);
  }

  if (
    !foundPaidDebts.foundCreditors.includes(debtData.creditSite) &&
    !debtData.isCurrent
  ) {
    foundPaidDebts.foundCreditors.push(debtData.creditSite);
    foundPaidDebts.totalAmount += debtData.totalAmount;
    foundPaidDebts.debts[debtData.creditSite] = debtData;
    
    if (config.showPaidDebts) {
      const debtPaidVisualization = visualizeDebt(debtData);
      summaryDiv.append(debtPaidVisualization);
    }
  }
}

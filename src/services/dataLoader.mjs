/**
 * Data Loader - Handles loading and displaying saved debt data
 * Manages reading historical debt information from exports folder
 */

import { readAllDebtForPerson } from "../utils/utilities.mjs";
import { visualizeDebt } from "../ui/dom.mjs";
import { foundUnpaidDebts, config } from "../ui/uiState.mjs";
import { updateTotalDebtDisplay } from "../ui/uiNotifications.mjs";
import { read_json } from "../utils/json_reader.mjs";

/**
 * Loads and displays saved debt data for a person ID
 * @param {string} personId - Person's national ID (11 digits)
 * @param {HTMLElement} summaryDiv - The summary container element
 */
export function loadSavedDebtData(personId, summaryDiv) {
  if (!personId || personId.length !== 11) return;
  
  try {
    const debtData = readAllDebtForPerson(personId);
    if (debtData.totalDebt > 0) {
      // Reset debt tracking
      foundUnpaidDebts.foundCreditors = [];
      foundUnpaidDebts.totalAmount = debtData.totalDebt;
      foundUnpaidDebts.debts = {};

      // Update the total debt display
      updateTotalDebtDisplay(debtData.totalDebt);

      // Clear summary container
      summaryDiv.innerHTML = '';

      // Group debts by creditor and display
      Object.entries(debtData.debtsByCreditor).forEach(([creditor, totalAmount]) => {
        const creditorDebts = debtData.detailedDebts.filter(d => d.creditor === creditor);
        
        // Map each debt to standardized format
        const standardizedDebts = creditorDebts.map(d => ({
          caseID: d.caseID || 'Unknown',
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
}

/**
 * Sets up event listeners for loading debt data when national ID is entered
 * @param {HTMLInputElement} nationalIdInput - National ID input element
 * @param {HTMLElement} summaryDiv - Summary container element
 */
export function setupDataLoadListeners(nationalIdInput, summaryDiv) {
  // Load data when input loses focus
  nationalIdInput.addEventListener('blur', () => {
    loadSavedDebtData(nationalIdInput.value.trim(), summaryDiv);
  });

  // Also trigger on input with debounce
  let inputTimeout;
  nationalIdInput.addEventListener('input', () => {
    clearTimeout(inputTimeout);
    inputTimeout = setTimeout(() => {
      const personId = nationalIdInput.value.trim();
      if (personId.length === 11) {
        loadSavedDebtData(personId, summaryDiv);
      }
    }, 500);
  });
}

/**
 * Loads offline mode data for testing
 * @param {HTMLElement} summaryDiv - Summary container element
 * @param {Function} displayDebtData - Callback to display debt data
 */
export function loadOfflineData(summaryDiv, displayDebtData) {
  if (!config.offlineMode) return;

  try {
    // Load SI offline data
    if (config.offlineSIFile) {
      const document = require(config.offlineSIFile);
      const { debts_paid, debts_unpaid } = read_json("SI", document.krav);
      displayDebtData(debts_unpaid, summaryDiv);
      displayDebtData(debts_paid, summaryDiv);
    }

    // Load Kredinor offline data
    if (config.offlineKredinorFile) {
      // Note: This would need convertListsToJson function
      console.warn('Offline Kredinor data loading not fully implemented');
    }
  } catch (error) {
    console.error('Error loading offline data:', error);
  }
}

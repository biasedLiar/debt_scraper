import { div, h2 } from "./dom.mjs";
import { 
  calculateForsinkelsesrenterSum, 
  calculateHovedkravSum,
  calculateOmkostningerSum,
  calculateSalærSum,
  calculateRettsligGebyrSum,
  calculateTotalSaldoSum,
  findHighForsinkelsesrenterCases
} from "./json_reader.mjs";

const fs = require("fs");
const path = require("path");

/**
 * Displays detailed debt information for a specific creditor
 * @param {Object} detailedDebtConfig - Configuration object with nationalID, date, and creditor (or array of creditors)
 */
export function displayDetailedDebtInfo(detailedDebtConfig) {
  // Only display if detailedDebtConfig is not empty
  if (!detailedDebtConfig || !detailedDebtConfig.nationalID || !detailedDebtConfig.date) {
    return;
  }

  // Support both single creditor and array of creditors
  const creditors = Array.isArray(detailedDebtConfig.creditor) 
    ? detailedDebtConfig.creditor 
    : detailedDebtConfig.creditor ? [detailedDebtConfig.creditor] : [];

  if (creditors.length === 0) {
    return;
  }

  // Process each creditor
  creditors.forEach(creditor => {
    displayCreditorDebtInfo(detailedDebtConfig.nationalID, detailedDebtConfig.date, creditor);
  });
}

/**
 * Displays detailed debt information for a single creditor
 * @param {string} nationalID - National ID
 * @param {string} date - Date folder name
 * @param {string} creditor - Creditor name
 */
function displayCreditorDebtInfo(nationalID, date, creditor) {
  // Determine the correct file path and nested folder based on creditor
  let detailedDebtInfoPath;
  let nestedFolder;
  
  // Handle different creditor-specific folder structures
  if (creditor === "Kredinor") {
    // Kredinor data is in KredinorPDF folder
    detailedDebtInfoPath = path.join(__dirname, "..", "exports", nationalID, date, "KredinorPDF", "Kredinor", "not_json", "extracted_data.json");
  } else if (creditor === "PRA Group") {
    nestedFolder = "Pra_Group";
    detailedDebtInfoPath = path.join(__dirname, "..", "exports", nationalID, date, creditor, nestedFolder, "manuallyfounddebt.json");
  } else {
    // Default structure for Intrum, SI, etc.
    nestedFolder = creditor;
    detailedDebtInfoPath = path.join(__dirname, "..", "exports", nationalID, date, creditor, nestedFolder, "detaileddebtinfo.json");
  }
  
  if (!fs.existsSync(detailedDebtInfoPath)) {
    console.log(`Detailed debt info not found for ${creditor} at ${detailedDebtInfoPath}`);
    return;
  }

  const detailedDebtContainer = div({ class: "detailed-debt-container" });
  const creditorHeader = h2(creditor, "creditor-header");
  detailedDebtContainer.appendChild(creditorHeader);

  const addDebtLine = (label, calculateFn) => {
    const sum = calculateFn(detailedDebtInfoPath);
    const lineDiv = div({ class: "debt-line-item" });
    lineDiv.innerHTML = `<span class="debt-label">${label}:</span> <span class="debt-value">${sum.toLocaleString('no-NO', {minimumFractionDigits: 2, maximumFractionDigits: 2})} kr</span>`;
    detailedDebtContainer.appendChild(lineDiv);
  };

  addDebtLine("Hovedkrav", calculateHovedkravSum);
  addDebtLine("Forsinkelsesrenter", calculateForsinkelsesrenterSum);
  addDebtLine("Omkostninger", calculateOmkostningerSum);
  addDebtLine("Salær", calculateSalærSum);
  addDebtLine("Rettslig gebyr", calculateRettsligGebyrSum);
  addDebtLine("Total saldo", calculateTotalSaldoSum);

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

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
 * @param {Object} detailedDebtConfig - Configuration object with nationalID, date, and creditor
 */
export function displayDetailedDebtInfo(detailedDebtConfig) {
  // Only display if detailedDebtConfig is not empty
  if (!detailedDebtConfig || !detailedDebtConfig.nationalID || !detailedDebtConfig.date || !detailedDebtConfig.creditor) {
    return;
  }

  const detailedDebtInfoPath = path.join(__dirname, "..", "exports", detailedDebtConfig.nationalID, detailedDebtConfig.date, detailedDebtConfig.creditor, detailedDebtConfig.creditor, "detaileddebtinfo.json");
  
  if (!fs.existsSync(detailedDebtInfoPath)) {
    return;
  }

  const detailedDebtContainer = div({ class: "detailed-debt-container" });
  const creditorHeader = h2(detailedDebtConfig.creditor, "creditor-header");
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

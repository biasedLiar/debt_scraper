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

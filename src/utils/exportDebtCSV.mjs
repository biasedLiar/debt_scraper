import { readAllDebtForPerson } from "./debtReader.mjs";
const fs = require("fs/promises");
const path = require("path");

/**
 * Exports all found debts for a person from extracted_data as CSV
 * @param {string} personId - National ID or folder name
 * @param {string} outputCsvPath - Path to save the CSV file
 */
export async function exportDebtsAsCSV(personId, outputCsvPath) {
  // Read all debts for the person
  const debtResult = await readAllDebtForPerson(personId);
  const allDebts = debtResult.detailedDebts || [];
  if (!allDebts || allDebts.length === 0) {
    throw new Error("Ingen gjeld funnet for " + personId);
  }

  // Get all unique keys for CSV header
  const keys = Array.from(
    new Set(allDebts.flatMap(debt => Object.keys(debt)))
  );

  // Build CSV rows
  const csvRows = [keys.join(",")];
  for (const debt of allDebts) {
    const row = keys.map(key => {
      let val = debt[key];
      if (typeof val === "string") {
        // Escape quotes and commas
        val = '"' + val.replace(/"/g, '""') + '"';
      }
      return val ?? "";
    });
    csvRows.push(row.join(","));
  }

  // Write CSV file
  await fs.writeFile(outputCsvPath, csvRows.join("\n"), "utf-8");
  return outputCsvPath;
}

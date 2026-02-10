/**
 * Debt Reader - Reads and aggregates debt data from extracted_data folder
 * Handles multiple creditor data formats (SI, Intrum, Kredinor, PRA Group)
 * File structure: ./extracted_data/{personId}/{date}/{website}_extracted_data.json
 */

const fs = require("fs");
const path = require("path");

/**
 * Finds all extracted data JSON files in a directory
 * Looks for files matching pattern: {website}_extracted_data.json
 * @param {string} dir - Directory to search
 * @returns {string[]} - Array of file paths
 */
function findExtractedDataFiles(dir) {
  const files = [];
  try {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...findExtractedDataFiles(fullPath));
      } else if (item.endsWith('_extracted_data.json')) {
        files.push(fullPath);
      }
    });
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
  }
  return files;
}

/**
 * Processes SI "krav" structure
 * @param {Object} data - JSON data containing krav array
 * @param {Object} result - Result object to populate
 * @param {string} filePath - Source file path for debugging
 */
function processSIData(data, result, filePath) {
  if (!data.krav || !Array.isArray(data.krav)) return;

  data.krav.forEach(krav => {
    const amount = krav.belop || 0;
    
    // Check if debt is unpaid
    let isPaid = true;
    if (krav.forfall && Array.isArray(krav.forfall)) {
      for (let forfall of krav.forfall) {
        if (forfall.gjenstaaendeBeloep && forfall.gjenstaaendeBeloep != 0) {
          isPaid = false;
          break;
        }
      }
    }
    
    if (!isPaid) {
      result.totalDebt += amount;
      const creditor = 'SI';
      result.debtsByCreditor[creditor] = (result.debtsByCreditor[creditor] || 0) + amount;
      result.detailedDebts.push({
        creditor,
        amount,
        caseID: krav.identifikator,
        totalAmount: amount,
        originalAmount: null,
        interestAndFines: null,
        originalDueDate: krav.forfall && krav.forfall[0]?.forfallsdato ? krav.forfall[0].forfallsdato : null,
        debtCollectorName: creditor,
        originalCreditorName: krav.opprinneligKreditor || creditor,
        source: filePath
      });
    }
  });
}

/**
 * Processes Intrum debtCases structure
 * @param {Object} data - JSON data containing debtCases array
 * @param {Object} result - Result object to populate
 * @param {string} filePath - Source file path for debugging
 */
function processIntrumData(data, result, filePath) {
  if (!data.debtCases || !Array.isArray(data.debtCases)) return;

  const seenCases = new Set();
  data.debtCases.forEach(debtCase => {
    if (debtCase.caseNumber && debtCase.totalAmount && debtCase.creditorName) {
      // Avoid duplicates
      const caseKey = `${debtCase.caseNumber}-${debtCase.totalAmount}`;
      if (!seenCases.has(caseKey)) {
        seenCases.add(caseKey);
        const amount = parseFloat(debtCase.totalAmount.replace(',', '.'));
        if (!isNaN(amount)) {
          result.totalDebt += amount;
          const creditor = 'Intrum';
          result.debtsByCreditor[creditor] = (result.debtsByCreditor[creditor] || 0) + amount;
          result.detailedDebts.push({
            creditor,
            amount,
            caseID: debtCase.caseNumber,
            totalAmount: amount,
            originalAmount: debtCase.originalAmount ?? null,
            interestAndFines: debtCase.interestAndFines ?? null,
            originalDueDate: debtCase.originalDueDate ?? null,
            debtCollectorName: creditor,
            originalCreditorName: debtCase.creditorName ?? creditor,
            source: filePath
          });
        }
      }
    }
  });
}

/**
 * Processes Kredinor data structure
 * @param {Object} data - JSON data (array or object with value array)
 * @param {Object} result - Result object to populate
 * @param {string} filePath - Source file path for debugging
 */
function processKredinorData(data, result, filePath) {
  const kredinorData = Array.isArray(data) ? data : (data.value && Array.isArray(data.value) ? data.value : null);
  if (!kredinorData) return;

  const seenKredinorCases = new Set();
  kredinorData.forEach(item => {
    // If item is already in the new format, use it directly
    if (item.caseID && item.totalAmount !== undefined) {
      const caseKey = `${item.caseID}-${item.totalAmount}`;
      if (!seenKredinorCases.has(caseKey)) {
        seenKredinorCases.add(caseKey);
        const amount = parseFloat(item.totalAmount);
        if (!isNaN(amount) && amount > 0) {
          result.totalDebt += amount;
          const creditor = item.debtCollectorName || 'Kredinor';
          result.debtsByCreditor[creditor] = (result.debtsByCreditor[creditor] || 0) + amount;
          result.detailedDebts.push({
            creditor,
            amount,
            id: item.caseID,
            originalAmount: item.originalAmount,
            interestAndFines: item.interestAndFines,
            originalDueDate: item.originalDueDate,
            debtCollectorName: item.debtCollectorName,
            originalCreditorName: item.originalCreditorName,
            source: filePath
          });
        }
      }
    } else if (item.type !== 'grandTotal' && item.totalbeløp && item.saksnummer) {
      // Fallback to old format
      const caseKey = `${item.saksnummer}-${item.totalbeløp}`;
      if (!seenKredinorCases.has(caseKey)) {
        seenKredinorCases.add(caseKey);
        const amount = parseFloat(item.totalbeløp);
        if (!isNaN(amount) && amount > 0) {
          result.totalDebt += amount;
          const creditor = 'Kredinor';
          result.debtsByCreditor[creditor] = (result.debtsByCreditor[creditor] || 0) + amount;
          result.detailedDebts.push({
            creditor,
            amount,
            id: item.saksnummer,
            type: item.oppdragsgiver || 'Unknown',
            typeText: item.opprinneligOppdragsgiver,
            source: filePath
          });
        }
      }
    }
  });
}

/**
 * Processes PRA Group data structure
 * @param {Object} data - JSON data with accountReference and amountNumber
 * @param {Object} result - Result object to populate
 * @param {string} filePath - Source file path for debugging
 */
function processPRAGroupData(data, result, filePath) {
  if (!data.accountReference || !data.amountNumber) return;

  const amount = parseFloat(data.amountNumber);
  if (!isNaN(amount) && amount > 0) {
    result.totalDebt += amount;
    const creditor = 'PRA Group';
    result.debtsByCreditor[creditor] = (result.debtsByCreditor[creditor] || 0) + amount;
    result.detailedDebts.push({
      creditor,
      amount,
      caseID: data.accountReference,
      totalAmount: amount,
      originalAmount: null,
      interestAndFines: null,
      originalDueDate: null,
      debtCollectorName: creditor,
      originalCreditorName: data.accountDetails?.['Tidligere eier'] || creditor,
      source: filePath
    });
  }
}

/**
 * Reads all debt data for a specific person from extracted_data folder
 * @param {string} personId - The person's national ID
 * @returns {{totalDebt: number, debtsByCreditor: Object, detailedDebts: Array}}
 */
export function readAllDebtForPerson(personId) {
  const result = {
    totalDebt: 0,
    debtsByCreditor: {},
    detailedDebts: []
  };

  const extractedDataPath = path.join('./extracted_data', personId);
  
  if (!fs.existsSync(extractedDataPath)) {
    console.log(`No extracted data found for person ${personId}`);
    return result;
  }

  // Find the latest date folder
  const dateFolders = fs.readdirSync(extractedDataPath).filter(item => {
    const fullPath = path.join(extractedDataPath, item);
    return fs.statSync(fullPath).isDirectory() && /^\d{4}_\d{2}_\d{2}$/.test(item);
  }).sort().reverse(); // Sort descending to get latest first

  if (dateFolders.length === 0) {
    console.log(`No date folders found for person ${personId}`);
    return result;
  }

  const latestDateFolder = dateFolders[0];
  const latestDatePath = path.join(extractedDataPath, latestDateFolder);
  console.log(`Using latest date folder: ${latestDateFolder}`);

  const jsonFiles = findExtractedDataFiles(latestDatePath);
  console.log(`Found ${jsonFiles.length} extracted data files for person ${personId} in ${latestDateFolder}`);

  jsonFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      // Process each creditor type
      processSIData(data, result, filePath);
      processIntrumData(data, result, filePath);
      processKredinorData(data, result, filePath);
      processPRAGroupData(data, result, filePath);

    } catch (err) {
      console.error(`Error processing file ${filePath}:`, err);
    }
  });

  console.log(`Total debt for ${personId}: ${result.totalDebt.toLocaleString('no-NO')} kr`);
  console.log('Debts by creditor:', result.debtsByCreditor);
  
  return result;
}

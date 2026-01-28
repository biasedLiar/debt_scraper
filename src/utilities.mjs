const fs = require("fs");
const path = require("path");

/**
 * @param {string} [pageName]
 * @returns {boolean}
 */
export const savePage = (pageName) => {
  const unsavedPages = ["bankid", "id-porten"];
  if (unsavedPages.includes(pageName)) {
    return false;
  }
  console.log("Saving page:", pageName);
  return true;
};

/**
 * @param {string} [pageName]
 * @param {string} [name]
 * @param {string} [currentWebsite]
 * @returns {string}
 */
export const createFoldersAndGetName = (
  pageName,
  name,
  currentWebsite,
  url,
  isJson = true
) => {
  var dateObj = new Date();
  const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = dateObj.getUTCDate().toString().padStart(2, "0");
  const year = dateObj.getUTCFullYear();

  if (!pageName) {
    pageName = "no_page_name";
  }

  if (!name) {
    name = "Unknown";
  }

  if (!currentWebsite) {
    currentWebsite = "Unknown";
  }

  const newDate = year + "_" + month + "_" + day;

  if (!fs.existsSync("./exports")) {
    fs.mkdirSync("./exports");
  }

  if (!fs.existsSync("./exports/" + name)) {
    fs.mkdirSync("./exports/" + name);
  }

  if (!fs.existsSync("./exports/" + name + "/" + newDate)) {
    fs.mkdirSync("./exports/" + name + "/" + newDate);
  }

  if (
    !fs.existsSync("./exports/" + name + "/" + newDate + "/" + currentWebsite)
  ) {
    fs.mkdirSync("./exports/" + name + "/" + newDate + "/" + currentWebsite);
  }

  if (
    !fs.existsSync(
      "./exports/" +
        name +
        "/" +
        newDate +
        "/" +
        currentWebsite +
        "/" +
        pageName
    )
  ) {
    fs.mkdirSync(
      "./exports/" +
        name +
        "/" +
        newDate +
        "/" +
        currentWebsite +
        "/" +
        pageName
    );
  }

  if (
    !fs.existsSync(
      "./exports/" +
        name +
        "/" +
        newDate +
        "/" +
        currentWebsite +
        "/" +
        pageName +
        "/" +
        "not_json"
    )
  ) {
    fs.mkdirSync(
      "./exports/" +
        name +
        "/" +
        newDate +
        "/" +
        currentWebsite +
        "/" +
        pageName +
        "/not_json"
    );
  }
  const url_name = url
    .replace("https://", "")
    .replace(".json", "")
    .replace(/[^a-zA-Z0-9.]/g, "_")
    .toLowerCase();
  let dirname =
    "./exports/" +
    name +
    "/" +
    newDate +
    "/" +
    currentWebsite +
    "/" +
    pageName +
    "/";

  dirname += isJson ? url_name + ".json" : "not_json/" + url_name + ".txt";
  return dirname;
};



/**
 * @param {string} [pageName]
 * @param {string} [name]
 * @param {string} [currentWebsite]
 * @returns {string}
 */
export const createDownloadFoldersAndGetName = (
  pageName,
  name,
  currentWebsite
) => {
  var dateObj = new Date();
  const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = dateObj.getUTCDate().toString().padStart(2, "0");
  const year = dateObj.getUTCFullYear();

  if (!pageName) {
    pageName = "no_page_name";
  }

  if (!name) {
    name = "Unknown";
  }

  if (!currentWebsite) {
    currentWebsite = "Unknown";
  }

  const newDate = year + "_" + month + "_" + day;

  if (!fs.existsSync("./exports")) {
    fs.mkdirSync("./exports");
  }

  if (!fs.existsSync("./exports/" + name)) {
    fs.mkdirSync("./exports/" + name);
  }

  if (!fs.existsSync("./exports/" + name + "/" + newDate)) {
    fs.mkdirSync("./exports/" + name + "/" + newDate);
  }

  if (
    !fs.existsSync("./exports/" + name + "/" + newDate + "/" + currentWebsite)
  ) {
    fs.mkdirSync("./exports/" + name + "/" + newDate + "/" + currentWebsite);
  }

  if (
    !fs.existsSync(
      "./exports/" +
        name +
        "/" +
        newDate +
        "/" +
        currentWebsite +
        "/" +
        pageName
    )
  ) {
    fs.mkdirSync(
      "./exports/" +
        name +
        "/" +
        newDate +
        "/" +
        currentWebsite +
        "/" +
        pageName
    );
  }

  let dirname =
    "./exports/" +
    name +
    "/" +
    newDate +
    "/" +
    currentWebsite +
    "/" +
    pageName;
  return dirname;
};

/**
 * @param {string} [pageName]
 * @param {string} [name]
 * @param {string} [currentWebsite]
 * @param {string} [nationalId]
 */
export const transferFilesAfterLogin = (
  pageName,
  name,
  currentWebsite,
  nationalId
) => {
  var dateObj = new Date();
  const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = dateObj.getUTCDate().toString().padStart(2, "0");
  const year = dateObj.getUTCFullYear();

  if (!pageName) {
    pageName = "no_page_name";
  }

  if (!name) {
    name = "Unknown";
  }

  if (!currentWebsite) {
    currentWebsite = "Unknown";
  }

  const newDate = year + "_" + month + "_" + day;

  if (!fs.existsSync("./exports")) {
    fs.mkdirSync("./exports");
  }

  if (!fs.existsSync("./exports/" + name)) {
    fs.mkdirSync("./exports/" + name);
  }

  if (!fs.existsSync("./exports/" + name + "/" + newDate)) {
    fs.mkdirSync("./exports/" + name + "/" + newDate);
  }

  if (
    !fs.existsSync("./exports/" + name + "/" + newDate + "/" + currentWebsite)
  ) {
    fs.mkdirSync("./exports/" + name + "/" + newDate + "/" + currentWebsite);
  }

  if (
    !fs.existsSync(
      "./exports/" +
        name +
        "/" +
        newDate +
        "/" +
        currentWebsite +
        "/" +
        pageName
    )
  ) {
    fs.mkdirSync(
      "./exports/" +
        name +
        "/" +
        newDate +
        "/" +
        currentWebsite +
        "/" +
        pageName
    );
  }

  if (
    !fs.existsSync(
      "./exports/" +
        name +
        "/" +
        newDate +
        "/" +
        currentWebsite +
        "/" +
        pageName +
        "/" +
        "not_json"
    )
  ) {
    fs.mkdirSync(
      "./exports/" +
        name +
        "/" +
        newDate +
        "/" +
        currentWebsite +
        "/" +
        pageName +
        "/not_json"
    );
  }

  let sourceDir =
    "./exports/" +
    nationalId +
    "/" +
    newDate +
    "/" +
    currentWebsite +
    "/" +
    pageName +
    "/";

  let destDir =
    "./exports/" +
    name +
    "/" +
    newDate +
    "/" +
    currentWebsite +
    "/" +
    pageName +
    "/";

  moveFiles(sourceDir, destDir);

  sourceDir =
    "./exports/" +
    nationalId +
    "/" +
    newDate +
    "/" +
    currentWebsite +
    "/" +
    pageName +
    "/not_json/";

  destDir =
    "./exports/" +
    name +
    "/" +
    newDate +
    "/" +
    currentWebsite +
    "/" +
    pageName +
    "/not_json/";

  moveFiles(sourceDir, destDir);
};

export function moveFiles(sourceDir, destDir) {
  try {
    fs.readdir(sourceDir, (err, files) => {
      if (err) throw err;

      files.forEach((file) => {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(destDir, file);

        fs.rename(sourcePath, destPath, (err) => {
          if (err) {
            console.error(`Error moving file ${file}:`, err);
          } else {
            console.log(`Moved: ${file}`);
          }
        });
      });
    });
  } catch (error) {
    console.error("Error transferring files after login:", error);
  }
}

/**
 * @param {string} [name]
 * @returns {boolean}
 */
export function fileKnownToContainName(name) {
  return name.includes(
    "skatt.skatteetaten.no_api_mii_skyldnerportal_om_meg_api_v1_basisinfo.json"
  );
}

/**
 * Reads all debt data for a specific person from exports folder
 * @param {string} personId - The person's national ID
 * @returns {{totalDebt: number, debtsByCreditor: Object, detailedDebts: Array}}
 */
export function readAllDebtForPerson(personId) {
  const result = {
    totalDebt: 0,
    debtsByCreditor: {},
    detailedDebts: []
  };

  const exportsPath = path.join('./exports', personId);
  
  if (!fs.existsSync(exportsPath)) {
    console.log(`No exports found for person ${personId}`);
    return result;
  }

  // Find the latest date folder
  const dateFolders = fs.readdirSync(exportsPath).filter(item => {
    const fullPath = path.join(exportsPath, item);
    return fs.statSync(fullPath).isDirectory() && /^\d{4}_\d{2}_\d{2}$/.test(item);
  }).sort().reverse(); // Sort descending to get latest first

  if (dateFolders.length === 0) {
    console.log(`No date folders found for person ${personId}`);
    return result;
  }

  const latestDateFolder = dateFolders[0];
  const latestDatePath = path.join(exportsPath, latestDateFolder);
  console.log(`Using latest date folder: ${latestDateFolder}`);

  // Import kravtype mapping
  const { getKravtypeDescription } = require('./kravtypeMapping.mjs');

  // Recursively find all JSON files in the latest date folder only
  const findJsonFiles = (dir) => {
    const files = [];
    try {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...findJsonFiles(fullPath));
        } else if (item.endsWith('.json')) {
          files.push(fullPath);
        }
      });
    } catch (err) {
      console.error(`Error reading directory ${dir}:`, err);
    }
    return files;
  };

  const jsonFiles = findJsonFiles(latestDatePath);
  console.log(`Found ${jsonFiles.length} JSON files for person ${personId} in ${latestDateFolder}`);

  jsonFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      // Handle SI "krav" structure
      if (data.krav && Array.isArray(data.krav)) {
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
              id: krav.identifikator,
              type: krav.kravtype,
              typeText: getKravtypeDescription(krav.kravtype, krav.kravtypetekst),
              source: filePath
            });
          }
        });
      }

      // Handle manually found debt structure (Intrum)
      if (data.debtCases && Array.isArray(data.debtCases)) {
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
                  id: debtCase.caseNumber,
                  type: debtCase.creditorName,
                  source: filePath
                });
              }
            }
          }
        });
      }

      // Handle Kredinor extracted data structure (direct array or data.value array)
      const kredinorData = Array.isArray(data) ? data : (data.value && Array.isArray(data.value) ? data.value : null);
      if (kredinorData) {
        const seenKredinorCases = new Set();
        kredinorData.forEach(item => {
          // Skip grandTotal entry and entries with null totalbeløp
          if (item.type !== 'grandTotal' && item.totalbeløp && item.saksnummer) {
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

      // Handle PRA Group manually found debt structure
      if (data.accountReference && data.amountNumber) {
        const amount = parseFloat(data.amountNumber);
        if (!isNaN(amount) && amount > 0) {
          result.totalDebt += amount;
          const creditor = 'PRA Group';
          result.debtsByCreditor[creditor] = (result.debtsByCreditor[creditor] || 0) + amount;
          result.detailedDebts.push({
            creditor,
            amount,
            id: data.accountReference,
            type: data.accountDetails?.['Tidligere eier'] || 'Unknown',
            typeText: data.accountDetails?.['Nåværende eier'],
            source: filePath
          });
        }
      }


    } catch (err) {
      console.error(`Error processing file ${filePath}:`, err);
    }
  });

  console.log(`Total debt for ${personId}: ${result.totalDebt.toLocaleString('no-NO')} kr`);
  console.log('Debts by creditor:', result.debtsByCreditor);
  
  return result;
} 
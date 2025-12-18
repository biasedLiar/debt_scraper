const fs = require("fs");
const path = require('path');

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
  const url_name = url.replace("https://", "").replace(".json", "").replace(/[^a-zA-Z0-9.]/g, "_").toLowerCase();
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
 * @param {string} [nationalId]
 */
export const transferFilesAfterLogin = (pageName, name, currentWebsite, nationalId) => {
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

  if (!fs.existsSync("./exports/" + name + "/" + newDate + "/" + currentWebsite)) {
    fs.mkdirSync("./exports/" + name + "/" + newDate + "/" + currentWebsite);
  }

  if (!fs.existsSync("./exports/" + name + "/" + newDate + "/" + currentWebsite + "/" + pageName)) {
    fs.mkdirSync("./exports/" + name + "/" + newDate + "/" + currentWebsite + "/" + pageName);
  }

  if (!fs.existsSync("./exports/" + name + "/" + newDate + "/" + currentWebsite + "/" + pageName + "/" + "not_json")) {
    fs.mkdirSync("./exports/" + name + "/" + newDate + "/" + currentWebsite + "/" + pageName + "/not_json");
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

      files.forEach(file => {
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
export function fileContainsNameOfUser(name) {
  return name.includes("skatt.skatteetaten.no_api_mii_skyldnerportal_om_meg_api_v1_basisinfo.json");
}


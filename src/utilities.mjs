/**
 * @param {string} [pageName]
 * @returns {boolean}
 */

const fs = require("fs");

export const savePage = (pageName) => {
  const unsavedPages = ["bankid", "id-porten"];
  if (unsavedPages.includes(pageName)) {
    console.log("Not saving page:", pageName);
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
export const createFoldersAndGetName = (pageName, name, currentWebsite) => {
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
  const filename =
    "./exports/" +
    name +
    "/" +
    newDate +
    "/" +
    currentWebsite +
    "/" +
    pageName +
    "/" +
    dateObj.getTime() +
    ".json";
  return filename;
};

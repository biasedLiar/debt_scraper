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
<<<<<<< HEAD:src/utilies.mjs
export const createFoldersAndGetName = (pageName, name, currentWebsite) => {
=======
export const createFoldersAndGetName = (pageName, name, currentWebsite, url, isJson=true) => {
>>>>>>> 322068ab2d10bcfa0d6c20240527af044c2016f3:src/utilities.mjs
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
<<<<<<< HEAD:src/utilies.mjs
  }

  if (!fs.existsSync("./exports/" + name + "/" + newDate + "/" + currentWebsite + "/" + pageName)) {
    fs.mkdirSync("./exports/" + name + "/" + newDate + "/" + currentWebsite + "/" + pageName);
=======
>>>>>>> 322068ab2d10bcfa0d6c20240527af044c2016f3:src/utilities.mjs
  }

  if (!fs.existsSync("./exports/" + name + "/" + newDate + "/" + currentWebsite + "/" + pageName)) {
    fs.mkdirSync("./exports/" + name + "/" + newDate + "/" + currentWebsite + "/" + pageName);
  }

  if (!fs.existsSync("./exports/" + name + "/" + newDate + "/" + currentWebsite + "/" + pageName + "/" + "not_json")) {
    fs.mkdirSync("./exports/" + name + "/" + newDate + "/" + currentWebsite + "/" + pageName + "/not_json");
  }
  const url_name = url.replace("https://", "").replace(".json", "").replace(/[^a-zA-Z0-9.]/g, "_").toLowerCase();
  let filename =
    "./exports/" +
    name +
    "/" +
    newDate +
    "/" +
    currentWebsite +
<<<<<<< HEAD:src/utilies.mjs
    "/" +
    pageName +
=======
>>>>>>> 322068ab2d10bcfa0d6c20240527af044c2016f3:src/utilities.mjs
    "/" +
    pageName +
    "/";

  filename += isJson ? url_name + ".json" : "not_json/" + url_name + ".txt";
  return filename;
};

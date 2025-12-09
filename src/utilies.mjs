/**
 * @param {string} [pageName]
 * @returns {boolean}
 */
export const savePage = (pageName) => {
    const unsavedPages = ["bankid", "id-porten"];
    console.log("'", unsavedPages[0], "'", " = '", pageName, "' --> ", (unsavedPages[0] === pageName));
  if (unsavedPages.includes(pageName)){
    return false;
  }
  return true;
};

/**
 * @param {string} [pageName]
 * @returns {string}
 */
export const createFoldersAndGetName = (pageName) => {
    var dateObj  = new Date();
    const month   = (dateObj.getUTCMonth() + 1).toString().padStart(2,"0");;
    const day     = dateObj.getUTCDate().toString().padStart(2,"0");
    const year    = dateObj.getUTCFullYear();

    const newDate = year + "_" + month + "_" + day;
    
    if (!fs.existsSync("./exports")){
        fs.mkdirSync("./exports");
    }

    if (!fs.existsSync("./exports/" + newDate)){
        fs.mkdirSync("./exports/" + newDate);
    }

    if (!fs.existsSync("./exports/" + newDate + "/" + pageName)){
        fs.mkdirSync("./exports/" + newDate + "/" + pageName);
    }
    const filename = "./exports/" + newDate + "/" + pageName + "/" + dateObj.getTime() + ".json";
  return filename;
};

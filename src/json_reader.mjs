

/**
 * @param {string} [pageName]
 * @returns {DebtCollection}
 */

const fs = require("fs");

export const read_json = (creditSite) => {
    const doucment = "C:\\Users\\ebaird\\VSCode\\gjeld-i-norge\\exports\\Kjetil\\2025_12_10\\tidligere_krav_-_statens_innkrevingssentral\\1765372278120.json";
    const data = require(doucment);
    console.log(data);

    const krav = data.krav;

    const out_data = {
        creditSite: creditSite,
        isCurrent: false,
        totalAmount: 0,
        debts: [],
    } 

    for (let i = 0; i < krav.length; i++) {
        const element = krav[i];
        // console.log(element);
        console.log("beløp: ", element.belop, "id: ", element.identifikator);
        out_data.totalAmount += element.belop;
        out_data.debts.push({
            id: element.identifikator,
            amount: element.belop,
            dueDate: element.forfall[0].forfallsdato,
            type: element.kravtype,
            typeText: element.kravtypetekst,
        });
    }

    console.log("--------------");
    console.log(out_data);

    return out_data;
};

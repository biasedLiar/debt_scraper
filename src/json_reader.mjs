const fs = require("fs");

<<<<<<< HEAD
=======




>>>>>>> 855dc745aa1e05f4c7625b39cb8726166f3c11d1
/**
 * @param {string} [creditSite]
 * @param {JSON} [krav]
 * @returns {{DebtCollection, DebtCollection}}
 */

<<<<<<< HEAD
export const read_json = (creditSite) => {
  // TODO: fix pathing to read files as they come in
  const doucment =
    "..\\exports\\Kjetil\\2025_12_10\\tidligere_krav_-_statens_innkrevingssentral\\1765372278120.json";
  const data = require(doucment);
  console.log(data);

  const krav = data.krav;
=======
export const read_json = (creditSite, krav) => {
>>>>>>> 855dc745aa1e05f4c7625b39cb8726166f3c11d1

  const debts_paid = {
    creditSite: creditSite,
    isCurrent: false,
    totalAmount: 0,
    debts: [],
  };

  const debts_unpaid = {
    creditSite: creditSite,
    isCurrent: true,
    totalAmount: 0,
    debts: [],
  };

  for (let i = 0; i < krav.length; i++) {
    const element = krav[i];
    // console.log(element);
    console.log("beløp: ", element.belop, "id: ", element.identifikator);
    const krav_object = {
      id: element.identifikator,
      amount: element.belop,
      dueDate: element.forfall[0].forfallsdato,
      type: element.kravtype,
      typeText: element.kravtypetekst,
    };

<<<<<<< HEAD
    let isPaid = true;
    for (let j = 0; j < element.forfall.length; j++) {
      const forfall = element.forfall[j];
      if (forfall.gjenstaaendeBeloep != 0) {
        isPaid = false;
        break;
      }
=======
        let isPaid = true;
        for (let j = 0; j < element.forfall.length; j++) {
            const forfall = element.forfall[j];
            if (forfall.gjenstaaendeBeloep != 0) {
                isPaid = false;
                break
            }
        }

        if (isPaid) {
            debts_paid.totalAmount += element.belop; 
            debts_paid.debts.push(krav_object);
        } else {
            debts_unpaid.totalAmount += element.belop; 
            debts_unpaid.debts.push(krav_object);
        }
>>>>>>> 855dc745aa1e05f4c7625b39cb8726166f3c11d1
    }

    if (isPaid) {
      debts_paid.totalAmount += element.belop;
      debts_paid.debts.push(krav_object);
    } else {
      out_data_paid_unpaid.totalAmount += element.belop;
      out_data_paid_unpaid.debts.push(krav_object);
    }
  }

  console.log("Paid data: ", debts_paid);
  console.log("Unpaid data: ", debts_unpaid);

  return { debts_paid, debts_unpaid };
};


/**
 * @param {string[]} [debtList]
 * @param {string[]} [creditorList]
 * @param {string[]} [saksnummerList]
 * @param {string} [creditSite]
 * @returns {DebtCollection}
 */
export function convertListsToJson(debtList, creditorList, saksnummerList, creditSite) {

    if (Math.max(debtList.length, creditorList.length, saksnummerList.length) !== 
        Math.min(debtList.length, creditorList.length, saksnummerList.length)) {
        console.log("Error: Lists are not of the same length");
        return null;
    }



    const debts_unpaid = {
        creditSite: creditSite,
        isCurrent: true,
        totalAmount: 0,
        debts: [],
    } 

    for (let i = 0; i < debtList.length; i++) {
        const formattedDebt = parseFloat(debtList[i].replace(/[^0-9,]/g, '').replace(',', '.'));
        const krav_object = {
            id: saksnummerList[i],
            amount: formattedDebt,
            dueDate: null,
            type: creditorList[i],
            typeText: null,
        };

        debts_unpaid.totalAmount += formattedDebt; 
        debts_unpaid.debts.push(krav_object);
    }

    console.log("Unpaid data: ", debts_unpaid);


    return debts_unpaid;

}
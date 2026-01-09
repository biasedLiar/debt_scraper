const fs = require("fs");
import { getKravtypeDescription } from "./kravtypeMapping.mjs";





/**
 * @param {string} [creditSite]
 * @param {JSON} [krav]
 * @returns {{DebtCollection, DebtCollection}}
 */

export const read_json = (creditSite, krav) => {

    const debts_paid = {
        creditSite: creditSite,
        isCurrent: false,
        totalAmount: 0,
        debts: [],
    } 

    const debts_unpaid = {
        creditSite: creditSite,
        isCurrent: true,
        totalAmount: 0,
        debts: [],
    } 

    for (let i = 0; i < krav.length; i++) {
        const element = krav[i];
        // console.log(element);
        console.log("beløp: ", element.belop, "id: ", element.identifikator);
        const krav_object = {
            id: element.identifikator,
            amount: element.belop,
            dueDate: element.forfall[0].forfallsdato,
            type: element.kravtype,
            typeText: getKravtypeDescription(element.kravtype, element.kravtypetekst),
        };

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
    }

    console.log("Paid data: ", debts_paid);
    console.log("Unpaid data: ", debts_unpaid);


    return {debts_paid, debts_unpaid};
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

/**
 * Reads detailed debt info file and calculates sum of a specific field
 * @param {string} filePath - Path to the detaileddebtinfo.json file
 * @param {string} fieldName - The field name to sum (e.g., 'Forsinkelsesrenter', 'Hovedkrav', 'Omkostninger', 'Salær', 'Rettslig gebyr', 'Total saldo')
 * @param {boolean} useStartsWith - If true, matches keys that start with fieldName (useful for 'Forsinkelsesrenter')
 * @returns {number} Sum of all values for the specified field
 */
export function calculateFieldSum(filePath, fieldName, useStartsWith = false) {
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (!data.allDetailedInfo || !Array.isArray(data.allDetailedInfo)) {
            console.log("No allDetailedInfo found in file");
            return 0;
        }

        let sum = 0;
        data.allDetailedInfo.forEach(item => {
            let key;
            if (useStartsWith) {
                key = Object.keys(item).find(k => k.startsWith(fieldName));
            } else {
                key = Object.keys(item).find(k => k === fieldName);
            }
            
            if (key) {
                const value = parseFloat(item[key]);
                if (!isNaN(value)) {
                    sum += value;
                }
            }
        });

        console.log(`Total ${fieldName}:`, sum);
        return sum;
    } catch (error) {
        console.error(`Error calculating ${fieldName} sum:`, error);
        return 0;
    }
}

// Convenience wrapper functions for backward compatibility
export function calculateForsinkelsesrenterSum(filePath) {
    return calculateFieldSum(filePath, 'Forsinkelsesrenter', true);
}

export function calculateHovedkravSum(filePath) {
    return calculateFieldSum(filePath, 'Hovedkrav');
}

export function calculateOmkostningerSum(filePath) {
    return calculateFieldSum(filePath, 'Omkostninger');
}

export function calculateSalærSum(filePath) {
    return calculateFieldSum(filePath, 'Salær');
}

export function calculateRettsligGebyrSum(filePath) {
    return calculateFieldSum(filePath, 'Rettslig gebyr');
}

export function calculateTotalSaldoSum(filePath) {
    return calculateFieldSum(filePath, 'Total saldo');
}

/**
 * Finds cases where Forsinkelsesrenter is above a threshold
 * @param {string} filePath - Path to the detaileddebtinfo.json file
 * @param {number} threshold - Minimum Forsinkelsesrenter value to filter
 * @returns {Array} Array of cases with high Forsinkelsesrenter
 */
export function findHighForsinkelsesrenterCases(filePath, threshold = 20000) {
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (!data.allDetailedInfo || !Array.isArray(data.allDetailedInfo)) {
            console.log("No allDetailedInfo found in file");
            return [];
        }

        const highCases = [];
        data.allDetailedInfo.forEach((item, index) => {
            const forsinkelsesKey = Object.keys(item).find(key => 
                key.startsWith('Forsinkelsesrenter')
            );
            
            if (forsinkelsesKey) {
                const value = parseFloat(item[forsinkelsesKey]);
                if (!isNaN(value) && value > threshold) {
                    highCases.push({
                        caseNumber: index + 1,
                        forsinkelsesrenter: value,
                        hovedkrav: parseFloat(item.Hovedkrav) || 0,
                        totalSaldo: parseFloat(item['Total saldo']) || 0,
                        salær: parseFloat(item.Salær) || 0,
                        rettsligGebyr: parseFloat(item['Rettslig gebyr']) || 0
                    });
                }
            }
        });

        console.log(`Found ${highCases.length} cases with Forsinkelsesrenter above ${threshold}`);
        return highCases;
    } catch (error) {
        console.error("Error finding high Forsinkelsesrenter cases:", error);
        return [];
    }
}
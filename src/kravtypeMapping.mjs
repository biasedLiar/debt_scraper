/**
 * Mapping of kravtype codes to Norwegian descriptions
 * Used as fallback when kravtypetekst is not provided by the API
 */
export const kravtypeMapping = {
  "110": "Bot - forenklet forelegg",
  "111": "Bot - forenklet forelegg ATK",
  "113": "Bot - Vanlig forelegg",
  "129": "Erstatning - Dom",
  "627": "Studielån - oppsagt studielån",
};

/**
 * Get the description for a kravtype code
 * @param {string} kravtype - The kravtype code
 * @param {string} [kravtypetekst] - The kravtype text from API (if available)
 * @returns {string} The description for the kravtype
 */
export const getKravtypeDescription = (kravtype, kravtypetekst) => {
  // Use API text if available, otherwise fall back to mapping
  if (kravtypetekst) {
    return kravtypetekst;
  }
  return kravtypeMapping[kravtype] || kravtype;
};

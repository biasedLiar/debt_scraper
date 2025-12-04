/**
 *
 * @param obj {any}
 * @returns {boolean}
 */
const isJson = (obj) => {
  try {
    JSON.parse(obj);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 *
 * @param str {any}
 */
const prettyJsonOrThrow = (str) => {
  return JSON.parse(str, null, 2);
};
export const U = {
  isJson,
};

// module.exports = {
//   U,
// };

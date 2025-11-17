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
export const U = {
  isJson,
};

// module.exports = {
//   U,
// };

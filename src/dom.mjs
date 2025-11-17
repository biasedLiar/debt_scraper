/**
 * @param {CSSStyleDeclaration} [styles]
 * @returns {HTMLDivElement}
 */
export const div = (styles) => {
  const div = document.createElement("div");
  if (styles) {
    const keys = Object.keys(styles);
    keys.forEach((key) => {
      //@ts-ignore
      div.setAttribute(key, styles[key]);
    });
  }
  return div;
};

/**
 *
 * @param text {string}
 * @param onClick {(this: GlobalEventHandlers, ev: MouseEvent) => any}
 * @returns {HTMLButtonElement}
 */
export const button = (text, onClick) => {
  const b = document.createElement("button");
  b.innerHTML = text;
  b.onclick = onClick;
  return b;
};
const input = document.createElement("input");
const table = document.createElement("table");
const tableHead = document.createElement("thead");
const tableBody = document.createElement("tbody");
const tableRow = document.createElement("tr");
const tableCell = document.createElement("th");

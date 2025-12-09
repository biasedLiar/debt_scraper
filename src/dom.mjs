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
  b.className = "btn btn-primary"
  return b;
};

/**
 *
 * @param text {string}
 * @returns {HTMLHeadingElement}
 */
export const h1 = (text) => {
  const h = document.createElement("h1");
  h.innerHTML = text;
  h.className = "h1 m-2"
  return h;
};

export const h2 = (text) => {
  const h = document.createElement("h2");
  h.innerHTML = text;
  h.className = "h2 m-2"
  return h;
};

const input = document.createElement("input");
const table = document.createElement("table");
const tableHead = document.createElement("thead");
const tableBody = document.createElement("tbody");
const tableRow = document.createElement("tr");
const tableCell = document.createElement("th");

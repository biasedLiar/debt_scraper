

/**
 * @param {CSSStyleDeclaration} [styles]
 * @param {string} [class]
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
  b.className = "btn btn-primary";
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
  h.className = "h1 m-2";
  return h;
};

/**
 *
 * @param text {string}
 * @param class {string}
 * @returns {HTMLHeadingElement}
 */
export const h2 = (text, className) => {
  const element = document.createElement("h2");
  element.textContent = text;
  if (className) {
    element.className = "h2 m-2 " + className;
  } else {
    element.className = "h2 m-2";
  }
  return element;
};

/**
 * @param {string} placeholder
 * @param {string} id
 * @returns {HTMLInputElement}
 */
export const input = (placeholder, id) => {
  const inp = document.createElement("input");
  inp.placeholder = placeholder;
  inp.id = id;
  inp.className = "form-control m-2";
  return inp;
};

/**
 * @param {DebtCollection} debtData
 */
export const visualizeDebt = (debtData) => {
  console.log("Visualizing debt data: ", debtData);

  const outerContainer = div({ class: "debt-container" });

  const innerContainer = div({ class: "debt-inner-container" });

  const headerCompany = h2(`${debtData.creditSite} - ${debtData.isCurrent ? "Ubetalt" : "Betalt"}`, "creditor-header");
  innerContainer.appendChild(headerCompany);
  
  const headerNumber = h2(`Sum gjeld:`, "debt-small-header");
  const headerSubtext = h2(`${debtData.totalAmount} kr`, "debt-amount");
  innerContainer.appendChild(headerNumber);
  innerContainer.appendChild(headerSubtext);
  
  outerContainer.appendChild(innerContainer);

  debtData.debts.forEach((debt) => {
    const debtDiv = div({ class: "debt-item" });
    debtDiv.innerHTML = `
            <h3>Sum: ${debt.amount} kr</h3>
            <p>Gjeld ID: ${debt.id}</p>
            <p>Betalingsfrist: ${debt.dueDate.substring(0, 10)}</p>
            <p>Type: ${debt.type} - ${debt.typeText}</p>
        `;
    outerContainer.appendChild(debtDiv);
  });
  return outerContainer;
}


const inputElement = document.createElement("input");
const table = document.createElement("table");
const tableHead = document.createElement("thead");
const tableBody = document.createElement("tbody");
const tableRow = document.createElement("tr");
const tableCell = document.createElement("th");

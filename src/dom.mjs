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
export const button = (text, onClick, className) => {
  const b = document.createElement("button");
  b.innerHTML = text;
  b.onclick = onClick;
  b.className = "btn btn-primary";
  if (className) {
    b.className += " " + className;
  }
  return b;
};

/**
 *
 * @param text {string}
 * @returns {HTMLHeadingElement}
 */
export const h1 = (text, className) => {
  const h = document.createElement("h1");
  h.innerHTML = text;
  h.className = "h1 m-2";
  if (className) {
    h.className += " " + className;
  }
  return h;
};

/**
 *
 * @param text {string}
 * @param className {string}
 * @returns {HTMLHeadingElement}
 */
export const h2 = (text, className) => {
  const element = document.createElement("h2");
  console.log("Creating h2 element with text:", className);
  element.textContent = text;
  if (className) {
    element.className = "h2 m-2 " + className;
    console.log("Assigned className:", element.className);
  } else {
    element.className = "h2 m-2";
  }
  return element;
};

/**
 *
 * @param text {string}
 * @param class {string}
 * @returns {HTMLHeadingElement}
 */
export const h3 = (text, className) => {
  const element = document.createElement("h3");
  element.textContent = text;
  if (className) {
    element.className = "h3 m-2 " + className;
  } else {
    element.className = "h3 m-2";
  }
  return element;
};

/**
 * @param {string} placeholder
 * @param {string} id
 * @param {string} [type]
 * @returns {HTMLInputElement}
 */
export const input = (placeholder, id, type = "text") => {
  const inp = document.createElement("input");
  inp.placeholder = placeholder;
  inp.id = id;
  inp.className = "form-control m-2";
  inp.type = type;
  return inp;
};

/**
 *
 * @param class {string}
 * @returns {HTMLHeadingElement}
 */
export const hLine = (className) => {
  const element = document.createElement("hr");
  if (className) {
    element.className = "hLine " + className;
  } else {
    element.className = "hLine";
  }
  return element;
};

/**
 * @param {DebtCollection} debtData
 */
export const visualizeDebt = (debtData) => {
  const paidStatus = debtData.isCurrent ? "Ubetalt" : "Betalt";
  console.log("Visualizing debt data: ", debtData);

  const outerContainer = div({
    class: `debt-container ${paidStatus.toLowerCase()}`,
  });

  const innerContainer = div({ class: "debt-inner-container" });

  const headerCompany = h2(
    `${debtData.creditSite} - ${paidStatus}`,
    "creditor-header"
  );
  innerContainer.appendChild(headerCompany);

  const headerNumber = h2(`Total:`, "debt-small-header");
  const headerSubtext = h2(
    `${debtData.totalAmount.toLocaleString("no-NO")} kr`,
    "debt-amount"
  );
  innerContainer.appendChild(headerNumber);
  innerContainer.appendChild(headerSubtext);

  outerContainer.appendChild(innerContainer);

  debtData.debts.forEach((debt) => {
    const debtDiv = div({ class: "debt-item" });
    if (debt.dueDate === null) {
      debt.dueDate = "Ukjent";
    }
    const typeText = debt.typeText ? `: ${debt.typeText}` : "";
    
    debtDiv.innerHTML = `
            <h3>Sum: ${debt.amount.toLocaleString("no-NO")} kr</h3>
            <p>Gjeld ID: ${debt.id}</p>
            <p>Betalingsfrist: ${debt.dueDate.substring(0, 10)}</p>
            <p>Type ${debt.type}${typeText}</p>
        `;
    outerContainer.appendChild(debtDiv);
  });
  return outerContainer;
};

/**
 * @param {string} totalAmountString
 */
export const visualizeTotalDebts = (totalAmountString) => {
  const outerContainer = div({ class: `total-debt-container` });

  const headerNumber = h1(`Total registrert gjeld:`, "debt-small-header");
  const headerSubtext = h2(totalAmountString, "total-debt-amount");
  outerContainer.appendChild(headerNumber);
  outerContainer.appendChild(headerSubtext);
  return outerContainer;
};

/**
 * @param {string} header
 * @param {string} message
 */
export const errorBox = (header, message) => {
  const outerContainer = div({ class: `error-box` });

  const headerNumber = h1(header, "debt-small-header");
  const headerSubtext = h2(message, "total-debt-amount");
  outerContainer.appendChild(headerNumber);
  outerContainer.appendChild(headerSubtext);
  return outerContainer;
};

/**
 * @param {string} header
 * @param {string} message
 */
export const infoBox = (header, message) => {
  const outerContainer = div({ class: `info-box` });

  const headerNumber = h1(header, "debt-small-header");
  const headerSubtext = h2(message, "total-debt-amount");
  outerContainer.appendChild(headerNumber);
  outerContainer.appendChild(headerSubtext);
  return outerContainer;
};



const inputElement = document.createElement("input");
const table = document.createElement("table");
const tableHead = document.createElement("thead");
const tableBody = document.createElement("tbody");
const tableRow = document.createElement("tr");
const tableCell = document.createElement("th");

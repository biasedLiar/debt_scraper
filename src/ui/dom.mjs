/**
 * Creates a div element with optional attributes
 * @param {Object} [attributes] - Object with attribute key-value pairs (e.g., {class: 'my-class', id: 'my-id'})
 * @returns {HTMLDivElement}
 */
export const div = (attributes) => {
  const divElement = document.createElement("div");
  if (attributes) {
    Object.keys(attributes).forEach((key) => {
      divElement.setAttribute(key, attributes[key]);
    });
  }
  return divElement;
};

/**
 * Creates a button element
 * @param {string} text - The button text content
 * @param {(this: GlobalEventHandlers, ev: MouseEvent) => any} onClick - Click event handler
 * @param {string} [className] - Optional additional CSS class names
 * @returns {HTMLButtonElement}
 */
export const button = (text, onClick, className) => {
  const b = document.createElement("button");
  b.textContent = text;
  b.onclick = onClick;
  b.className = className ? "btn btn-primary " + className : "btn btn-primary";
  return b;
};

/**
 * Creates an h1 heading element
 * @param {string} text - The text content for the heading
 * @param {string} [className] - Optional additional CSS class names
 * @returns {HTMLHeadingElement}
 */
export const h1 = (text, className) => {
  const h = document.createElement("h1");
  h.textContent = text;
  h.className = className ? "h1 m-2 " + className : "h1 m-2";
  return h;
};

/**
 * Creates an h2 heading element
 * @param {string} text - The text content for the heading
 * @param {string} [className] - Optional additional CSS class names
 * @returns {HTMLHeadingElement}
 */
export const h2 = (text, className) => {
  const element = document.createElement("h2");
  element.textContent = text;
  element.className = className ? "h2 m-2 " + className : "h2 m-2";
  return element;
};

/**
 * Creates an h3 heading element
 * @param {string} text - The text content for the heading
 * @param {string} [className] - Optional additional CSS class names
 * @returns {HTMLHeadingElement}
 */
export const h3 = (text, className) => {
  const element = document.createElement("h3");
  element.textContent = text;
  element.className = className ? "h3 m-2 " + className : "h3 m-2";
  return element;
};

/**
 * Creates an input element
 * @param {string} placeholder - Placeholder text for the input
 * @param {string} id - The ID attribute for the input element
 * @param {string} [type="text"] - Input type (text, password, email, etc.)
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
 * Creates a horizontal line element
 * @param {string} [className] - Optional additional CSS class names
 * @returns {HTMLHRElement}
 */
export const hLine = (className) => {
  const element = document.createElement("hr");
  element.className = className ? "hLine " + className : "hLine";
  return element;
};

/**
 * Creates a visual representation of debt data
 * @param {DebtCollection} debtData - Debt collection data to visualize
 * @returns {HTMLDivElement} Container with formatted debt information
 */
export const visualizeDebt = (debtData) => {
  const paidStatus = debtData.isCurrent ? "Ubetalt" : "Betalt";

  const outerContainer = div({
    class: `debt-container ${paidStatus.toLowerCase()}`,
  });

  const innerContainer = div({ class: "debt-inner-container" });

  // Show creditor and status
  const headerCompany = h2(
    `${debtData.debtCollectorName || debtData.creditSite || "Kreditor"} - ${paidStatus}`,
    "creditor-header"
  );
  innerContainer.appendChild(headerCompany);

  // Show total amount
  const headerNumber = h2(`Total:`, "debt-small-header");
  const headerSubtext = h2(
    `${(debtData.totalAmount ?? 0).toLocaleString("no-NO")} kr`,
    "debt-amount"
  );
  innerContainer.appendChild(headerNumber);
  innerContainer.appendChild(headerSubtext);

  outerContainer.appendChild(innerContainer);

  // Show each case in the new format
  (debtData.debts || []).forEach((debt) => {
    const debtDiv = div({ class: "debt-item" });
    const showBreakdown = debt.originalAmount !== undefined && debt.originalAmount !== null && 
                          debt.interestAndFees !== undefined && debt.interestAndFees !== null;
    const breakdownLines = showBreakdown 
      ? `<p>Opprinnelig beløp: ${debt.originalAmount.toLocaleString("no-NO")} kr</p>
      <p>Renter og gebyrer: ${debt.interestAndFees.toLocaleString("no-NO")} kr</p>` 
      : '';
    debtDiv.innerHTML = `
      <h3>Sum: ${(debt.totalAmount ?? debt.amount ?? 0).toLocaleString("no-NO")} kr</h3>
      <p>Saks-ID: ${debt.caseID || debt.id || "Ukjent"}</p>
      ${breakdownLines}
      <p>Opprinnelig forfallsdato: ${debt.originalDueDate ? (typeof debt.originalDueDate === "string" ? debt.originalDueDate.substring(0, 10) : new Date(debt.originalDueDate).toLocaleDateString("no-NO", {dateStyle: "short"})) : "Ukjent"}</p>
      <p>Opprinnelig kreditor: ${debt.originalCreditorName || "Ukjent"}</p>
    `;
    outerContainer.appendChild(debtDiv);
  });
  return outerContainer;
};

/**
 * Creates a visual display of total debt amount
 * @param {string} totalAmountString - Formatted total debt amount string
 * @returns {HTMLDivElement} Container with total debt display
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
 * Creates an error message box
 * @param {string} header - Error header text
 * @param {string} message - Error message text
 * @returns {HTMLDivElement} Container with error message
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
 * Creates an info message box
 * @param {string} header - Info header text
 * @param {string} message - Info message text
 * @returns {HTMLDivElement} Container with info message
 */
export const infoBox = (header, message) => {
  const outerContainer = div({ class: `info-box` });

  const headerNumber = h1(header, "debt-small-header");
  const headerSubtext = h2(message, "total-debt-amount");
  outerContainer.appendChild(headerNumber);
  outerContainer.appendChild(headerSubtext);
  return outerContainer;
};

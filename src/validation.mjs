/**
 * Validation utilities for user input
 */

/**
 * Validates Norwegian national ID (fødselsnummer)
 * @param {string} nationalID - The national ID to validate
 * @returns {{valid: boolean, error?: string}} Validation result with optional error message
 */
export const validateNationalID = (nationalID) => {
  const trimmed = nationalID.trim();

  if (!trimmed) {
    return { valid: false, error: "Fødselsnummer er påkrevd" };
  }

  if (trimmed.length !== 11) {
    return { valid: false, error: "Fødselsnummer må være nøyaktig 11 siffer" };
  }

  return { valid: true };
};

/**
 * Shows validation error message to user for a specific input field
 * @param {HTMLInputElement} inputElement - The input element to show error for
 * @param {HTMLElement} container - The container to insert error message after
 * @param {string} message - Error message to display
 * @param {number} [displayDuration=4000] - How long to show the error in milliseconds
 */
export const showValidationError = (inputElement, container, message, displayDuration = 4000) => {
  const existingError = document.querySelector(".validation-error");
  if (existingError) {
    existingError.remove();
  }

  const errorDiv = document.createElement("div");
  errorDiv.className = "validation-error";
  errorDiv.textContent = message;
  errorDiv.style.color = "red";
  errorDiv.style.marginLeft = "0.5rem";
  errorDiv.style.fontSize = "0.9rem";

  inputElement.style.borderColor = "red";
  container.insertAdjacentElement("afterend", errorDiv);

  setTimeout(() => {
    errorDiv.remove();
    inputElement.style.borderColor = "";
  }, displayDuration);
};

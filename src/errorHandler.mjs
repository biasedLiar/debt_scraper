/**
 * Centralized error handling module for Gjeld-i-Norge application
 * Provides Norwegian error messages and consistent error handling patterns
 */

export const ErrorType = {
  NETWORK: 'NETWORK',
  FILE_SYSTEM: 'FILE_SYSTEM',
  BROWSER: 'BROWSER',
  AUTHENTICATION: 'AUTHENTICATION',
  VALIDATION: 'VALIDATION',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN'
};

export const ErrorSeverity = {
  CRITICAL: 'CRITICAL',
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  INFO: 'INFO'
};

const norwegianMessages = {
  [ErrorType.NETWORK]: 'Nettverksfeil - Sjekk internettforbindelsen',
  [ErrorType.FILE_SYSTEM]: 'Filfeil - Kunne ikke lese eller skrive fil',
  [ErrorType.BROWSER]: 'Nettleserfeil - Kunne ikke starte eller bruke nettleser',
  [ErrorType.AUTHENTICATION]: 'Innloggingsfeil - BankID-autentisering feilet',
  [ErrorType.VALIDATION]: 'Valideringsfeil - Ugyldig dataformat',
  [ErrorType.TIMEOUT]: 'Tidsavbrudd - Operasjonen tok for lang tid',
  [ErrorType.UNKNOWN]: 'Ukjent feil'
};

/**
 * Handles errors with appropriate logging and user-friendly messages
 * @param {Error} error - The error object
 * @param {string} errorType - Type from ErrorType enum
 * @param {string} errorSeverity - Severity from ErrorSeverity enum
 * @param {Object} context - Additional context about the error
 * @returns {Object} Formatted error information
 */
export function handleError(error, errorType = ErrorType.UNKNOWN, errorSeverity = ErrorSeverity.ERROR, context = {}) {
  const timestamp = new Date().toISOString();
  const norwegianMessage = norwegianMessages[errorType] || norwegianMessages[ErrorType.UNKNOWN];
  
  const errorInfo = {
    timestamp,
    type: errorType,
    severity: errorSeverity,
    message: error.message,
    norwegianMessage,
    context,
    stack: errorSeverity === ErrorSeverity.CRITICAL ? error.stack : undefined
  };

  // Log with appropriate level
  if (errorSeverity === ErrorSeverity.CRITICAL) {
    console.error('CRITICAL ERROR:', norwegianMessage, errorInfo);
  } else if (errorSeverity === ErrorSeverity.ERROR) {
    console.error('ERROR:', norwegianMessage, errorInfo);
  } else if (errorSeverity === ErrorSeverity.WARNING) {
    console.warn('WARNING:', norwegianMessage, errorInfo);
  } else {
    console.log('INFO:', norwegianMessage, errorInfo);
  }

  return errorInfo;
}

/**
 * Wraps async operations with retry logic
 * @param {Function} operation - Async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delayMs - Delay between retries in milliseconds
 * @returns {Promise<any>} Result of the operation
 */
export async function retryOperation(operation, maxRetries = 3, delayMs = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.log(`Forsøk ${attempt}/${maxRetries} feilet:`, error.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError;
}

/**
 * Safe file operation wrapper
 * @param {Function} fileOperation - File operation to execute
 * @param {string} filePath - Path to the file
 * @returns {Promise<any>} Result of the operation or null on failure
 */
export async function safeFileOperation(fileOperation, filePath) {
  try {
    return await fileOperation();
  } catch (error) {
    handleError(error, ErrorType.FILE_SYSTEM, ErrorSeverity.ERROR, { filePath });
    return null;
  }
}

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  handleError(
    new Error(`Unhandled Rejection: ${reason}`),
    ErrorType.UNKNOWN,
    ErrorSeverity.CRITICAL,
    { promise }
  );
});

process.on('uncaughtException', (error) => {
  handleError(error, ErrorType.UNKNOWN, ErrorSeverity.CRITICAL);
  // Don't exit immediately - allow cleanup
  setTimeout(() => process.exit(1), 1000);
});

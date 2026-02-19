/**
 * Application-wide constants
 */

/**
 * Timeout duration (in milliseconds) for handlers after BankID login completes
 * If a handler doesn't complete within this time, onTimeout will be called
 */
export const HANDLER_TIMEOUT_MS = 300000; // 300 seconds
export const INTRUM_HANDLER_TIMEOUT_MS = 3000000; // 3000 seconds

/**
 * File download polling configuration
 */
export const FILE_DOWNLOAD_MAX_ATTEMPTS = 30; // Maximum number of polling attempts
export const FILE_DOWNLOAD_POLL_INTERVAL_MS = 500; // Milliseconds between each poll
export const FILE_DOWNLOAD_FINALIZE_DELAY_MS = 1000; // Wait after detecting file to ensure download is complete

/**
 * Default Puppeteer timeout for waitForSelector and similar methods
 * Set to 3 minutes to accommodate slow-loading pages and user interactions during BankID login
 */
export const DEFAULT_TIMEOUT_MS = 180000; // 3 minutes

/**
 * UI message display timeouts
 */
export const ERROR_MESSAGE_DISPLAY_MS = 60000; // 60 seconds - How long error messages stay visible
export const VALIDATION_ERROR_DISPLAY_MS = 4000; // 4 seconds - How long validation errors stay visible

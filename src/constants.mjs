/**
 * Application-wide constants
 */

/**
 * Timeout duration (in milliseconds) for handlers after BankID login completes
 * If a handler doesn't complete within this time, onTimeout will be called
 */
export const HANDLER_TIMEOUT_MS = 300000; // 300 seconds

/**
 * File download polling configuration
 */
export const FILE_DOWNLOAD_MAX_ATTEMPTS = 30; // Maximum number of polling attempts
export const FILE_DOWNLOAD_POLL_INTERVAL_MS = 500; // Milliseconds between each poll
export const FILE_DOWNLOAD_FINALIZE_DELAY_MS = 1000; // Wait after detecting file to ensure download is complete

/**
 * Centralized UI state management
 * Manages global state for the application
 */

// Configuration
export const config = {
  showPaidDebts: true,
  offlineMode: false,
  offlineSIFile: "",
  offlineKredinorFile: "",
};

// Current scraping session state
export const sessionState = {
  currentWebsite: null,
  userName: null,
  totalDebtAmount: 0,
  scrapingCompleteCallback: null,
  timedOutCallback: null,
};

// Found debts tracking
export const foundUnpaidDebts = {
  foundCreditors: [],
  totalAmount: 0,
  debts: {},
};

export const foundPaidDebts = {
  foundCreditors: [],
  totalAmount: 0,
  debts: {},
};

/**
 * Resets all debt tracking state
 */
export function resetDebtState() {
  foundUnpaidDebts.foundCreditors = [];
  foundUnpaidDebts.totalAmount = 0;
  foundUnpaidDebts.debts = {};
  
  foundPaidDebts.foundCreditors = [];
  foundPaidDebts.totalAmount = 0;
  foundPaidDebts.debts = {};
  
  sessionState.totalDebtAmount = 0;
}

/**
 * Resets session state
 */
export function resetSessionState() {
  sessionState.currentWebsite = null;
  sessionState.userName = null;
  sessionState.scrapingCompleteCallback = null;
  sessionState.timedOutCallback = null;
}

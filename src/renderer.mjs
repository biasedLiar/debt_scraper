/**
 * Main renderer entry point
 * Sets up the UI and wires together all services and components
 */
import {
  div,
  button,
  h1,
  h2,
  hLine,
  input,
  visualizeTotalDebts,
} from "./ui/dom.mjs";
import { displayDetailedDebtInfo } from "./ui/detailedDebtDisplay.mjs";

// Page handlers
import { handleDigipostLogin } from "./pages/digipost.mjs";
import { handleSILogin } from "./pages/statens-innkrevingssentral.mjs";
import { handleKredinorLogin } from "./pages/kredinor.mjs";
import { handleIntrumLogin } from "./pages/intrum.mjs";
import { handlePraGroupLogin } from "./pages/pra-group.mjs";
import { handleZolvaLogin } from "./pages/zolva-as.mjs";

// State management
import { sessionState } from "./ui/uiState.mjs";
import { setTotalVisualization, displayDebtData } from "./ui/uiNotifications.mjs";

// Services
import { setupPageHandlers } from "./services/pageHandlerSetup.mjs";
import {
  createDebtCollectorButtonHandler,
  createVisitAllButtonHandler,
} from "./services/scrapingService.mjs";
import { setupDataLoadListeners, loadOfflineData } from "./services/dataLoader.mjs";

// Config (empty for now, can be loaded from file)
const detailedDebtConfig = {};

const heading = h1("Gjeldshjelperen");
const hLine2 = hLine();

const nationalIdHeader = h2(
  "Skriv inn fødselsnummer og trykk start for å hente gjeld fra alle selskaper:",
  "main-subheading"
);

const heading3 = h2(
  "Eller hent gjeld fra individuelle sider:",
  "main-subheading"
);

const nationalIdInput = input(
  "Skriv inn fødselsnummer",
  "nationalIdInput",
  "number"
);

const nationalIdContainer = div({ class: "national-id-container" });

// Create summary and visualization containers
const summaryDiv = div({ class: "summary-container" });
const totalVisualization = visualizeTotalDebts("0 kr");

// Set the visualization element for notifications
setTotalVisualization(totalVisualization);

const setupPageHandlersWithDisplay = (page, nationalID, onComplete) => {
  setupPageHandlers(page, nationalID, (debtData) => {
    displayDebtData(debtData, summaryDiv);
  }, onComplete);
};

// Function to create button handlers for each debt collector
const createHandler = (siteName, handler, options) => 
  createDebtCollectorButtonHandler(siteName, handler, setupPageHandlersWithDisplay, nationalIdInput, nationalIdContainer, options);

const siButton = button("Statens Innkrevingssentral", createHandler("SI", handleSILogin));
const digipostButton = button("Digipost", createHandler("Digipost", handleDigipostLogin));
const intrumButton = button("Intrum", createHandler("Intrum", handleIntrumLogin));
const kredinorButton = button("Kredinor", createHandler("Kredinor", handleKredinorLogin, { requiresUserName: true }));
const praGroupButton = button("PRA Group", createHandler("PRA Group", handlePraGroupLogin));
const zolvaButton = button("Zolva AS", createHandler("Zolva AS", handleZolvaLogin));

// Website configuration for Visit All button
const getNationalID = () => nationalIdInput.value.trim();
const websites = [
  { name: "SI", button: siButton, handler: (cb) => handleSILogin(getNationalID(), setupPageHandlersWithDisplay, cb) },
  { name: "Kredinor", button: kredinorButton, handler: (cb) => handleKredinorLogin(getNationalID(), () => sessionState.userName, setupPageHandlersWithDisplay, cb) },
  { name: "Intrum", button: intrumButton, handler: (cb) => handleIntrumLogin(getNationalID(), setupPageHandlersWithDisplay, cb) },
  { name: "PRA Group", button: praGroupButton, handler: (cb) => handlePraGroupLogin(getNationalID(), setupPageHandlersWithDisplay, cb) },
  { name: "Zolva AS", button: zolvaButton, handler: (cb) => handleZolvaLogin(getNationalID(), setupPageHandlersWithDisplay, cb) },
  { name: "Digipost", button: digipostButton, handler: (cb) => handleDigipostLogin(getNationalID(), setupPageHandlersWithDisplay, cb) },
];

const visitAllButton = button(
  "Start",
  createVisitAllButtonHandler(
    websites,
    nationalIdInput,
    nationalIdContainer,
    setupPageHandlersWithDisplay
  ),
  "main-start-button"
);

// Enter key triggers Start button
nationalIdInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    visitAllButton.click();
  }
});

nationalIdContainer.append(nationalIdInput, visitAllButton);

const buttonsContainer = div();
buttonsContainer.append(siButton, kredinorButton, intrumButton, praGroupButton, zolvaButton, digipostButton);

document.body.append(heading, nationalIdHeader, nationalIdContainer, heading3, buttonsContainer, hLine2, totalVisualization);

// Display detailed debt info if available
displayDetailedDebtInfo(detailedDebtConfig);

document.body.append(summaryDiv);

// Focus on input
nationalIdInput.focus();

// Setup data load listeners
setupDataLoadListeners(nationalIdInput, summaryDiv);

// Load offline data if configured
loadOfflineData(summaryDiv, displayDebtData);

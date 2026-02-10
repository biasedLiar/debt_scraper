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
let detailedDebtConfig = {};

const heading = h1("Gjeldshjelperen");
const heading2 = h2(
  "Et verktøy for å få oversikt over gjelden din fra forskjellige selskaper",
  "main-subheading new-paragraph"
);

const hLine1 = hLine();
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


const siButton = button(
  "Statens Innkrevingssentral",
  createDebtCollectorButtonHandler(
    "SI",
    handleSILogin,
    setupPageHandlersWithDisplay,
    nationalIdInput,
    nationalIdContainer
  )
);

const digipostButton = button(
  "Digipost",
  createDebtCollectorButtonHandler(
    "Digipost",
    handleDigipostLogin,
    setupPageHandlersWithDisplay,
    nationalIdInput,
    nationalIdContainer
  )
);

const intrumButton = button(
  "Intrum",
  createDebtCollectorButtonHandler(
    "Intrum",
    handleIntrumLogin,
    setupPageHandlersWithDisplay,
    nationalIdInput,
    nationalIdContainer
  )
);

const kredinorButton = button(
  "Kredinor",
  createDebtCollectorButtonHandler(
    "Kredinor",
    handleKredinorLogin,
    setupPageHandlersWithDisplay,
    nationalIdInput,
    nationalIdContainer,
    { requiresUserName: true }
  )
);

const praGroupButton = button(
  "PRA Group",
  createDebtCollectorButtonHandler(
    "PRA Group",
    handlePraGroupLogin,
    setupPageHandlersWithDisplay,
    nationalIdInput,
    nationalIdContainer
  )
);

const zolvaButton = button(
  "Zolva AS",
  createDebtCollectorButtonHandler(
    "Zolva AS",
    handleZolvaLogin,
    setupPageHandlersWithDisplay,
    nationalIdInput,
    nationalIdContainer
  )
);

// Website configuration for Visit All button
const websites = [
  {
    name: "SI",
    button: siButton,
    handler: (callbacks) =>
      handleSILogin(nationalIdInput.value.trim(), setupPageHandlersWithDisplay, callbacks),
  },
  {
    name: "Kredinor",
    button: kredinorButton,
    handler: (callbacks) =>
      handleKredinorLogin(
        nationalIdInput.value.trim(),
        () => sessionState.userName,
        setupPageHandlersWithDisplay,
        callbacks
      ),
  },
  {
    name: "Intrum",
    button: intrumButton,
    handler: (callbacks) =>
      handleIntrumLogin(nationalIdInput.value.trim(), setupPageHandlersWithDisplay, callbacks),
  },
  {
    name: "PRA Group",
    button: praGroupButton,
    handler: (callbacks) =>
      handlePraGroupLogin(nationalIdInput.value.trim(), setupPageHandlersWithDisplay, callbacks),
  },
  {
    name: "Zolva AS",
    button: zolvaButton,
    handler: (callbacks) =>
      handleZolvaLogin(nationalIdInput.value.trim(), setupPageHandlersWithDisplay, callbacks),
  },
  {
    name: "Digipost",
    button: digipostButton,
    handler: (callbacks) =>
      handleDigipostLogin(nationalIdInput.value.trim(), setupPageHandlersWithDisplay, callbacks),
  },
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


nationalIdContainer.append(nationalIdInput);
nationalIdContainer.append(visitAllButton);

const buttonsContainer = div();
buttonsContainer.append(siButton);
buttonsContainer.append(kredinorButton);
buttonsContainer.append(intrumButton);
buttonsContainer.append(praGroupButton);
buttonsContainer.append(zolvaButton);
buttonsContainer.append(digipostButton);

document.body.append(heading);
document.body.append(nationalIdHeader);
document.body.append(nationalIdContainer);
document.body.append(heading3);
document.body.append(buttonsContainer);
document.body.append(hLine2);
document.body.append(totalVisualization);

// Display detailed debt info if available
displayDetailedDebtInfo(detailedDebtConfig);

document.body.append(summaryDiv);


// Focus on input
nationalIdInput.focus();

// Setup data load listeners
setupDataLoadListeners(nationalIdInput, summaryDiv);

// Load offline data if configured
loadOfflineData(summaryDiv, displayDebtData);

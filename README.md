# Gjeld i Norge - Debt Overview Tool

An Electron-based desktop application that helps Norwegian citizens get an overview of their debt situation by automating data collection from various debt collection agencies and creditors.

## Overview

This application uses Puppeteer to automate browser interactions and collect debt information from multiple Norwegian creditor and debt collection websites. It saves API responses and generates a consolidated view of both current and paid debts.

### Supported Creditors

The application currently supports the following Norwegian creditor/debt collection services:

- **Statens Innkrevingssentral (SI)** - Government collection agency
- **Intrum** - Debt collection company
- **Kredinor** - Debt collection company  
- **PRA Group** - In progress
- **Digipost** - Digital mailbox service - In progress
- **tfBank** - Financial services - In progress
- **Zolva AS** - Debt collection company - In progress

## Features

- **Automated Login**: Guides users through BankID authentication for various creditor websites
- **Data Export**: Saves all collected data as JSON files organized by user and date
- **Debt Visualization**: Displays total debt amounts and detailed information per creditor
- **Paid Debt Tracking**: Can optionally show both current and paid debts

## Project Structure

```
src/
  ├── main.mjs              # Electron main process
  ├── renderer.mjs          # Main UI logic and orchestration
  ├── scraper.mjs           # Puppeteer browser automation
  ├── data.mjs              # Configuration for target websites
  ├── json_reader.mjs       # Parse and process collected JSON data
  ├── dom.mjs               # UI rendering utilities
  ├── utilities.mjs         # File operations and data management
  ├── pages/                # Login handlers and puppeteer operations specialized for each website
  │   ├── intrum.mjs
  │   ├── kredinor.mjs
  │   ├── statens-innkrevingssentral.mjs
  │   └── ...
  └── index.html            # Main application window

exports/                    # Collected data organized by user/date/creditor
```

## Installation

```bash
# Install dependencies
npm install

# Run the application
npm start
```

### Requirements

- Node.js (recent version with ES modules support)
- Git
- Windows/macOS/Linux

## How It Works

1. **User Initiates Login**: User clicks on a creditor button in the UI
2. **Browser Automation**: Application opens an automated browser window via Puppeteer
3. **BankID Authentication**: User completes login with their BankID credentials
4. **Data Interception**: Application finds data on the website through scraping
5. **Data Processing**: JSON data is parsed and organized by creditor
6. **Visualization**: Debt information is displayed in the application UI



## Data Storage

All collected data is stored in the `exports/` directory with the following structure:

```
exports/
  └── [name]/
      └── [date]/
          └── [Creditor Name]/
              ├── [page-name]/
                  └── data


## Configuration

Key configuration options in the source code:

- `showPaidDebts` (renderer.mjs): Toggle display of paid debts
- `offlineMode` (renderer.mjs): Enable testing with saved data
- Target website URLs are defined in `data.mjs`

## Privacy & Security

>  **Important**: This application handles sensitive financial data. 
> - Data is stored locally on your machine
> - No data is transmitted to external servers 
> - Do not share exported JSON files as they contain personal information

## Data Validation

The application uses **Zod** schemas to ensure all saved data maintains a consistent format:

- All manually collected debt data is validated before saving
- Invalid data is saved with an `_unvalidated` suffix for debugging
- Validation errors are logged with detailed information about what failed
- Schemas are defined in [src/schemas.mjs](src/schemas.mjs)

### Validated Data Formats

- **Intrum**: Manual debt cases with case numbers, amounts, and creditor names
- **Kredinor**: Debt amounts, active cases, and detailed debt lists
- All files include ISO 8601 timestamps for tracking when data was collected

## Development

The application is built with:

- **Electron** - Desktop application framework
- **Puppeteer** - Browser automation
- **Zod** - Schema validation for data consistency and type safety
- **ES Modules** - Modern JavaScript module system

## License

[CC0 1.0 (Public Domain)](LICENSE.md)

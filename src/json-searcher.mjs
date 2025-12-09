const fs = require("fs");
const path = require("path");

/**
 * Searches for a specific field in JSON files and extracts their values.
 * Returns flattened array items if the field contains arrays.
 * @param {string} fieldName - The field name to search for
 * @param {string} directory - The directory to search in
 * @returns {Array<any>} - Flattened array of all found values
 */
export const extractFieldFromJsonFiles = (fieldName = 'krav', directory = 'scraped-data') => {
  const dirPath = path.join(process.cwd(), directory);
  
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory '${directory}' not found`);
    return [];
  }
  
  // Get all JSON files in the directory
  const files = fs.readdirSync(dirPath);
  const jsonFiles = files.filter(file => file.endsWith('.json'));
  
  const allValues = [];
  
  for (const file of jsonFiles) {
    const jsonFilePath = path.join(dirPath, file);
    
    try {
      const content = fs.readFileSync(jsonFilePath, 'utf-8').trim();
      
      // Parse the JSON - handle double-encoded JSON
      let data = JSON.parse(content);
      
      // If data is a string, it's double-encoded, parse again
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      // Recursively search for the field in the JSON structure
      const fieldValues = findField(data, fieldName);
      
      // Flatten array values
      for (const value of fieldValues) {
        if (Array.isArray(value)) {
          allValues.push(...value);
        } else {
          allValues.push(value);
        }
      }
      
    } catch (e) {
      if (e instanceof SyntaxError) {
        console.error(`JSON Error in ${file}:`, e.message);
      } else if (e instanceof Error) {
        console.error(`Error processing ${file}:`, e.message);
      } else {
        console.error(`Error processing ${file}:`, String(e));
      }
    }
  }
  
  return allValues;
};

/**
 * Recursively finds all values for a specific field name in a nested JSON structure.
 * @param {any} obj - The object to search
 * @param {string} fieldName - The field name to search for
 * @param {Array<any>} results - Accumulator for results
 * @returns {Array<any>}
 */
const findField = (obj, fieldName, results = []) => {
  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      for (const item of obj) {
        findField(item, fieldName, results);
      }
    } else {
      for (const [key, value] of Object.entries(obj)) {
        if (key === fieldName) {
          results.push(value);
        }
        findField(value, fieldName, results);
      }
    }
  }
  
  return results;
};

// Example usage when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const searchField = 'krav'; // Change this to any field name you want to search for
  
  const data = extractFieldFromJsonFiles(searchField);
  
  for (const item of data) {
    console.log(`\nFile: ${item.file}`);
    for (const value of item.values) {
      console.log(`  - ${value}`);
    }
  }
}

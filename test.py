import json
from pathlib import Path

def extract_field_from_json_files(field_name='linkText', directory='scraped-data'):
    """
    Searches for a specific field in JSON files and extracts their values.
    """
    results = []
    
    # Get all JSON files in the directory
    path = Path(directory)
    if not path.exists():
        print(f"Directory '{directory}' not found")
        return results
    
    json_files = list(path.glob('**/*.json'))
    
    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                
            # Parse the JSON - handle double-encoded JSON
            data = json.loads(content)
            
            # If data is a string, it's double-encoded, parse again
            if isinstance(data, str):
                data = json.loads(data)
                
            # Recursively search for the field in the JSON structure
            field_values = find_field(data, field_name)
            
            if field_values:
                results.append({
                    'file': str(json_file),
                    'values': field_values
                })
                print(f"Found in {json_file.name}: {field_values}")
                
        except json.JSONDecodeError as e:
            print(f"JSON Error in {json_file}: {e}")
        except Exception as e:
            print(f"Error processing {json_file}: {e}")
    
    return results

def find_field(obj, field_name, results=None):
    """
    Recursively finds all values for a specific field name in a nested JSON structure.
    """
    if results is None:
        results = []
    
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key == field_name and isinstance(value, str):
                results.append(value)
            else:
                find_field(value, field_name, results)
    elif isinstance(obj, list):
        for item in obj:
            find_field(item, field_name, results)
    
    return results

# Example usage
# Change the field_name to search for different fields
search_field = 'linkText'  # Change this to any field name you want to search for

data = extract_field_from_json_files(field_name=search_field)

for item in data:
    print(f"\nFile: {item['file']}")
    for value in item['values']:
        print(f"  - {value}")
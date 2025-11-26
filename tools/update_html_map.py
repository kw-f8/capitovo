import re

def update_html_map():
    # Read the processed SVG to get the path data
    with open('weltkarte_processed.svg', 'r') as f:
        svg_content = f.read()
    
    # Extract the d attribute from the path
    # The file has format <path class="land" d="..." />
    match = re.search(r'<path class="land" d="([^"]+)"', svg_content)
    if not match:
        print("Could not find path data in weltkarte_processed.svg")
        return
    
    path_d = match.group(1)
    
    # Read index.html
    with open('index.html', 'r') as f:
        html_content = f.read()
    
    # Construct the new continents block
    # We will replace the entire <g id="continents">...</g> block
    new_continents_block = f'<g id="continents">\n                                <path id="world-land" class="land" d="{path_d}" />\n                            </g>'
    
    # Regex to find the existing continents block
    # It starts with <g id="continents"> and ends with </g>
    # We use dotall to match newlines
    # We need to be careful to match the closing </g> of the continents group, not the markers group or svg
    # The structure is:
    # <g id="continents">
    #    ...
    # </g>
    # <g id="markers">
    
    # We can look for <g id="continents"> until </g> followed by whitespace and <g id="markers"> or </svg>
    
    pattern = r'<g id="continents">.*?</g>'
    
    # Check if we can find it
    if not re.search(pattern, html_content, re.DOTALL):
        print("Could not find <g id=\"continents\"> block in index.html")
        return
        
    # Replace
    new_html_content = re.sub(pattern, new_continents_block, html_content, count=1, flags=re.DOTALL)
    
    # Write back
    with open('index.html', 'w') as f:
        f.write(new_html_content)
        
    print("Successfully updated index.html with new map path.")

if __name__ == "__main__":
    update_html_map()

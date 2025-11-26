import re
import os

def update_html_map():
    input_svg = '/workspaces/capitovo/weltkarte_simplified.svg'
    target_html = '/workspaces/capitovo/index.html'

    if not os.path.exists(input_svg):
        print(f"Error: {input_svg} not found.")
        return

    # Read the processed SVG to get the path data
    with open(input_svg, 'r') as f:
        svg_content = f.read()
    
    # Extract the d attribute from the path
    # The file has format <path id="world-land" d="..." />
    match = re.search(r'<path[^>]*d="([^"]+)"', svg_content)
    if not match:
        print(f"Could not find path data in {input_svg}")
        # Debug: print first 500 chars
        print(svg_content[:500])
        return
    
    path_d = match.group(1)
    print(f"Found path data (length: {len(path_d)})")
    
    # Read index.html
    with open(target_html, 'r') as f:
        html_content = f.read()
    
    # Construct the new continents block
    # We will replace the entire <g id="continents">...</g> block
    new_continents_block = f'<g id="continents">\n                                <path id="world-land" class="land" d="{path_d}" />\n                            </g>'
    
    # Regex to find the existing continents block
    pattern = r'<g id="continents">.*?</g>'
    
    # Check if we can find it
    if not re.search(pattern, html_content, re.DOTALL):
        print("Could not find <g id=\"continents\"> block in index.html")
        return
        
    # Replace
    new_html_content = re.sub(pattern, new_continents_block, html_content, count=1, flags=re.DOTALL)
    
    # Write back
    with open(target_html, 'w') as f:
        f.write(new_html_content)
        
    print("Successfully updated index.html with new simplified map path.")

if __name__ == "__main__":
    update_html_map()

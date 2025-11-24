import os
import sys

# Add current directory to path to import the generator
sys.path.append(os.getcwd())
from tools.generate_hero_svg_v11 import generate_hero_svg

def update_index_html():
    file_path = 'index.html'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Define markers
    start_marker = '<svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" class="hero-image">'
    end_marker = '</svg>'
    
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker, start_idx)
    
    if start_idx == -1 or end_idx == -1:
        print("Error: Could not find SVG block in index.html")
        return
    
    # Generate new SVG
    new_svg = generate_hero_svg()
    
    # Ensure class="hero-image" is present
    expected_start = '<svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" class="hero-image">'
    generated_start = '<svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" class="hero-image">'
    
    if not new_svg.startswith(generated_start):
         # Fallback if generator output changes slightly
         tag_close_idx = new_svg.find('>')
         new_svg = generated_start + new_svg[tag_close_idx+1:]

    # Construct new content
    new_content = content[:start_idx] + new_svg + content[end_idx + len(end_marker):]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("Successfully updated index.html with new SVG (V11).")

if __name__ == "__main__":
    update_index_html()

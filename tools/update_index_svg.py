import os
import sys

# Add current directory to path to import the generator
sys.path.append(os.getcwd())
from tools.generate_hero_svg_v7 import generate_hero_svg

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
    
    # Add the class="hero-image" to the new SVG tag
    # The generator returns <svg viewBox="..." ...>
    # We want <svg viewBox="..." ... class="hero-image">
    
    # Find the first closing bracket of the opening tag
    tag_close_idx = new_svg.find('>')
    if tag_close_idx != -1:
        # Check if class is already there (it shouldn't be based on v7 script)
        if 'class="hero-image"' not in new_svg[:tag_close_idx]:
            # Insert the class attribute before the closing bracket
            # We also need to handle the case where it might be " />" or just ">"
            # But for <svg> it's usually just ">"
            
            # Let's just replace the opening tag entirely with the one we want
            # The generator returns: <svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            expected_start = '<svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">'
            if new_svg.startswith(expected_start):
                new_svg = start_marker + new_svg[len(expected_start):]
            else:
                print("Warning: Generated SVG start tag didn't match expected format. Doing manual insertion.")
                new_svg = new_svg[:tag_close_idx] + ' class="hero-image"' + new_svg[tag_close_idx:]
    
    # Construct new content
    # We replace everything from start_marker to end_marker + len(end_marker)
    new_content = content[:start_idx] + new_svg + content[end_idx + len(end_marker):]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("Successfully updated index.html with new SVG.")

if __name__ == "__main__":
    update_index_html()

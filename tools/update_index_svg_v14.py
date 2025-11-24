import os
import re
from generate_hero_svg_v14 import generate_hero_svg

def update_index_html():
    svg_content = generate_hero_svg()
    
    file_path = '/workspaces/capitovo/index.html'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Regex to find the existing SVG with class "hero-image"
    pattern = re.compile(r'<svg[^>]*class="hero-image"[^>]*>.*?</svg>', re.DOTALL)
    
    if pattern.search(content):
        new_content = pattern.sub(svg_content, content)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully updated index.html with new SVG (V14).")
    else:
        print("Error: Could not find existing SVG with class 'hero-image' in index.html")

if __name__ == "__main__":
    update_index_html()

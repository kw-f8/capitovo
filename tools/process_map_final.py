import xml.etree.ElementTree as ET
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union
from svg.path import parse_path, Line, CubicBezier, QuadraticBezier, Arc, Close
import os

# Configuration
INPUT_FILE = 'weltkarte.svg'
OUTPUT_FILE = 'weltkarte_processed.svg'
AREA_THRESHOLD = 20.0  # Filter out polygons smaller than this

def sample_segment(segment, num_points=10):
    points = []
    for i in range(num_points + 1):
        t = i / num_points
        p = segment.point(t)
        points.append((p.real, p.imag))
    return points

def parse_svg_to_polygons(svg_file):
    tree = ET.parse(svg_file)
    root = tree.getroot()
    
    all_polygons = []
    
    for elem in root.iter():
        if 'class' in elem.attrib and 'landxx' in elem.attrib['class']:
            if 'd' in elem.attrib:
                path_d = elem.attrib['d']
                try:
                    path = parse_path(path_d)
                    current_points = []
                    for segment in path:
                        if isinstance(segment, Line):
                            current_points.append((segment.start.real, segment.start.imag))
                        elif isinstance(segment, Close):
                            pass
                        else:
                            points = sample_segment(segment)
                            if current_points and points[0] == current_points[-1]:
                                current_points.extend(points[1:])
                            else:
                                current_points.extend(points)
                    
                    if len(path) > 0:
                        last_seg = path[-1]
                        current_points.append((last_seg.end.real, last_seg.end.imag))

                    if len(current_points) >= 3:
                        try:
                            poly = Polygon(current_points)
                            if not poly.is_valid:
                                poly = poly.buffer(0)
                            if poly.is_valid and not poly.is_empty:
                                all_polygons.append(poly)
                        except:
                            pass
                except:
                    continue
    return all_polygons

def polygons_to_svg_path(polygons):
    path_data = []
    for poly in polygons:
        if poly.is_empty:
            continue
        
        # Exterior
        coords = list(poly.exterior.coords)
        if not coords:
            continue
            
        path_data.append(f"M {coords[0][0]:.2f} {coords[0][1]:.2f}")
        for x, y in coords[1:]:
            path_data.append(f"L {x:.2f} {y:.2f}")
        path_data.append("Z")
        
        # Interiors (holes)
        for interior in poly.interiors:
            coords = list(interior.coords)
            if not coords:
                continue
            path_data.append(f"M {coords[0][0]:.2f} {coords[0][1]:.2f}")
            for x, y in coords[1:]:
                path_data.append(f"L {x:.2f} {y:.2f}")
            path_data.append("Z")
            
    return " ".join(path_data)

def main():
    print(f"Reading {INPUT_FILE}...")
    if not os.path.exists(INPUT_FILE):
        # Fallback for absolute path if needed
        if os.path.exists('/workspaces/capitovo/' + INPUT_FILE):
            input_path = '/workspaces/capitovo/' + INPUT_FILE
        else:
            print("Input file not found.")
            return
    else:
        input_path = INPUT_FILE

    polygons = parse_svg_to_polygons(input_path)
    print(f"Found {len(polygons)} polygons.")
    
    print("Merging polygons...")
    merged = unary_union(polygons)
    
    if isinstance(merged, Polygon):
        merged = MultiPolygon([merged])
        
    print(f"Merged into {len(merged.geoms)} parts.")
    
    print(f"Filtering parts smaller than {AREA_THRESHOLD}...")
    filtered_polygons = [p for p in merged.geoms if p.area >= AREA_THRESHOLD]
    print(f"Remaining parts: {len(filtered_polygons)}")
    
    print("Generating SVG path...")
    path_d = polygons_to_svg_path(filtered_polygons)
    
    # Create SVG content
    # Get viewBox from original file if possible, or use default
    try:
        tree = ET.parse(input_path)
        root = tree.getroot()
        viewBox = root.attrib.get('viewBox', "0 0 2560 1240")
        width = root.attrib.get('width', "2560")
        height = root.attrib.get('height', "1240")
    except:
        viewBox = "82.992 45.607 2528.5721 1238.9154"
        width = "2560"
        height = "1134"

    svg_content = f"""<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   xmlns="http://www.w3.org/2000/svg"
   viewBox="{viewBox}"
   width="{width}"
   height="{height}">
  <style>
    .land {{
       fill: #e0e0e0;
       stroke: none;
    }}
  </style>
  <path class="land" d="{path_d}" />
</svg>
"""
    
    output_path = OUTPUT_FILE
    if not os.path.exists(OUTPUT_FILE) and os.path.exists('/workspaces/capitovo/'):
        output_path = '/workspaces/capitovo/' + OUTPUT_FILE
        
    with open(output_path, 'w') as f:
        f.write(svg_content)
        
    print(f"Written to {output_path}")

if __name__ == "__main__":
    main()

import xml.etree.ElementTree as ET
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union
from svgpath import parse_path
import numpy as np

def svg_path_to_shapely(path_d):
    path = parse_path(path_d)
    polygons = []
    
    # Convert to polygons
    # This is a simplification. Real SVG paths can be complex (curves, holes, etc.)
    # We will approximate curves with line segments
    
    for segment in path:
        # We need to handle subpaths (M ... Z)
        pass
        
    # A better approach might be to use a library that handles this conversion better
    # or iterate through the commands manually.
    
    # Let's try a simpler approach: iterate points
    points = []
    current_poly_points = []
    
    # svgpath doesn't give direct points easily for complex paths with curves.
    # However, for map data, it's often mostly lines (L) or simple curves.
    # Let's use the .linear() method from svgpath to approximate curves
    
    try:
        # approximate curves with line segments
        path_linear = path.linear()
        
        current_subpath = []
        
        for segment in path_linear:
            if segment.command == 'M':
                if current_subpath:
                    if len(current_subpath) > 2:
                        polygons.append(Polygon(current_subpath))
                    current_subpath = []
                current_subpath.append((segment.args[0], segment.args[1]))
            elif segment.command == 'L':
                current_subpath.append((segment.args[0], segment.args[1]))
            elif segment.command == 'Z':
                if len(current_subpath) > 2:
                    polygons.append(Polygon(current_subpath))
                current_subpath = []
            # H and V are converted to L by .linear() ? No, linear() converts curves to lines.
            # We might need to handle H and V if they exist.
            # Actually svgpath.linear() converts curves to lines, but keeps H, V, etc?
            # Let's check documentation or assume standard behavior.
            # To be safe, let's use .abs() first to get absolute coordinates
            
    except Exception as e:
        print(f"Error parsing path: {e}")
        return []

    return polygons

def parse_svg_to_polygons(svg_file):
    tree = ET.parse(svg_file)
    root = tree.getroot()
    
    namespaces = {'svg': 'http://www.w3.org/2000/svg'}
    
    all_polygons = []
    
    # Find all paths with class containing 'landxx'
    # We need to search recursively
    for elem in root.iter():
        if 'class' in elem.attrib and 'landxx' in elem.attrib['class']:
            if 'd' in elem.attrib:
                path_d = elem.attrib['d']
                
                # Use svgpath to parse and linearize
                try:
                    path = parse_path(path_d).abs().linear()
                    
                    current_points = []
                    start_point = None
                    
                    for segment in path:
                        cmd = segment.command
                        args = segment.args
                        
                        if cmd == 'M':
                            if current_points:
                                if len(current_points) >= 3:
                                    try:
                                        poly = Polygon(current_points)
                                        if poly.is_valid:
                                            all_polygons.append(poly)
                                        else:
                                            all_polygons.append(poly.buffer(0))
                                    except:
                                        pass
                                current_points = []
                            
                            current_points.append((args[0], args[1]))
                            start_point = (args[0], args[1])
                            
                        elif cmd == 'L':
                            current_points.append((args[0], args[1]))
                            
                        elif cmd == 'H':
                            current_points.append((args[0], current_points[-1][1]))
                            
                        elif cmd == 'V':
                            current_points.append((current_points[-1][0], args[0]))
                            
                        elif cmd == 'Z':
                            if current_points and start_point:
                                # Close the loop
                                if current_points[-1] != start_point:
                                    current_points.append(start_point)
                                    
                                if len(current_points) >= 3:
                                    try:
                                        poly = Polygon(current_points)
                                        if poly.is_valid:
                                            all_polygons.append(poly)
                                        else:
                                            all_polygons.append(poly.buffer(0))
                                    except:
                                        pass
                                current_points = []
                                
                    # Handle last polygon if not closed with Z but valid
                    if current_points and len(current_points) >= 3:
                         try:
                            poly = Polygon(current_points)
                            if poly.is_valid:
                                all_polygons.append(poly)
                            else:
                                all_polygons.append(poly.buffer(0))
                         except:
                            pass

                except Exception as e:
                    print(f"Failed to process path: {e}")
                    continue

    return all_polygons

def main():
    print("Parsing SVG...")
    polygons = parse_svg_to_polygons('weltkarte.svg')
    print(f"Found {len(polygons)} polygons.")
    
    if not polygons:
        print("No polygons found.")
        return

    print("Unioning polygons (this might take a while)...")
    merged = unary_union(polygons)
    
    if isinstance(merged, Polygon):
        merged = MultiPolygon([merged])
        
    print(f"Resulting MultiPolygon has {len(merged.geoms)} parts.")
    
    # Calculate areas to determine threshold
    areas = sorted([p.area for p in merged.geoms])
    print(f"Smallest area: {areas[0]}")
    print(f"Largest area: {areas[-1]}")
    print(f"Median area: {areas[len(areas)//2]}")
    
    # Print some percentiles
    for p in [10, 25, 50, 75, 90]:
        print(f"{p}th percentile: {np.percentile(areas, p)}")

if __name__ == "__main__":
    main()

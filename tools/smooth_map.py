
import re
import math

# The existing polygons from update_map.py
paths = {
    "na": "M 150,30 L 120,35 L 90,45 L 70,60 L 60,90 L 55,120 L 65,150 L 80,170 L 100,190 L 120,210 L 140,230 L 160,240 L 180,250 L 200,245 L 210,230 L 230,220 L 240,200 L 250,180 L 280,160 L 300,140 L 320,120 L 340,110 L 350,90 L 320,70 L 280,50 L 240,40 L 200,40 L 160,50 Z",
    "sa": "M 240,250 L 260,245 L 280,245 L 300,250 L 320,260 L 340,270 L 360,290 L 370,310 L 380,340 L 370,370 L 360,400 L 340,440 L 320,480 L 300,490 L 280,470 L 260,430 L 250,390 L 240,350 L 235,300 Z",
    "eu": "M 430,140 L 440,110 L 460,90 L 480,70 L 500,65 L 520,70 L 540,90 L 550,120 L 540,140 L 520,150 L 500,155 L 480,150 L 460,145 L 440,145 Z",
    "af": "M 430,160 L 450,155 L 480,155 L 510,160 L 530,170 L 550,190 L 560,220 L 570,260 L 560,300 L 540,350 L 520,390 L 500,400 L 480,390 L 460,360 L 440,320 L 430,280 L 420,240 L 420,200 Z",
    "as": "M 550,140 L 560,100 L 580,80 L 620,60 L 680,50 L 740,50 L 800,60 L 860,80 L 900,120 L 920,160 L 900,200 L 880,240 L 850,280 L 800,300 L 750,310 L 700,300 L 650,280 L 600,250 L 580,200 L 560,170 Z",
    "au": "M 760,340 L 780,330 L 820,320 L 860,330 L 890,350 L 900,380 L 890,410 L 870,430 L 840,440 L 800,430 L 770,400 Z"
}

def parse_path(d):
    # Simple parser for M x,y L x,y ... Z
    points = []
    parts = d.replace('M', '').replace('L', '').replace('Z', '').split(' ')
    for part in parts:
        if ',' in part:
            x, y = map(float, part.split(','))
            points.append((x, y))
    return points

def chaikin_smooth(points, iterations=3):
    if not points:
        return []
    
    # Close the loop if not already closed
    closed = points[0] == points[-1]
    if not closed:
        points.append(points[0])
        
    for _ in range(iterations):
        new_points = []
        for i in range(len(points) - 1):
            p0 = points[i]
            p1 = points[i+1]
            
            # Q = 0.75 P0 + 0.25 P1
            qx = 0.75 * p0[0] + 0.25 * p1[0]
            qy = 0.75 * p0[1] + 0.25 * p1[1]
            
            # R = 0.25 P0 + 0.75 P1
            rx = 0.25 * p0[0] + 0.75 * p1[0]
            ry = 0.25 * p0[1] + 0.75 * p1[1]
            
            new_points.append((qx, qy))
            new_points.append((rx, ry))
        
        # If it was closed, ensure the last point connects to the first correctly
        # Chaikin on a closed loop: the last point of the last segment should connect to the first point of the first segment
        # But our implementation treats it as a polyline. 
        # For a closed loop, we should wrap around.
        # Let's just use the polyline approach and re-close it.
        new_points.append(new_points[0])
        points = new_points
        
    return points

def points_to_svg(points):
    if not points:
        return ""
    d = f"M {points[0][0]:.1f},{points[0][1]:.1f}"
    for p in points[1:]:
        d += f" L {p[0]:.1f},{p[1]:.1f}"
    d += " Z"
    return d

print("Smoothed Paths:")
for region, d in paths.items():
    points = parse_path(d)
    smoothed = chaikin_smooth(points, iterations=4)
    new_d = points_to_svg(smoothed)
    print(f'"{region}": "{new_d}",')

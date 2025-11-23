#!/usr/bin/env python3
"""
Generiert aus einem Screenshot (Chart) eine vereinfachte Vektor-SVG-Kurve.

Usage:
    python tools/generate_chart_svg.py input.png output.svg

Das Skript versucht, die dominante Kontur zu finden, die als Kurve interpretiert wird.
Wenn keine Kontur vorhanden ist, fällt es auf eine X-Median-Ansatz über Kantenpunkte zurück.
Das Ergebnis ist ein sauberes, beschriftungsfreies SVG mit einer einzelnen Pfad-Linie.
"""
import sys
import os
import math
import numpy as np
try:
    import cv2
except Exception as e:
    print('Fehler: OpenCV (cv2) wird benötigt. Bitte installiere opencv-python-headless.', file=sys.stderr)
    raise


def extract_curve_points(img_path, downsample=1):
    img = cv2.imread(img_path)
    if img is None:
        raise FileNotFoundError(img_path)
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5,5), 0)
    edges = cv2.Canny(blur, 50, 150)

    # connect small gaps
    kernel = np.ones((3,3), np.uint8)
    edges = cv2.dilate(edges, kernel, iterations=1)

    # find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)

    pts = None
    if contours:
        # choose contour with largest length
        best = max(contours, key=lambda c: len(c))
        pts = best.reshape(-1,2)
    else:
        # fallback: use edge coordinates
        ys, xs = np.where(edges > 0)
        if len(xs) == 0:
            return [], (w,h)
        pts = np.column_stack((xs, ys))

    # sort by x and reduce to one y per x (median)
    order = np.argsort(pts[:,0])
    pts = pts[order]
    xs_unique = np.unique(pts[:,0])
    samples = []
    for x in xs_unique[::downsample]:
        ys_at_x = pts[pts[:,0] == x, 1]
        if ys_at_x.size == 0:
            continue
        y = float(np.median(ys_at_x))
        samples.append((float(x), float(y)))

    if not samples:
        return [], (w,h)

    pts_arr = np.array(samples)

    # smooth y with moving average
    kernel_size = max(3, int(len(pts_arr) / 160))
    if kernel_size % 2 == 0:
        kernel_size += 1
    ys = pts_arr[:,1]
    pad = kernel_size//2
    ys_padded = np.pad(ys, (pad,pad), mode='edge')
    kernel = np.ones(kernel_size) / kernel_size
    ys_smooth = np.convolve(ys_padded, kernel, mode='valid')

    xs_sm = pts_arr[:,0]
    pts_final = [(float(x), float(y)) for x,y in zip(xs_sm, ys_smooth)]
    return pts_final, (w,h)


def build_svg_path(points, size, stroke='#0ea5a4'):
    if not points:
        return None
    w,h = size
    # Build a simple polyline path
    path = 'M {:.2f} {:.2f}'.format(points[0][0], points[0][1])
    for x,y in points[1:]:
        path += ' L {:.2f} {:.2f}'.format(x,y)

    stroke_width = max(2, w / 400.0)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid meet">
  <path d="{path}" fill="none" stroke="{stroke}" stroke-width="{stroke_width:.2f}" stroke-linecap="round" stroke-linejoin="round" />
</svg>'''
    return svg


def main():
    if len(sys.argv) < 3:
        print('Usage: generate_chart_svg.py input.png output.svg', file=sys.stderr)
        sys.exit(2)
    inp = sys.argv[1]
    out = sys.argv[2]

    pts, size = extract_curve_points(inp)
    if not pts:
        print('Keine Kurvenpunkte gefunden.', file=sys.stderr)
        sys.exit(1)

    svg = build_svg_path(pts, size)
    if svg is None:
        print('SVG konnte nicht erzeugt werden.', file=sys.stderr)
        sys.exit(1)

    with open(out, 'w', encoding='utf-8') as f:
        f.write(svg)

    print('SVG geschrieben:', out)


if __name__ == '__main__':
    main()

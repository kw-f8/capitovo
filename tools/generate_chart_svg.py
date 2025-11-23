#!/usr/bin/env python3
"""
Generiert aus einem Screenshot (Chart) eine vereinfachte Vektor-SVG-Darstellung.

Usage:
    python tools/generate_chart_svg.py input.png output.svg

Das Skript versucht automatisch, ob ein einfacher Linienpfad oder ein Kerzenchart
erzeugt werden kann. Für Kerzen (Candlesticks) wird die Grafik in vertikale
Segmente unterteilt und pro Segment ein Docht (wick) + Körper (body) gezeichnet.
Das Ergebnis ist ein beschriftungsfreies SVG ohne Achsen oder Rahmen.
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


def build_candlestick_svg(img, edges, size, samples=80, out_size=(1200,360), padding=(40,28), invert_trend=False):
    h, w = size[1], size[0]
    out_w, out_h = out_size
    pad_x, pad_y = padding
    # determine active chart area by column projection (be generous with threshold)
    col_sum = edges.sum(axis=0)
    max_col = np.max(col_sum) if col_sum.size else 0
    active = np.where(col_sum > (max_col * 0.005))[0]
    if active.size == 0:
        # fallback to full width
        x0, x1 = 0, w
    else:
        x0, x1 = int(active[0]), int(active[-1])

    # number of samples (candles) - choose based on width, but not too many
    samples = min(max(20, samples), max(20, max(20, int((x1 - x0) / 6))))
    step = max(1, float(x1 - x0) / float(samples))

    # compute robust vertical bounds of the chart (avoid outliers from UI shadows)
    ys_all, xs_all = np.where(edges > 0)
    if ys_all.size:
        y_min_global = int(np.percentile(ys_all, 2))
        y_max_global = int(np.percentile(ys_all, 98))
    else:
        y_min_global = 0
        y_max_global = h

    candles = []
    for i in range(samples):
        xa = int(x0 + i * step)
        xb = int(x0 + (i + 1) * step)
        if xb <= xa:
            xb = xa + 1
        slice_edges = edges[:, xa:xb]
        ys, xs = np.where(slice_edges > 0)
        if ys.size == 0:
            continue
        ys_global = ys
        # derive robust low/high within this slice using percentiles to avoid stray pixels
        if ys_global.size:
            min_y = int(np.percentile(ys_global, 5))
            max_y = int(np.percentile(ys_global, 95))
        else:
            continue

        # clamp to global robust bounds to avoid extremely tall wicks caused by artifacts
        min_y = max(y_min_global, min_y)
        max_y = min(y_max_global, max_y)

        # attempt to find body by simple 1D clustering (avoid scipy/sklearn dependency)
        body_top = None
        body_bottom = None
        try:
            if ys.size >= 6:
                # histogram-based two-peak approximation
                span = max(2, max_y - min_y)
                bins = min(40, span)
                hist, bin_edges = np.histogram(ys_global, bins=bins)
                peaks = np.argsort(hist)[-2:]
                centers = sorted([int((bin_edges[p] + bin_edges[p+1]) / 2.0) for p in peaks])
                if len(centers) == 2:
                    body_top = centers[0]
                    body_bottom = centers[1]
        except Exception:
            body_top = None

        if body_top is None or body_bottom is None:
            # fallback: body around median with small height relative to the slice range
            med = int(np.median(ys_global))
            slice_range = max(2, max_y - min_y)
            body_half = max(2, int(slice_range * 0.12))
            body_top = max(min_y, med - body_half)
            body_bottom = min(max_y, med + body_half)

        # limit body height to a reasonable fraction of the overall chart height to avoid extreme bars
        max_body_px = max(6, int((y_max_global - y_min_global) * 0.35))
        if (body_bottom - body_top) > max_body_px:
            # center body around median with capped half-height
            med = int((body_top + body_bottom) / 2)
            half = max_body_px // 2
            body_top = max(y_min_global, med - half)
            body_bottom = min(y_max_global, med + half)

        x_center = (xa + xb) / 2.0

        # sample color from original image in the body area and determine up/down
        bgr = img[ max(0, body_top):min(h, body_bottom), max(0, xa):min(w, xb) ]
        # default colors: up = aqua/blue, down = gray
        up_color = '#06b6d4'   # cyan-500-like
        down_color = '#6b7280' # gray-500
        color = up_color
        try:
            if bgr.size > 0:
                avg = np.mean(bgr.reshape(-1,3), axis=0)
                # convert BGR to rgb
                r,g,b = float(avg[2]), float(avg[1]), float(avg[0])
                # decide up/down by green vs red dominance (original screenshot uses blue-ish up, gray down)
                if g > r + 6 or b > r + 6:
                    color = up_color
                else:
                    color = down_color
        except Exception:
            color = up_color

        candles.append({
            'x': x_center,
            'wick_top': min_y,
            'wick_bottom': max_y,
            'body_top': body_top,
            'body_bottom': body_bottom,
            'color': color,
            'width': max(3, int((xb - xa) * 0.6)),
            'orig_xa': xa,
            'orig_xb': xb
        })

    # compute scaling mapping from original x range [x0,x1] to [pad_x, out_w-pad_x]
    src_x0, src_x1 = x0, x1
    src_span = max(1, src_x1 - src_x0)
    dst_span = max(1, out_w - 2 * pad_x)
    scale_x = float(dst_span) / float(src_span)
    # vertical scaling: map original [0,h] to [pad_y, out_h - pad_y]
    dst_vspan = max(1, out_h - 2 * pad_y)

    elems = []

    for c in candles:
        # map center x
        x = pad_x + (c['x'] - src_x0) * scale_x
        # map wick and body Y coordinates, optionally invert vertically to flip trend
        if invert_trend:
            wy1 = pad_y + (1.0 - (c['wick_top'] / float(h))) * dst_vspan
            wy2 = pad_y + (1.0 - (c['wick_bottom'] / float(h))) * dst_vspan
            by1 = pad_y + (1.0 - (c['body_top'] / float(h))) * dst_vspan
            by2 = pad_y + (1.0 - (c['body_bottom'] / float(h))) * dst_vspan
        else:
            wy1 = pad_y + (c['wick_top'] / float(h)) * dst_vspan
            wy2 = pad_y + (c['wick_bottom'] / float(h)) * dst_vspan
            by1 = pad_y + (c['body_top'] / float(h)) * dst_vspan
            by2 = pad_y + (c['body_bottom'] / float(h)) * dst_vspan
        # map width
        orig_w = c['width']
        bw = max(2.0, orig_w * scale_x * 0.85)

        # wick (thin neutral stroke)
        wick_color = '#374151'
        elems.append(f'<line x1="{x:.2f}" y1="{wy1:.2f}" x2="{x:.2f}" y2="{wy2:.2f}" stroke="{wick_color}" stroke-width="1.0" stroke-linecap="round" />')
        # shadow layers behind body (two soft offsets to mimic the blurred stacked shadows in the screenshot)
        shadow_offset1 = 6.0
        shadow_offset2 = 12.0
        bx = x - bw / 2.0
        bh = max(1.0, by2 - by1)
        sx1 = bx + shadow_offset1
        sy1 = by1 + shadow_offset1
        sx2 = bx + shadow_offset2
        sy2 = by1 + shadow_offset2
        elems.append(f'<rect x="{sx2:.2f}" y="{sy2:.2f}" width="{bw:.2f}" height="{bh:.2f}" rx="2" fill="#000000" opacity="0.03" />')
        elems.append(f'<rect x="{sx1:.2f}" y="{sy1:.2f}" width="{bw:.2f}" height="{bh:.2f}" rx="1.8" fill="#000000" opacity="0.06" />')
        # body (rounded, slightly translucent). choose up/down color
        body_opacity = 0.92
        elems.append(f'<rect x="{bx:.2f}" y="{by1:.2f}" width="{bw:.2f}" height="{bh:.2f}" rx="2" fill="{color}" fill-opacity="{body_opacity}" stroke="none" />')

    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {out_w} {out_h}" preserveAspectRatio="xMidYMid meet">\n'
    for e in elems:
        svg += '  ' + e + '\n'
    svg += '</svg>'
    return svg


def main():
    if len(sys.argv) < 3:
        print('Usage: generate_chart_svg.py input.png output.svg', file=sys.stderr)
        sys.exit(2)
    inp = sys.argv[1]
    out = sys.argv[2]

    img = cv2.imread(inp)
    if img is None:
        print('Eingabebild nicht gefunden oder kann nicht gelesen werden.', file=sys.stderr)
        sys.exit(1)
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5,5), 0)
    edges = cv2.Canny(blur, 50, 150)
    kernel = np.ones((3,3), np.uint8)
    edges = cv2.dilate(edges, kernel, iterations=1)

    # Try candlestick rendering first
    try:
        # generate candlestick SVG and invert trend so the output shows an up-trend
        svg = build_candlestick_svg(img, edges, (w,h), samples=100, out_size=(1200,360), padding=(40,28), invert_trend=True)
        # if svg contains rectangles/lines, assume candlestick succeeded
        if '<rect' in svg or '<line' in svg:
            with open(out, 'w', encoding='utf-8') as f:
                f.write(svg)
            print('SVG (candlestick) geschrieben:', out)
            return
    except Exception as e:
        # ignore and fallback to curve
        pass

    # Fallback: try curve extraction
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

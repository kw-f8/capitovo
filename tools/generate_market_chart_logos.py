import random

def generate_market_chart_logos():
    width = 1000
    height = 400
    padding = 40
    num_candles = 80
    
    # Colors
    up_color = "#2b6cb0" # Blue
    down_color = "#cbd5e0" # Gray
    wick_color = "#a0aec0"
    
    # Candle dimensions
    available_width = width - 2 * padding
    spacing = available_width / num_candles
    candle_width = spacing * 0.65
    
    # Generate price data (random walk with trend)
    prices = []
    current_price = 100
    for i in range(num_candles):
        open_price = current_price
        change = random.uniform(-3, 3.5) # Slight upward bias
        close_price = open_price + change
        high_price = max(open_price, close_price) + random.uniform(0, 4)
        low_price = min(open_price, close_price) - random.uniform(0, 4)
        
        prices.append({
            "open": open_price,
            "close": close_price,
            "high": high_price,
            "low": low_price
        })
        current_price = close_price

    # Normalize prices to fit height
    min_price = min(p["low"] for p in prices)
    max_price = max(p["high"] for p in prices)
    price_range = max_price - min_price
    if price_range == 0: price_range = 1
    
    def scale_y(price):
        # Invert Y (SVG coords)
        # Leave space for labels at top/bottom
        draw_height = height - 2 * padding
        return padding + draw_height - ((price - min_price) / price_range) * draw_height

    svg_parts = []
    svg_parts.append(f'<svg viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" class="w-full h-full">')
    
    # Defs
    svg_parts.append('<defs>')
    # Drop Shadow
    svg_parts.append('<filter id="chartShadow" x="-20%" y="-20%" width="140%" height="140%">')
    svg_parts.append('<feGaussianBlur in="SourceAlpha" stdDeviation="3"/>')
    svg_parts.append('<feOffset dx="2" dy="4" result="offsetblur"/>')
    svg_parts.append('<feComponentTransfer><feFuncA type="linear" slope="0.15"/></feComponentTransfer>')
    svg_parts.append('<feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>')
    svg_parts.append('</filter>')
    
    # Gradient for background (optional, maybe just white/transparent)
    svg_parts.append('</defs>')
    
    # Chart Group
    svg_parts.append('<g filter="url(#chartShadow)">')
    
    for i, candle in enumerate(prices):
        x_center = padding + i * spacing + spacing / 2
        y_open = scale_y(candle["open"])
        y_close = scale_y(candle["close"])
        y_high = scale_y(candle["high"])
        y_low = scale_y(candle["low"])
        
        is_up = candle["close"] >= candle["open"]
        color = up_color if is_up else down_color
        
        # Wick
        svg_parts.append(f'<line x1="{x_center:.1f}" y1="{y_high:.1f}" x2="{x_center:.1f}" y2="{y_low:.1f}" stroke="{wick_color}" stroke-width="1.5" />')
        
        # Body
        body_height = abs(y_close - y_open)
        if body_height < 1: body_height = 1
        y_body = min(y_open, y_close)
        
        svg_parts.append(f'<rect x="{x_center - candle_width/2:.1f}" y="{y_body:.1f}" width="{candle_width:.1f}" height="{body_height:.1f}" fill="{color}" rx="1" />')

    svg_parts.append('</g>')

    # Add Logos/Labels
    # Nvidia (Green)
    idx_nvidia = int(num_candles * 0.35)
    nvidia_candle = prices[idx_nvidia]
    x_nvidia = padding + idx_nvidia * spacing + spacing / 2
    y_nvidia = scale_y(nvidia_candle["high"]) - 35
    
    # Label Group Nvidia
    svg_parts.append(f'<g transform="translate({x_nvidia:.1f}, {y_nvidia:.1f})">')
    # Line to candle
    svg_parts.append(f'<line x1="0" y1="20" x2="0" y2="35" stroke="#475569" stroke-width="1" stroke-dasharray="2,2" />')
    # Bubble
    svg_parts.append('<rect x="-40" y="-15" width="80" height="30" rx="15" fill="white" stroke="#76b900" stroke-width="2" filter="url(#chartShadow)" />')
    # Text
    svg_parts.append('<text x="0" y="5" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1a1a1a">NVIDIA</text>')
    svg_parts.append('</g>')

    # Tesla (Red)
    idx_tesla = int(num_candles * 0.75)
    tesla_candle = prices[idx_tesla]
    x_tesla = padding + idx_tesla * spacing + spacing / 2
    y_tesla = scale_y(tesla_candle["high"]) - 50
    
    # Label Group Tesla
    svg_parts.append(f'<g transform="translate({x_tesla:.1f}, {y_tesla:.1f})">')
    # Line to candle
    svg_parts.append(f'<line x1="0" y1="20" x2="0" y2="50" stroke="#475569" stroke-width="1" stroke-dasharray="2,2" />')
    # Bubble
    svg_parts.append('<rect x="-35" y="-15" width="70" height="30" rx="15" fill="white" stroke="#cc0000" stroke-width="2" filter="url(#chartShadow)" />')
    # Text
    svg_parts.append('<text x="0" y="5" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1a1a1a">TESLA</text>')
    svg_parts.append('</g>')

    svg_parts.append('</svg>')
    
    return "\n".join(svg_parts)

if __name__ == "__main__":
    print(generate_market_chart_logos())

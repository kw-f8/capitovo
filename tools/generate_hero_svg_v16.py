import random

def generate_hero_svg():
    # Set seed for consistent, "good" looking shape (same as v5-v15)
    random.seed(55) 
    
    width = 600
    height = 200
    padding = 20
    # Keep 95 candles
    num_candles = 95
    
    # Colors - Kept from V13
    up_color = "#3DA7E2" 
    down_color = "#475569" 
    wick_color = "#1e293b"
    
    # Candle dimensions
    available_width = width - 2 * padding
    spacing = available_width / num_candles
    candle_width = spacing * 0.65
    
    # Generate price data (random walk)
    prices = []
    current_price = 100
    for _ in range(num_candles):
        open_price = current_price
        # Trend bias +0.25
        change = random.uniform(-3.25, 3.75) 
        close_price = open_price + change
        high_price = max(open_price, close_price) + random.uniform(0, 2.0)
        low_price = min(open_price, close_price) - random.uniform(0, 2.0)
        
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
        return height - padding - ((price - min_price) / price_range) * (height - 2 * padding)

    svg_parts = []
    svg_parts.append(f'<svg viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" class="hero-image">')
    
    svg_parts.append('<defs>')
    
    # CSS Animation - V15 (Realistic / No Swing)
    svg_parts.append('<style>')
    svg_parts.append('.candle-group { opacity: 0; animation: appear 0.5s ease-out forwards; }')
    svg_parts.append('@keyframes appear { from { opacity: 0; } to { opacity: 1; } }')
    svg_parts.append('</style>')

    # Enhanced Drop Shadow Filter - V16 (Stronger 3D, Lighter Shadow)
    svg_parts.append('<filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">')
    # Increased blur (stdDeviation 3 -> 5) for softer, more distant shadow
    svg_parts.append('<feGaussianBlur in="SourceAlpha" stdDeviation="5"/>')
    # Increased offset (dx 3->6, dy 4->8) for higher elevation
    svg_parts.append('<feOffset dx="6" dy="8" result="offsetblur"/>')
    # Reduced opacity (slope 0.5 -> 0.25) to keep it subtle/not too dark
    svg_parts.append('<feComponentTransfer><feFuncA type="linear" slope="0.25"/></feComponentTransfer>')
    svg_parts.append('<feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>')
    svg_parts.append('</filter>')
    
    # Fade Gradient Mask
    svg_parts.append('<linearGradient id="fadeGradient" x1="0" x2="1" y1="0" y2="0">')
    svg_parts.append('<stop offset="0%" stop-color="white" stop-opacity="0"/>')
    svg_parts.append('<stop offset="15%" stop-color="white" stop-opacity="1"/>')
    svg_parts.append('<stop offset="85%" stop-color="white" stop-opacity="1"/>')
    svg_parts.append('<stop offset="100%" stop-color="white" stop-opacity="0"/>')
    svg_parts.append('</linearGradient>')
    
    svg_parts.append('<mask id="fadeMask">')
    svg_parts.append(f'<rect x="0" y="0" width="{width}" height="{height}" fill="url(#fadeGradient)"/>')
    svg_parts.append('</mask>')
    
    svg_parts.append('</defs>')
    
    # Group with mask and filter
    svg_parts.append('<g mask="url(#fadeMask)" filter="url(#dropShadow)">')
    
    for i, candle in enumerate(prices):
        x_center = padding + i * spacing + spacing / 2
        y_open = scale_y(candle["open"])
        y_close = scale_y(candle["close"])
        y_high = scale_y(candle["high"])
        y_low = scale_y(candle["low"])
        
        is_up = candle["close"] >= candle["open"]
        color = up_color if is_up else down_color
        
        # Animation delay
        delay = i * 0.06 
        
        svg_parts.append(f'<g class="candle-group" style="animation-delay: {delay:.3f}s">')
        
        # Wick
        svg_parts.append(f'<line x1="{x_center:.1f}" y1="{y_high:.1f}" x2="{x_center:.1f}" y2="{y_low:.1f}" stroke="{wick_color}" stroke-width="1" />')
        
        # Body
        body_height = abs(y_close - y_open)
        if body_height < 1: body_height = 1
        y_body = min(y_open, y_close)
        
        svg_parts.append(f'<rect x="{x_center - candle_width/2:.1f}" y="{y_body:.1f}" width="{candle_width:.1f}" height="{body_height:.1f}" fill="{color}" fill-opacity="0.9" rx="1" />')
        
        svg_parts.append('</g>')

    svg_parts.append('</g>')
    svg_parts.append('</svg>')
    
    return "\n".join(svg_parts)

if __name__ == "__main__":
    print(generate_hero_svg())

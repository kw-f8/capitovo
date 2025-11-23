
import random

def generate_candlestick_svg():
    width = 800
    height = 350 # Slightly reduced height
    padding = 20 # Reduced padding
    num_candles = 60 # Increased from 30 to 60
    
    # Colors
    # bg_color = "#f7f8fa" # Removed background
    up_color = "#2b6cb0"
    down_color = "#c8cdd4"
    wick_color = "#d0d4da"
    
    # Candle dimensions
    # Calculate width based on number of candles
    available_width = width - 2 * padding
    spacing = available_width / num_candles
    candle_width = spacing * 0.65 # Slightly wider relative to spacing for "compressed" look
    
    # Generate price data (random walk)
    prices = []
    current_price = 100
    for _ in range(num_candles):
        open_price = current_price
        change = random.uniform(-4, 4) # Slightly less volatility per step
        close_price = open_price + change
        high_price = max(open_price, close_price) + random.uniform(0, 2.5)
        low_price = min(open_price, close_price) - random.uniform(0, 2.5)
        
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
        # Invert Y axis (0 is top)
        return height - padding - ((price - min_price) / price_range) * (height - 2 * padding)

    svg_parts = []
    # Added style="background: transparent;" just in case, though not strictly needed for SVG
    svg_parts.append(f'<svg viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" class="hero-image">')
    # Background rect removed
    
    for i, candle in enumerate(prices):
        x_center = padding + i * spacing + spacing / 2
        y_open = scale_y(candle["open"])
        y_close = scale_y(candle["close"])
        y_high = scale_y(candle["high"])
        y_low = scale_y(candle["low"])
        
        is_up = candle["close"] >= candle["open"]
        color = up_color if is_up else down_color
        
        # Wick
        svg_parts.append(f'<line x1="{x_center:.1f}" y1="{y_high:.1f}" x2="{x_center:.1f}" y2="{y_low:.1f}" stroke="{wick_color}" stroke-width="1" />')
        
        # Body
        body_height = abs(y_close - y_open)
        if body_height < 1: body_height = 1 # Minimum height
        y_body = min(y_open, y_close)
        
        svg_parts.append(f'<rect x="{x_center - candle_width/2:.1f}" y="{y_body:.1f}" width="{candle_width:.1f}" height="{body_height:.1f}" fill="{color}" fill-opacity="0.9" rx="1" />')

    svg_parts.append('</svg>')
    
    return "\n".join(svg_parts)

print(generate_candlestick_svg())

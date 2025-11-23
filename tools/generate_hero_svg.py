
import random

def generate_candlestick_svg():
    width = 800
    height = 400
    padding = 40
    num_candles = 30
    
    # Colors
    bg_color = "#f7f8fa"
    up_color = "#2b6cb0"
    down_color = "#c8cdd4"
    wick_color = "#d0d4da"
    
    # Candle dimensions
    candle_width = (width - 2 * padding) / num_candles * 0.6
    spacing = (width - 2 * padding) / num_candles
    
    # Generate price data (random walk)
    prices = []
    current_price = 100
    for _ in range(num_candles):
        open_price = current_price
        change = random.uniform(-5, 5)
        close_price = open_price + change
        high_price = max(open_price, close_price) + random.uniform(0, 3)
        low_price = min(open_price, close_price) - random.uniform(0, 3)
        
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
    
    def scale_y(price):
        return height - padding - ((price - min_price) / price_range) * (height - 2 * padding)

    svg_parts = []
    svg_parts.append(f'<svg viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" class="hero-image">')
    svg_parts.append(f'<rect width="100%" height="100%" fill="{bg_color}"/>')
    
    for i, candle in enumerate(prices):
        x_center = padding + i * spacing + spacing / 2
        y_open = scale_y(candle["open"])
        y_close = scale_y(candle["close"])
        y_high = scale_y(candle["high"])
        y_low = scale_y(candle["low"])
        
        is_up = candle["close"] >= candle["open"]
        color = up_color if is_up else down_color
        
        # Wick
        svg_parts.append(f'<line x1="{x_center}" y1="{y_high}" x2="{x_center}" y2="{y_low}" stroke="{wick_color}" stroke-width="1" />')
        
        # Body
        body_height = abs(y_close - y_open)
        if body_height < 1: body_height = 1 # Minimum height
        y_body = min(y_open, y_close)
        
        svg_parts.append(f'<rect x="{x_center - candle_width/2}" y="{y_body}" width="{candle_width}" height="{body_height}" fill="{color}" fill-opacity="0.9" rx="1" />')

    svg_parts.append('</svg>')
    
    return "\n".join(svg_parts)

print(generate_candlestick_svg())

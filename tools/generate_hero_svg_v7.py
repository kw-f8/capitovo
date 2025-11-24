import random
import math

def generate_hero_svg():
    # --- Configuration ---
    width = 600
    height = 200
    
    # Colors
    bg_color = "none"  # Transparent background
    bullish_color = "#2b6cb0"  # Blue
    bearish_color = "#c8cdd4"  # Grey
    
    # Candle settings
    num_candles = 40
    candle_width = 8
    spacing = (width - 100) / num_candles  # Distribute across width with some padding
    
    # Random walk parameters
    start_price = 100
    volatility = 2.5
    
    # Animation settings
    # Match typing speed: 48ms per step = 0.048s
    animation_step_duration = 0.048 
    
    # --- Data Generation ---
    # Set seed to 55 to maintain the specific shape the user liked
    random.seed(55)
    
    candles = []
    current_price = start_price
    
    for i in range(num_candles):
        open_price = current_price
        change = random.gauss(0, volatility)
        close_price = open_price + change
        
        # High and Low
        high_price = max(open_price, close_price) + abs(random.gauss(0, volatility/2))
        low_price = min(open_price, close_price) - abs(random.gauss(0, volatility/2))
        
        candles.append({
            "open": open_price,
            "close": close_price,
            "high": high_price,
            "low": low_price,
            "index": i
        })
        current_price = close_price

    # --- Scaling ---
    all_values = [c["high"] for c in candles] + [c["low"] for c in candles]
    min_val = min(all_values)
    max_val = max(all_values)
    val_range = max_val - min_val
    
    # Add padding to vertical range (10%)
    padding_y = val_range * 0.1
    min_val -= padding_y
    max_val += padding_y
    val_range = max_val - min_val
    
    def scale_y(price):
        # Invert Y axis (SVG 0 is top)
        return height - ((price - min_val) / val_range * height)

    # --- SVG Generation ---
    svg_parts = []
    svg_parts.append(f'<svg viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">')
    
    # Definitions for filters and gradients
    svg_parts.append('<defs>')
    
    # Drop shadow filter
    svg_parts.append('''
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
        <feOffset dx="1" dy="2" result="offsetblur"/>
        <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
        </feComponentTransfer>
        <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
        </feMerge>
    </filter>
    ''')
    
    # Gradient mask for fading edges
    svg_parts.append('''
    <linearGradient id="fadeMask" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stop-color="white" stop-opacity="0"/>
        <stop offset="10%" stop-color="white" stop-opacity="1"/>
        <stop offset="90%" stop-color="white" stop-opacity="1"/>
        <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </linearGradient>
    ''')
    
    # Mask definition
    svg_parts.append('''
    <mask id="maskLayer">
        <rect x="0" y="0" width="100%" height="100%" fill="url(#fadeMask)"/>
    </mask>
    ''')
    
    # CSS for Animation
    # Removed translateY to stop the "swinging" effect.
    # Adjusted duration to be snappy but smooth.
    svg_parts.append('''
    <style>
        .candle-group {
            opacity: 0;
            animation: appear 0.3s ease-out forwards;
        }
        @keyframes appear {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
    </style>
    ''')
    
    svg_parts.append('</defs>')
    
    # Group with mask
    svg_parts.append(f'<g mask="url(#maskLayer)">')
    
    # Draw Candles
    for i, c in enumerate(candles):
        x = 50 + i * spacing  # Start with 50px padding
        y_open = scale_y(c["open"])
        y_close = scale_y(c["close"])
        y_high = scale_y(c["high"])
        y_low = scale_y(c["low"])
        
        color = bullish_color if c["close"] >= c["open"] else bearish_color
        
        # Candle body height must be at least 1px
        body_height = max(1, abs(y_close - y_open))
        body_y = min(y_open, y_close)
        
        # Animation delay
        delay = i * animation_step_duration
        
        # Group for the single candle (wick + body)
        svg_parts.append(f'<g class="candle-group" style="animation-delay: {delay:.3f}s;">')
        
        # Wick
        svg_parts.append(f'<line x1="{x}" y1="{y_high}" x2="{x}" y2="{y_low}" stroke="{color}" stroke-width="1.5" filter="url(#shadow)" />')
        
        # Body
        # 3D effect: slightly lighter left/top border, darker right/bottom
        svg_parts.append(f'<rect x="{x - candle_width/2}" y="{body_y}" width="{candle_width}" height="{body_height}" fill="{color}" filter="url(#shadow)" rx="1" />')
        
        svg_parts.append('</g>')

    svg_parts.append('</g>') # End masked group
    svg_parts.append('</svg>')
    
    return "\n".join(svg_parts)

if __name__ == "__main__":
    print(generate_hero_svg())

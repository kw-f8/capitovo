#!/usr/bin/env python3
"""
FMP API Proxy Server for capitovo
Bypasses CORS restrictions by making server-side API calls
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

FMP_API_KEY = 'OQ6IIDD26Cnm3fPtXiQw8O05ZAaBPFRI'
FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3'

class ProxyHandler(BaseHTTPRequestHandler):
    
    def do_GET(self):
        """Handle GET requests"""
        
        # Parse URL
        parsed_path = urllib.parse.urlparse(self.path)
        
        # Enable CORS
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        # Route: /earnings-calendar
        if parsed_path.path == '/earnings-calendar':
            try:
                # Parse query parameters
                query_params = urllib.parse.parse_qs(parsed_path.query)
                from_date = query_params.get('from', [None])[0]
                to_date = query_params.get('to', [None])[0]
                
                # Default: Today to +90 days
                if not from_date:
                    from_date = datetime.now().strftime('%Y-%m-%d')
                if not to_date:
                    to_date = (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d')
                
                # Build FMP API URL
                fmp_url = f"{FMP_BASE_URL}/earning_calendar?from={from_date}&to={to_date}&apikey={FMP_API_KEY}"
                
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Fetching: {fmp_url}")
                
                # Make request to FMP API
                with urllib.request.urlopen(fmp_url) as response:
                    data = response.read()
                    
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Success: {len(data)} bytes received")
                
                # Forward response
                self.wfile.write(data)
                
            except Exception as e:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Error: {str(e)}")
                error_response = {
                    'error': str(e),
                    'message': 'Failed to fetch earnings calendar'
                }
                self.wfile.write(json.dumps(error_response).encode())
        
        else:
            # Unknown endpoint
            error_response = {
                'error': 'Not Found',
                'message': f'Endpoint {parsed_path.path} not found'
            }
            self.wfile.write(json.dumps(error_response).encode())
    
    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        """Custom log format"""
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {args[0]}")

def run_server(port=3000):
    """Start the proxy server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, ProxyHandler)
    print(f"""
╔═══════════════════════════════════════╗
║   🚀 FMP API Proxy Server Started    ║
╠═══════════════════════════════════════╣
║  Port: {port}                         ║
║  Endpoint: /earnings-calendar         ║
║  CORS: Enabled                        ║
╚═══════════════════════════════════════╝

Listening on http://localhost:{port}
Press Ctrl+C to stop
""")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n⛔ Server stopped")
        httpd.shutdown()

if __name__ == '__main__':
    run_server()

import webview
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
from core.photo_editor import PhotoEditor

def expose_api():
    """Create and return the PhotoEditor instance."""
    return PhotoEditor()

def get_absolute_path(relative_path):
    """Convert relative path to absolute path."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, relative_path)

class StaticFileHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)

def start_server(port=0):
    """Start HTTP server on a random port and return the port number."""
    server = HTTPServer(('localhost', port), StaticFileHandler)
    port = server.server_address[1]
    
    def run_server():
        server.serve_forever()
    
    thread = threading.Thread(target=run_server, daemon=True)
    thread.start()
    return port

def main():
    """Launch the application window."""
    # Start static file server
    port = start_server()
    base_url = f'http://localhost:{port}'
    
    api = expose_api()
    window = webview.create_window(
        'Pentax17 Photo Splitter',
        f'{base_url}/templates/index.html',
        js_api=api,
        min_size=(800, 600)
    )
    webview.start(debug=True)

if __name__ == '__main__':
    main()
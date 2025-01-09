import webview
from core.photo_editor import PhotoEditor

def expose_api():
    """Create and return the PhotoEditor instance."""
    return PhotoEditor()

def main():
    """Launch the application window."""
    api = expose_api()
    window = webview.create_window(
        'Pentax-17 Photo Splitter',
        'templates/index.html',
        js_api=api,
        min_size=(800, 600)
    )
    webview.start(debug=True)

if __name__ == '__main__':
    main()
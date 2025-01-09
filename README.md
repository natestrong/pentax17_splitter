# Photo Editor

A desktop application for editing photos with a modern web-based interface. Built with Python and pywebview.

## Features

- Native file dialogs for selecting photos and output directory
- Edit photos with:
  - Rotation
  - Brightness adjustment
  - Contrast adjustment
- Modern, responsive web interface
- Native desktop window
- Process photos in their original location
- Save edited photos to chosen output directory

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python app.py
```

## Project Structure

- `app.py` - Main application file with pywebview implementation
- `templates/` - Contains the HTML interface
  - `index.html` - Main application interface

## Usage

1. Click "Choose Photos" to select one or more images using the native file dialog
2. Click "Select Output Directory" to choose where edited photos will be saved
3. Adjust the editing controls for each image:
   - Rotation: Enter degrees to rotate
   - Brightness: 1.0 is normal, >1 brighter, <1 darker
   - Contrast: 1.0 is normal, >1 more contrast, <1 less contrast
4. Click "Apply Edits" to save the edited version to your chosen directory
5. Edited images will be saved with "edited_" prefix in the output directory

import os
from PIL import Image
from pathlib import Path
import base64
from io import BytesIO

class PhotoEditor:
    def __init__(self):
        self.output_directory = None

    def select_output_directory(self):
        """Handle output directory selection."""
        try:
            from webview import windows, FOLDER_DIALOG
            directory = windows[0].create_file_dialog(
                FOLDER_DIALOG,
                directory=os.path.expanduser('~')
            )
            if directory:
                self.output_directory = directory[0]
                return {'success': True, 'path': self.output_directory}
            return {'success': False, 'error': 'No directory selected'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def _split_and_encode_image(self, img):
        """Split image and convert both halves to data URLs."""
        width, height = img.size
        mid_x = width // 2

        # Create left and right halves
        left_half = img.crop((0, 0, mid_x, height))
        right_half = img.crop((mid_x, 0, width, height))

        # Convert both halves to data URLs
        def to_data_url(image):
            buffer = BytesIO()
            image.save(buffer, format='JPEG', quality=85)
            img_str = base64.b64encode(buffer.getvalue()).decode()
            return f'data:image/jpeg;base64,{img_str}'

        return to_data_url(left_half), to_data_url(right_half)

    def select_photos(self, last_dir=None):
        """Handle photo selection."""
        try:
            from webview import windows, OPEN_DIALOG
            
            # Handle the last_dir parameter
            if last_dir and last_dir != '~':
                directory = os.path.expanduser(last_dir)
                if not os.path.exists(directory):
                    directory = os.path.expanduser('~')
            else:
                directory = os.path.expanduser('~')
                
            file_types = ('Images (*.jpg;*.png;*.jpeg)', )
            result = windows[0].create_file_dialog(
                OPEN_DIALOG,
                directory=directory,
                allow_multiple=True,
                file_types=file_types
            )
            
            if not result:
                return {'success': False, 'error': 'No files selected'}
            
            # Process selected files
            files_with_data = []
            for file_path in result:
                try:
                    with Image.open(file_path) as img:
                        # Convert to RGB if necessary
                        if img.mode in ('RGBA', 'P'):
                            img = img.convert('RGB')
                        # Resize for preview
                        max_size = (800, 800)
                        img.thumbnail(max_size, Image.Resampling.LANCZOS)
                        
                        # Split and get data URLs for both halves
                        left_url, right_url = self._split_and_encode_image(img)
                        
                        files_with_data.append({
                            'path': file_path,
                            'left_data_url': left_url,
                            'right_data_url': right_url
                        })
                except Exception as e:
                    print(f"Error processing {file_path}: {str(e)}")
                    continue
            
            if not files_with_data:
                return {'success': False, 'error': 'No valid images were processed'}
            
            # Get the directory of the first selected file for next time
            last_dir = str(Path(result[0]).parent)
                
            return {
                'success': True,
                'files': files_with_data,
                'lastDir': last_dir
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def process_image(self, file_path, edits):
        """Split an image into left and right halves and save them separately."""
        if not self.output_directory:
            return {'success': False, 'error': 'Output directory not set'}

        try:
            with Image.open(file_path) as img:
                # Get the dimensions
                width, height = img.size
                
                # Calculate the middle point
                mid_x = width // 2
                
                # Create left and right halves
                left_half = img.crop((0, 0, mid_x, height))
                right_half = img.crop((mid_x, 0, width, height))
                
                # Generate output filenames
                base_name = Path(file_path).stem  # Get filename without extension
                extension = Path(file_path).suffix  # Get file extension
                
                left_filename = f"{base_name}_l{extension}"
                right_filename = f"{base_name}_r{extension}"
                
                left_path = os.path.join(self.output_directory, left_filename)
                right_path = os.path.join(self.output_directory, right_filename)
                
                # Save both halves
                left_half.save(left_path)
                right_half.save(right_path)

                return {
                    'success': True,
                    'output_files': [left_filename, right_filename],
                    'output_paths': [left_path, right_path]
                }
        except Exception as e:
            return {'success': False, 'error': str(e)}

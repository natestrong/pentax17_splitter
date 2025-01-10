import os
from PIL import Image
import numpy as np
from pathlib import Path
import base64
from io import BytesIO

class PhotoEditor:
    def __init__(self):
        self.output_directory = None
        self.black_threshold = 45  # Increased from 30 to catch more dark pixels
        self.border_threshold = 0.85  # Decreased from 0.95 to require fewer black pixels

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

    def _split_and_encode_image(self, img, for_preview=False):
        """Split image and convert both halves to data URLs."""
        width, height = img.size
        mid_x = width // 2

        # Create left and right halves
        left_half = img.crop((0, 0, mid_x, height))
        right_half = img.crop((mid_x, 0, width, height))

        # Get crop coordinates for both halves if needed
        left_crop = self.detect_black_borders(left_half) if for_preview else None
        right_crop = self.detect_black_borders(right_half) if for_preview else None

        # Create cropped versions if borders were detected
        left_cropped = left_half.crop(left_crop) if left_crop else None
        right_cropped = right_half.crop(right_crop) if right_crop else None

        # For preview, we'll maintain a higher resolution but still resize very large images
        if for_preview:
            def resize_if_needed(image):
                if not image:
                    return None
                w, h = image.size
                max_size = (2048, 2048)  # Much larger max size for preview
                if w > max_size[0] or h > max_size[1]:
                    image.thumbnail(max_size, Image.Resampling.LANCZOS)
                return image

            left_half = resize_if_needed(left_half)
            right_half = resize_if_needed(right_half)
            if left_cropped:
                left_cropped = resize_if_needed(left_cropped)
            if right_cropped:
                right_cropped = resize_if_needed(right_cropped)

        # Convert images to data URLs
        def to_data_url(image):
            if not image:
                return None
            buffer = BytesIO()
            image.save(buffer, format='JPEG', quality=95)
            img_str = base64.b64encode(buffer.getvalue()).decode()
            return f'data:image/jpeg;base64,{img_str}'

        return {
            'left': {
                'original': to_data_url(left_half),
                'cropped': to_data_url(left_cropped),
                'crop_coords': left_crop
            },
            'right': {
                'original': to_data_url(right_half),
                'cropped': to_data_url(right_cropped),
                'crop_coords': right_crop
            }
        }

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
                        
                        # Split and get data URLs for both halves with crop info
                        image_data = self._split_and_encode_image(img, for_preview=True)
                        
                        files_with_data.append({
                            'path': file_path,
                            'left_data_url': image_data['left']['original'],
                            'right_data_url': image_data['right']['original'],
                            'left_cropped_url': image_data['left']['cropped'],
                            'right_cropped_url': image_data['right']['cropped'],
                            'left_crop_coords': image_data['left']['crop_coords'],
                            'right_crop_coords': image_data['right']['crop_coords']
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

    def detect_black_borders(self, img):
        """Detect black borders in an image and return the crop coordinates."""
        # Convert image to grayscale numpy array
        gray = np.array(img.convert('L'))
        height, width = gray.shape
        
        # Find black rows and columns (where most pixels are black)
        def is_line_black(line):
            return np.mean(line < self.black_threshold) > self.border_threshold
        
        # Check top border
        top = 0
        while top < height and is_line_black(gray[top]):
            top += 1
        
        # Check bottom border
        bottom = height - 1
        while bottom > top and is_line_black(gray[bottom]):
            bottom -= 1
        
        # Check left border
        left = 0
        while left < width and is_line_black(gray[:, left]):
            left += 1
        
        # Check right border
        right = width - 1
        while right > left and is_line_black(gray[:, right]):
            right -= 1
        
        # Return None if no significant borders were found
        if top == 0 and bottom == height - 1 and left == 0 and right == width - 1:
            return None
        
        # Add a small padding to avoid cutting too tight
        padding = 2
        top = max(0, top - padding)
        bottom = min(height - 1, bottom + padding)
        left = max(0, left - padding)
        right = min(width - 1, right + padding)
        
        return (left, top, right + 1, bottom + 1)

    def process_image(self, file_path, edits):
        """Split an image into left and right halves and save them separately."""
        try:
            print(f"Processing image {file_path} with edits: {edits}")  # Debug log
            with Image.open(file_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                
                width, height = img.size
                mid_x = width // 2
                
                # Handle left half
                if edits.get('exportLeft', True):
                    left_half = img.crop((0, 0, mid_x, height))
                    
                    # Apply app-specified crop if available
                    left_crop_coords = edits.get('leftCropCoords')
                    if left_crop_coords:
                        print(f"Applying left crop coords: {left_crop_coords}")  # Debug log
                        left_half = left_half.crop(tuple(left_crop_coords))
                    # Otherwise use automatic border detection if enabled
                    elif edits.get('removeBorderLeft', True):
                        crop_box = self.detect_black_borders(left_half)
                        if crop_box:
                            print(f"Applying auto-detected left crop: {crop_box}")  # Debug log
                            left_half = left_half.crop(crop_box)
                    
                    # Apply rotation after cropping
                    left_rotation = edits.get('leftRotation', 0)
                    print(f"Applying left rotation: {left_rotation}")  # Debug log
                    if left_rotation:
                        # Convert from clockwise to counterclockwise
                        pil_rotation = (360 - left_rotation) % 360
                        left_half = left_half.rotate(pil_rotation, expand=True)
                    
                    output_path = os.path.join(
                        self.output_directory,
                        f"{Path(file_path).stem}_left.jpg"
                    )
                    left_half.save(output_path, 'JPEG', quality=95)
                
                # Handle right half
                if edits.get('exportRight', True):
                    right_half = img.crop((mid_x, 0, width, height))
                    
                    # Apply app-specified crop if available
                    right_crop_coords = edits.get('rightCropCoords')
                    if right_crop_coords:
                        print(f"Applying right crop coords: {right_crop_coords}")  # Debug log
                        right_half = right_half.crop(tuple(right_crop_coords))
                    # Otherwise use automatic border detection if enabled
                    elif edits.get('removeBorderRight', True):
                        crop_box = self.detect_black_borders(right_half)
                        if crop_box:
                            print(f"Applying auto-detected right crop: {crop_box}")  # Debug log
                            right_half = right_half.crop(crop_box)
                    
                    # Apply rotation after cropping
                    right_rotation = edits.get('rightRotation', 0)
                    print(f"Applying right rotation: {right_rotation}")  # Debug log
                    if right_rotation:
                        # Convert from clockwise to counterclockwise
                        pil_rotation = (360 - right_rotation) % 360
                        right_half = right_half.rotate(pil_rotation, expand=True)
                    
                    output_path = os.path.join(
                        self.output_directory,
                        f"{Path(file_path).stem}_right.jpg"
                    )
                    right_half.save(output_path, 'JPEG', quality=95)
                
                return True
        except Exception as e:
            print(f"Error processing {file_path}: {str(e)}")
            return False

    def process_all_images(self, images):
        """
        Process multiple images at once.
        images: List of dicts with {path, exportLeft, exportRight, leftRotation, rightRotation}
        """
        try:
            processed = 0
            skipped = 0
            
            for img_info in images:
                success = self.process_image(img_info['path'], img_info)
                if success:
                    if img_info.get('exportLeft', True):
                        processed += 1
                    else:
                        skipped += 1
                    if img_info.get('exportRight', True):
                        processed += 1
                    else:
                        skipped += 1
                else:
                    skipped += 2
            
            return {
                'success': True,
                'summary': f'Processed {processed} image halves, skipped {skipped}'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

export class ImageGrid {
    constructor(modal) {
        this.modal = modal;
        this.container = document.getElementById('image-container');
        this.deletedHalves = new Set(); // Track deleted image halves
        this.rotations = new Map(); // Track rotation degrees for each half
        this.imageAspectRatios = new Map();
        this.removeBorders = new Map(); // Track border removal state for each half
        this.imageData = new Map(); // Store both original and cropped versions
    }

    display(files) {
        this.container.innerHTML = '';
        this.modal.setFiles(files);
        this.deletedHalves.clear();
        this.rotations.clear();
        this.imageAspectRatios.clear();
        this.removeBorders.clear();
        this.imageData.clear();
        
        files.forEach((file, index) => {
            const card = document.createElement('div');
            card.className = 'image-card';
            card.dataset.index = index;
            
            const filename = document.createElement('div');
            filename.className = 'filename';
            filename.textContent = file.path.split('/').pop();
            card.appendChild(filename);
            
            const splitPreview = document.createElement('div');
            splitPreview.className = 'split-preview';
            
            // Store image data
            this.imageData.set(`${index}-left`, {
                original: file.left_data_url,
                cropped: file.left_cropped_url,
                cropCoords: file.left_crop_coords
            });
            this.imageData.set(`${index}-right`, {
                original: file.right_data_url,
                cropped: file.right_cropped_url,
                cropCoords: file.right_crop_coords
            });
            
            // Create preview containers
            splitPreview.appendChild(this.createPreviewContainer(file, 'left', index));
            splitPreview.appendChild(this.createPreviewContainer(file, 'right', index));
            
            card.appendChild(splitPreview);
            this.container.appendChild(card);
        });
    }

    createPreviewContainer(file, side, index) {
        const container = document.createElement('div');
        container.className = 'preview-container';
        const key = `${index}-${side}`;
        container.dataset.key = key;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';
        
        const img = document.createElement('img');
        img.className = 'preview-image';
        const imageData = this.imageData.get(key);
        img.src = imageData.original;
        img.onclick = () => {
            const rotation = this.rotations.get(key) || 0;
            this.modal.show(img.src, side, file.path, rotation);
        };
        
        // Set initial aspect ratio
        const tempImg = new Image();
        tempImg.onload = () => {
            this.imageAspectRatios.set(key, tempImg.width / tempImg.height);
            this.updateImageWrapperSize(wrapper, this.imageAspectRatios.get(key), 0);
        };
        tempImg.src = imageData.original;
        
        wrapper.appendChild(img);
        container.appendChild(wrapper);
        
        // Add toolbar
        const tools = document.createElement('div');
        tools.className = 'preview-tools';
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleDelete(key, index, deleteBtn);
        };
        
        // Rotation button
        const rotateBtn = document.createElement('button');
        rotateBtn.innerHTML = '<i class="fas fa-redo"></i>';
        rotateBtn.onclick = (e) => {
            e.stopPropagation();
            this.rotateImage(key);
        };
        
        // Border removal checkbox
        const borderLabel = document.createElement('label');
        borderLabel.className = 'border-remove-label';
        borderLabel.innerHTML = '<i class="fas fa-crop"></i>';
        borderLabel.title = 'Remove black borders';
        
        const borderCheck = document.createElement('input');
        borderCheck.type = 'checkbox';
        borderCheck.checked = true; // Default to checked
        borderCheck.style.display = 'none';
        
        borderCheck.onchange = () => {
            this.removeBorders.set(key, borderCheck.checked);
            const imageData = this.imageData.get(key);
            img.src = borderCheck.checked && imageData.cropped ? 
                     imageData.cropped : imageData.original;
        };
        
        borderLabel.appendChild(borderCheck);
        
        tools.appendChild(deleteBtn);
        tools.appendChild(rotateBtn);
        tools.appendChild(borderLabel);
        container.appendChild(tools);
        
        // Set initial state
        this.removeBorders.set(key, true);
        if (imageData.cropped) {
            img.src = imageData.cropped;
        }
        
        return container;
    }

    toggleDelete(key, index, deleteBtn) {
        const container = this.container.querySelector(
            `.preview-container[data-key="${key}"]`
        );
        
        if (this.deletedHalves.has(key)) {
            // Undelete
            this.deletedHalves.delete(key);
            container.classList.remove('deleted');
            deleteBtn.classList.remove('active');
        } else {
            // Delete
            this.deletedHalves.add(key);
            container.classList.add('deleted');
            deleteBtn.classList.add('active');
        }
        
        // Check if both halves are deleted
        const side = key.split('-')[1];
        const otherSide = side === 'left' ? 'right' : 'left';
        const otherKey = `${index}-${otherSide}`;
        
        const card = this.container.querySelector(
            `.image-card[data-index="${index}"]`
        );
        
        if (this.deletedHalves.has(otherKey) && this.deletedHalves.has(key)) {
            // Both halves are deleted
            if (card) {
                card.classList.add('fully-deleted');
            }
        } else {
            // At least one half is not deleted
            if (card) {
                card.classList.remove('fully-deleted');
            }
        }
    }

    updateImageWrapperSize(wrapper, aspectRatio, rotation) {
        const img = wrapper.querySelector('img');
        const isRotated = rotation === 90 || rotation === 270;
        
        // Get the natural dimensions of the image
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        
        // Get the available width from the parent container
        const containerWidth = wrapper.parentElement.offsetWidth;
        
        if (isRotated) {
            // For rotated images, swap width and height
            const heightRatio = naturalWidth / naturalHeight;
            wrapper.style.height = `${containerWidth * heightRatio}px`;
        } else {
            // For non-rotated images, use original aspect ratio
            wrapper.style.height = `${containerWidth / aspectRatio}px`;
        }
    }

    rotateImage(key) {
        const currentRotation = this.rotations.get(key) || 0;
        const newRotation = (currentRotation - 90 + 360) % 360;
        this.rotations.set(key, newRotation);
        
        const container = this.container.querySelector(
            `.preview-container[data-key="${key}"]`
        );
        const img = container.querySelector('img');
        img.classList.remove('rotate-90', 'rotate-180', 'rotate-270');
        if (newRotation > 0) {
            img.classList.add(`rotate-${newRotation}`);
        }
        
        const wrapper = img.closest('.image-wrapper');
        const aspectRatio = this.imageAspectRatios.get(key);
        this.updateImageWrapperSize(wrapper, aspectRatio, newRotation);
    }
}

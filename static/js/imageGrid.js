export class ImageGrid {
    constructor(modal) {
        this.modal = modal;
        this.container = document.getElementById('image-container');
        this.deletedHalves = new Set(); // Track deleted image halves
        this.rotations = new Map(); // Track rotation degrees for each half
        this.imageAspectRatios = new Map();
    }

    display(files) {
        this.container.innerHTML = '';
        this.modal.setFiles(files);
        this.deletedHalves.clear();
        this.rotations.clear();
        this.imageAspectRatios.clear();
        
        files.forEach((file, index) => {
            const card = document.createElement('div');
            card.className = 'image-card';
            card.dataset.index = index;
            
            const filename = document.createElement('div');
            filename.className = 'filename';
            filename.textContent = file.path;
            card.appendChild(filename);
            
            const splitPreview = document.createElement('div');
            splitPreview.className = 'split-preview';
            
            // Left half
            const leftContainer = document.createElement('div');
            leftContainer.className = 'preview-container';
            leftContainer.dataset.side = 'left';
            leftContainer.dataset.path = file.path;
            
            const leftWrapper = document.createElement('div');
            leftWrapper.className = 'image-wrapper';
            
            const leftImg = document.createElement('img');
            leftImg.src = file.left_data_url;
            leftImg.onload = () => {
                const aspectRatio = leftImg.naturalWidth / leftImg.naturalHeight;
                this.imageAspectRatios.set(`${file.path}-left`, aspectRatio);
                this.updateImageWrapperSize(leftWrapper, aspectRatio, 0);
            };
            leftImg.onclick = () => {
                const rotation = this.rotations.get(`${file.path}-left`) || 0;
                this.modal.show(file.left_data_url, 'left', file.path, rotation);
            };
            
            leftWrapper.appendChild(leftImg);
            
            leftContainer.appendChild(leftWrapper);
            
            const leftButtons = document.createElement('div');
            leftButtons.className = 'preview-buttons';
            
            const deleteLeftBtn = document.createElement('button');
            deleteLeftBtn.className = 'preview-button delete';
            deleteLeftBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteLeftBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteHalf(file.path, 'left');
            };
            
            const rotateLeftBtn = document.createElement('button');
            rotateLeftBtn.className = 'preview-button rotate';
            rotateLeftBtn.innerHTML = '<i class="fas fa-rotate"></i>';
            rotateLeftBtn.onclick = (e) => {
                e.stopPropagation();
                this.rotateHalf(file.path, 'left');
            };
            
            leftButtons.appendChild(deleteLeftBtn);
            leftButtons.appendChild(rotateLeftBtn);
            leftContainer.appendChild(leftButtons);
            
            splitPreview.appendChild(leftContainer);
            
            // Right half
            const rightContainer = document.createElement('div');
            rightContainer.className = 'preview-container';
            rightContainer.dataset.side = 'right';
            rightContainer.dataset.path = file.path;
            
            const rightWrapper = document.createElement('div');
            rightWrapper.className = 'image-wrapper';
            
            const rightImg = document.createElement('img');
            rightImg.src = file.right_data_url;
            rightImg.onload = () => {
                const aspectRatio = rightImg.naturalWidth / rightImg.naturalHeight;
                this.imageAspectRatios.set(`${file.path}-right`, aspectRatio);
                this.updateImageWrapperSize(rightWrapper, aspectRatio, 0);
            };
            rightImg.onclick = () => {
                const rotation = this.rotations.get(`${file.path}-right`) || 0;
                this.modal.show(file.right_data_url, 'right', file.path, rotation);
            };
            
            rightWrapper.appendChild(rightImg);
            
            rightContainer.appendChild(rightWrapper);
            
            const rightButtons = document.createElement('div');
            rightButtons.className = 'preview-buttons';
            
            const deleteRightBtn = document.createElement('button');
            deleteRightBtn.className = 'preview-button delete';
            deleteRightBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteRightBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteHalf(file.path, 'right');
            };
            
            const rotateRightBtn = document.createElement('button');
            rotateRightBtn.className = 'preview-button rotate';
            rotateRightBtn.innerHTML = '<i class="fas fa-rotate"></i>';
            rotateRightBtn.onclick = (e) => {
                e.stopPropagation();
                this.rotateHalf(file.path, 'right');
            };
            
            rightButtons.appendChild(deleteRightBtn);
            rightButtons.appendChild(rotateRightBtn);
            rightContainer.appendChild(rightButtons);
            
            splitPreview.appendChild(rightContainer);
            
            card.appendChild(splitPreview);
            this.container.appendChild(card);
        });
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

    deleteHalf(path, side) {
        const key = `${path}-${side}`;
        this.deletedHalves.add(key);
        
        // Mark the half as deleted in the UI
        const container = this.container.querySelector(
            `.preview-container[data-path="${path}"][data-side="${side}"]`
        );
        if (container) {
            container.classList.add('deleted');
        }
        
        // Check if both halves are deleted
        const otherSide = side === 'left' ? 'right' : 'left';
        const otherKey = `${path}-${otherSide}`;
        
        if (this.deletedHalves.has(otherKey)) {
            // Both halves are deleted, remove the entire card
            const card = this.container.querySelector(
                `.image-card[data-index="${this.getFileIndex(path)}"]`
            );
            if (card) {
                card.style.opacity = '0';
                setTimeout(() => {
                    card.remove();
                    // Update the modal's file list
                    this.modal.setFiles(
                        Array.from(this.container.querySelectorAll('.image-card'))
                            .map(card => this.getFileFromCard(card))
                    );
                }, 300);
            }
        }
    }

    rotateHalf(path, side) {
        const key = `${path}-${side}`;
        const currentRotation = this.rotations.get(key) || 0;
        const newRotation = (currentRotation + 90) % 360;
        this.rotations.set(key, newRotation);
        
        const wrapper = this.container.querySelector(
            `.preview-container[data-path="${path}"][data-side="${side}"] .image-wrapper`
        );
        
        if (wrapper) {
            // Remove any existing rotation classes
            wrapper.classList.remove('rotate-90', 'rotate-180', 'rotate-270');
            
            // Add new rotation class if not 0
            if (newRotation > 0) {
                wrapper.classList.add(`rotate-${newRotation}`);
            }
            
            // Update size based on rotation
            const aspectRatio = this.imageAspectRatios.get(key);
            if (aspectRatio) {
                this.updateImageWrapperSize(wrapper, aspectRatio, newRotation);
            }
        }
    }

    getFileIndex(path) {
        const card = this.container.querySelector(
            `.image-card .preview-container[data-path="${path}"]`
        )?.closest('.image-card');
        return card ? card.dataset.index : -1;
    }

    getFileFromCard(card) {
        const path = card.querySelector('.preview-container').dataset.path;
        const leftUrl = card.querySelector('.preview-container[data-side="left"] .image-wrapper img').src;
        const rightUrl = card.querySelector('.preview-container[data-side="right"] .image-wrapper img').src;
        return { path, left_data_url: leftUrl, right_data_url: rightUrl };
    }
}

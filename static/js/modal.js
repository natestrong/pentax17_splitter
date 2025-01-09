export class Modal {
    constructor() {
        this.currentImage = null;
        this.selectedFiles = [];
        this.setupEventListeners();
    }

    setFiles(files) {
        this.selectedFiles = files;
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
    }

    show(imageUrl, side, filePath) {
        const modal = document.getElementById('imageModal');
        const img = document.getElementById('modalImage');
        const label = document.getElementById('modalLabel');
        
        this.currentImage = { url: imageUrl, side, path: filePath };
        
        img.src = imageUrl;
        label.textContent = side === 'left' ? 'Left Half' : 'Right Half';
        modal.classList.add('active');
        
        // Close modal when clicking outside content
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.close();
            }
        };
    }
    
    close() {
        const modal = document.getElementById('imageModal');
        modal.classList.remove('active');
        this.currentImage = null;
    }

    findImagePosition(targetPath, targetSide) {
        let position = 0;
        for (const file of this.selectedFiles) {
            if (file.path === targetPath) {
                return {
                    position: position + (targetSide === 'right' ? 1 : 0),
                    totalPositions: this.selectedFiles.length * 2
                };
            }
            position += 2;
        }
        return null;
    }

    getAdjacentImage(currentPath, currentSide, direction) {
        const pos = this.findImagePosition(currentPath, currentSide);
        if (!pos) return null;

        let newPosition = pos.position;
        
        switch (direction) {
            case 'left':
                newPosition--;
                break;
            case 'right':
                newPosition++;
                break;
            case 'up':
                newPosition -= 4;
                break;
            case 'down':
                newPosition += 4;
                break;
        }

        if (newPosition < 0) {
            if (direction === 'left') {
                newPosition = pos.totalPositions - 1;
            } else {
                return null;
            }
        } else if (newPosition >= pos.totalPositions) {
            if (direction === 'right') {
                newPosition = 0;
            } else {
                return null;
            }
        }

        const fileIndex = Math.floor(newPosition / 2);
        const side = newPosition % 2 === 0 ? 'left' : 'right';
        
        if (fileIndex >= 0 && fileIndex < this.selectedFiles.length) {
            return {
                file: this.selectedFiles[fileIndex],
                side: side
            };
        }
        return null;
    }

    handleKeyPress(e) {
        if (!this.currentImage) return;

        let direction = null;
        switch (e.key) {
            case 'Escape':
                this.close();
                return;
            case 'ArrowLeft':
                direction = 'left';
                break;
            case 'ArrowRight':
                direction = 'right';
                break;
            case 'ArrowUp':
                direction = 'up';
                break;
            case 'ArrowDown':
                direction = 'down';
                break;
            default:
                return;
        }

        const nextImage = this.getAdjacentImage(this.currentImage.path, this.currentImage.side, direction);
        if (nextImage) {
            const nextUrl = nextImage.side === 'left' ? nextImage.file.left_data_url : nextImage.file.right_data_url;
            this.show(nextUrl, nextImage.side, nextImage.file.path);
            e.preventDefault();
        }
    }
}

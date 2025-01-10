export class Modal {
    constructor() {
        this.modal = document.getElementById('imageModal');
        this.modalImg = document.getElementById('modalImage');
        this.modalClose = document.querySelector('.modal-close');
        this.prevButton = document.querySelector('.modal-nav-button.prev');
        this.nextButton = document.querySelector('.modal-nav-button.next');
        this.filename = document.getElementById('modalFilename');
        this.label = document.getElementById('modalLabel');
        
        this.currentIndex = 0;
        this.files = [];
        this.currentImage = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        
        // Close modal when clicking outside content
        this.modal.onclick = (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        };
    }
    
    setFiles(files) {
        this.files = files;
    }
    
    show(imageUrl, side, path, rotation = 0) {
        this.modal.classList.add('active');
        this.modalImg.src = imageUrl;
        
        // Apply rotation class
        this.modalImg.classList.remove('rotate-90', 'rotate-180', 'rotate-270');
        if (rotation > 0) {
            this.modalImg.classList.add(`rotate-${rotation}`);
        }
        
        // Update filename
        this.filename.textContent = `${path} (${side})`;
        
        // Find current index
        const allHalves = this.files.flatMap(file => [
            { url: file.left_data_url, side: 'left', path: file.path },
            { url: file.right_data_url, side: 'right', path: file.path }
        ]);
        
        this.currentIndex = allHalves.findIndex(half => 
            half.url === imageUrl && half.side === side && half.path === path
        );
        
        this.currentImage = { url: imageUrl, side, path, rotation };
        
        this.updateNavigationButtons();
    }
    
    close() {
        this.modal.classList.remove('active');
        this.currentImage = null;
    }

    findImagePosition(targetPath, targetSide) {
        let position = 0;
        for (const file of this.files) {
            if (file.path === targetPath) {
                return {
                    position: position + (targetSide === 'right' ? 1 : 0),
                    totalPositions: this.files.length * 2
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
        
        if (fileIndex >= 0 && fileIndex < this.files.length) {
            return {
                file: this.files[fileIndex],
                side: side
            };
        }
        return null;
    }

    getFilename(path) {
        return path.split('/').pop();
    }

    navigate(direction) {
        if (!this.currentImage) return;
        
        const nextImage = this.getAdjacentImage(this.currentImage.path, this.currentImage.side, direction);
        if (nextImage) {
            const nextUrl = nextImage.side === 'left' ? nextImage.file.left_data_url : nextImage.file.right_data_url;
            this.show(nextUrl, nextImage.side, nextImage.file.path, this.currentImage.rotation);
        }
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

        if (direction) {
            this.navigate(direction);
            e.preventDefault();
        }
    }
    
    updateNavigationButtons() {
        const allHalves = this.files.flatMap(file => [
            { url: file.left_data_url, side: 'left', path: file.path },
            { url: file.right_data_url, side: 'right', path: file.path }
        ]);
        
        if (this.currentIndex === 0) {
            this.prevButton.disabled = true;
        } else {
            this.prevButton.disabled = false;
        }
        
        if (this.currentIndex === allHalves.length - 1) {
            this.nextButton.disabled = true;
        } else {
            this.nextButton.disabled = false;
        }
    }
}

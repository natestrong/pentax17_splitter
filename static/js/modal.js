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
        
        // Update filename and label
        this.filename.textContent = path;
        this.label.textContent = side === 'left' ? 'Left Half' : 'Right Half';
        
        this.currentImage = { url: imageUrl, side, path, rotation };
        this.updateNavigationButtons();
    }
    
    close() {
        this.modal.classList.remove('active');
        this.currentImage = null;
    }
    
    navigate(direction) {
        if (!this.currentImage) return;
        
        const { position, totalPositions } = this.getPosition(
            this.currentImage.path,
            this.currentImage.side
        );
        
        let newPosition = position + (direction === 'right' ? 1 : -1);
        if (newPosition < 0) newPosition = totalPositions - 1;
        if (newPosition >= totalPositions) newPosition = 0;
        
        const nextImage = this.getImageAtPosition(newPosition);
        if (nextImage) {
            const nextUrl = nextImage.side === 'left' ? nextImage.file.left_data_url : nextImage.file.right_data_url;
            this.show(nextUrl, nextImage.side, nextImage.file.path, this.currentImage.rotation);
        }
    }
    
    getPosition(targetPath, targetSide) {
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
        return { position: 0, totalPositions: this.files.length * 2 };
    }
    
    getImageAtPosition(position) {
        const fileIndex = Math.floor(position / 2);
        const side = position % 2 === 0 ? 'left' : 'right';
        
        if (fileIndex >= 0 && fileIndex < this.files.length) {
            return {
                file: this.files[fileIndex],
                side: side
            };
        }
        return null;
    }
    
    handleKeyPress(e) {
        if (!this.currentImage) return;
        
        if (e.key === 'ArrowLeft') {
            this.navigate('left');
            e.preventDefault();
        } else if (e.key === 'ArrowRight') {
            this.navigate('right');
            e.preventDefault();
        } else if (e.key === 'Escape') {
            this.close();
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

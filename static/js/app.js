import { Modal } from './modal.js';
import { ImageGrid } from './imageGrid.js';

export class App {
    constructor() {
        this.selectedFiles = [];
        this.outputDir = null;
        this.lastPhotoDir = localStorage.getItem('lastPhotoDir') || '~';
        this.modal = new Modal();
        this.imageGrid = new ImageGrid(this.modal);
        
        this.setupEventListeners();
        this.updateButtons();
    }

    setupEventListeners() {
        document.getElementById('select-photos').onclick = () => this.selectPhotos();
        document.getElementById('select-output').onclick = () => this.selectOutputDir();
        document.getElementById('export-button').onclick = () => this.exportAll();
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }

    updateButtons() {
        const exportButton = document.getElementById('export-button');
        exportButton.disabled = !this.outputDir || this.selectedFiles.length === 0;
    }

    async selectOutputDir() {
        const result = await pywebview.api.select_output_directory();
        if (result.success) {
            this.outputDir = result.path;
            const outputDirElement = document.getElementById('output-dir');
            outputDirElement.textContent = result.path;
            outputDirElement.style.display = 'block';
            this.updateButtons();
        } else if (result.error) {
            this.showError(result.error);
        }
    }

    async exportAll() {
        if (!this.outputDir) {
            this.showError('Please select an output directory first');
            return;
        }
        
        try {
            const paths = this.selectedFiles.map(f => f.path);
            const result = await pywebview.api.process_all_images(paths);
            if (result.success) {
                this.showError(result.summary);
            } else if (result.error) {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Failed to process images');
        }
    }

    async selectPhotos() {
        try {
            console.log('Selecting photos with lastPhotoDir:', this.lastPhotoDir);
            const result = await pywebview.api.select_photos(this.lastPhotoDir);
            console.log('Select photos result:', result);
            
            if (result.success) {
                this.selectedFiles = result.files;
                if (result.lastDir) {
                    this.lastPhotoDir = result.lastDir;
                    localStorage.setItem('lastPhotoDir', this.lastPhotoDir);
                    console.log('Saved new lastPhotoDir:', this.lastPhotoDir);
                }
                document.getElementById('file-count').textContent = 
                    `${this.selectedFiles.length} file(s) selected`;
                this.imageGrid.display(this.selectedFiles);
                this.updateButtons();
            } else if (result.error) {
                this.showError(result.error);
            }
        } catch (error) {
            console.error('Error in selectPhotos:', error);
            this.showError('Failed to select photos');
        }
    }
}

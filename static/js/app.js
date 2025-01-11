import { Modal } from './modal.js';
import { ImageGrid } from './imageGrid.js';

export class App {
    constructor() {
        this.selectedFiles = [];
        this.outputDir = null;
        this.lastPhotoDir = localStorage.getItem('lastPhotoDir') || '~';
        this.modal = new Modal();
        this.imageGrid = new ImageGrid(this.modal, this);
        this.loadingIndicator = document.getElementById('loading-indicator');
        
        // Set initial theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
        
        this.setupEventListeners();
        this.updateButtons();
    }

    setupEventListeners() {
        document.getElementById('select-photos').onclick = () => this.selectPhotos();
        document.getElementById('select-output').onclick = () => this.selectOutputDir();
        document.getElementById('export-button').onclick = () => this.exportAll();
        document.getElementById('theme-toggle-btn').onclick = () => this.toggleTheme();
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
        const activeFiles = this.getActiveFiles();
        exportButton.disabled = !this.outputDir || activeFiles.length === 0;
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

    getActiveFiles() {
        // Get files that haven't been fully deleted
        return this.selectedFiles.filter(file => {
            const leftKey = `${file.path}-left`;
            const rightKey = `${file.path}-right`;
            return !this.imageGrid.deletedHalves.has(leftKey) || 
                   !this.imageGrid.deletedHalves.has(rightKey);
        });
    }

    async exportAll() {
        if (!this.outputDir) {
            this.showError('Please select an output directory first');
            return;
        }
        
        try {
            // Only export files that haven't been deleted
            const activeFiles = this.getActiveFiles();
            
            if (activeFiles.length === 0) {
                this.showError('No files to export - all have been deleted');
                return;
            }

            const paths = activeFiles.map(f => {
                // For each file, check which halves should be exported
                const leftKey = `${f.path}-left`;
                const rightKey = `${f.path}-right`;
                
                return {
                    path: f.path,
                    exportLeft: !this.imageGrid.deletedHalves.has(leftKey),
                    exportRight: !this.imageGrid.deletedHalves.has(rightKey),
                    leftRotation: this.imageGrid.rotations.get(leftKey) || 0,
                    rightRotation: this.imageGrid.rotations.get(rightKey) || 0,
                    removeBorderLeft: this.imageGrid.removeBorders.get(leftKey) || false,
                    removeBorderRight: this.imageGrid.removeBorders.get(rightKey) || false
                };
            });

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

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#theme-toggle-btn i');
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    showLoading() {
        this.loadingIndicator.classList.add('active');
    }

    hideLoading() {
        this.loadingIndicator.classList.remove('active');
    }

    async selectPhotos() {
        try {
            console.log('Selecting photos with lastPhotoDir:', this.lastPhotoDir);
            this.showLoading();
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
        } finally {
            this.hideLoading();
        }
    }
}

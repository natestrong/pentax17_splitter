export class ImageGrid {
    constructor(modal) {
        this.modal = modal;
        this.container = document.getElementById('image-container');
    }

    display(files) {
        this.container.innerHTML = '';
        this.modal.setFiles(files);
        
        files.forEach(file => {
            const card = document.createElement('div');
            card.className = 'image-card';
            
            const filename = document.createElement('div');
            filename.className = 'filename';
            filename.textContent = file.path;
            card.appendChild(filename);
            
            const splitPreview = document.createElement('div');
            splitPreview.className = 'split-preview';
            
            // Left half
            const leftDiv = document.createElement('div');
            const leftImg = document.createElement('img');
            leftImg.src = file.left_data_url;
            leftImg.onclick = () => this.modal.show(file.left_data_url, 'left', file.path);
            leftDiv.appendChild(leftImg);
            const leftLabel = document.createElement('div');
            leftLabel.className = 'side-label';
            leftLabel.textContent = 'Left Half';
            leftDiv.appendChild(leftLabel);
            splitPreview.appendChild(leftDiv);
            
            // Right half
            const rightDiv = document.createElement('div');
            const rightImg = document.createElement('img');
            rightImg.src = file.right_data_url;
            rightImg.onclick = () => this.modal.show(file.right_data_url, 'right', file.path);
            rightDiv.appendChild(rightImg);
            const rightLabel = document.createElement('div');
            rightLabel.className = 'side-label';
            rightLabel.textContent = 'Right Half';
            rightDiv.appendChild(rightLabel);
            splitPreview.appendChild(rightDiv);
            
            card.appendChild(splitPreview);
            this.container.appendChild(card);
        });
    }
}

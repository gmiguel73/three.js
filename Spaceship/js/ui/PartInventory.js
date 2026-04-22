import { getModuleList } from '../modules/registry.js';

export class PartInventory {
    constructor(builder) {
        this.builder = builder;
        this.container = null;
        this.parts = getModuleList();
    }
    
    init() {
        this.container = document.getElementById('parts-inventory');
        this.render();
    }
    
    render() {
        this.container.innerHTML = '';
        
        this.parts.forEach(part => {
            const item = document.createElement('div');
            item.className = 'part-item';
            item.dataset.partType = part.id;
            
            item.innerHTML = `
                <div class="part-icon">${part.icon}</div>
                <div class="part-info">
                    <div class="part-name">${part.name}</div>
                    <div class="part-desc">${part.description}</div>
                </div>
            `;
            
            item.addEventListener('click', () => this.selectPart(part.id));
            item.addEventListener('mouseenter', () => {
                this.builder.updateStatus(`Place ${part.name}: ${part.description}`);
            });
            item.addEventListener('mouseleave', () => {
                this.builder.updateStatus('Ready');
            });
            
            this.container.appendChild(item);
        });
    }
    
    selectPart(partType) {
        // Remove previous selection
        this.container.querySelectorAll('.part-item').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Add selection to clicked item
        const selectedItem = this.container.querySelector(`[data-part-type="${partType}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
        
        // Start placing mode
        this.builder.startPlacing(partType);
    }
    
    clearSelection() {
        this.container.querySelectorAll('.part-item').forEach(el => {
            el.classList.remove('selected');
        });
    }
}
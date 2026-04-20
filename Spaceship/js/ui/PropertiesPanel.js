export class PropertiesPanel {
    constructor(builder) {
        this.builder = builder;
        this.currentModule = null;
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Position
        document.getElementById('pos-x').addEventListener('change', (e) => this.updatePosition('x', parseFloat(e.target.value)));
        document.getElementById('pos-y').addEventListener('change', (e) => this.updatePosition('y', parseFloat(e.target.value)));
        document.getElementById('pos-z').addEventListener('change', (e) => this.updatePosition('z', parseFloat(e.target.value)));
        
        // Rotation
        document.getElementById('rot-x').addEventListener('change', (e) => this.updateRotation('x', parseFloat(e.target.value)));
        document.getElementById('rot-y').addEventListener('change', (e) => this.updateRotation('y', parseFloat(e.target.value)));
        document.getElementById('rot-z').addEventListener('change', (e) => this.updateRotation('z', parseFloat(e.target.value)));
        
        // Scale
        document.getElementById('scale-x').addEventListener('change', (e) => this.updateScale('x', parseFloat(e.target.value)));
        document.getElementById('scale-y').addEventListener('change', (e) => this.updateScale('y', parseFloat(e.target.value)));
        document.getElementById('scale-z').addEventListener('change', (e) => this.updateScale('z', parseFloat(e.target.value)));
        
        // Color
        document.getElementById('color-picker').addEventListener('change', (e) => {
            const hex = parseInt(e.target.value.substring(1), 16);
            this.updateColor(hex);
        });
        
        // Delete
        document.getElementById('delete-module').addEventListener('click', () => {
            this.builder.deleteSelected();
        });
    }
    
    showModule(module) {
        this.currentModule = module;
        
        document.getElementById('no-selection').style.display = 'none';
        document.getElementById('module-properties').style.display = 'block';
        
        // Update position
        document.getElementById('pos-x').value = module.position.x.toFixed(1);
        document.getElementById('pos-y').value = module.position.y.toFixed(1);
        document.getElementById('pos-z').value = module.position.z.toFixed(1);
        
        // Update rotation (convert to degrees)
        document.getElementById('rot-x').value = (module.rotation.x * 180 / Math.PI).toFixed(0);
        document.getElementById('rot-y').value = (module.rotation.y * 180 / Math.PI).toFixed(0);
        document.getElementById('rot-z').value = (module.rotation.z * 180 / Math.PI).toFixed(0);
        
        // Update scale
        document.getElementById('scale-x').value = module.params.width;
        document.getElementById('scale-y').value = module.params.height;
        document.getElementById('scale-z').value = module.params.depth;
        
        // Update color
        const color = module.params.color || 0x888888;
        document.getElementById('color-picker').value = '#' + color.toString(16).padStart(6, '0');
    }
    
    hideModule() {
        this.currentModule = null;
        document.getElementById('no-selection').style.display = 'block';
        document.getElementById('module-properties').style.display = 'none';
    }
    
    updatePosition(axis, value) {
        if (!this.currentModule) return;
        
        const pos = this.currentModule.position.clone();
        pos[axis] = value;
        this.builder.updateModule(this.currentModule, 'position', pos);
    }
    
    updateRotation(axis, degrees) {
        if (!this.currentModule) return;
        
        const rot = this.currentModule.rotation.clone();
        rot[axis] = degrees * Math.PI / 180;
        this.builder.updateModule(this.currentModule, 'rotation', rot);
    }
    
    updateScale(axis, value) {
        if (!this.currentModule) return;
        
        const scale = {
            x: this.currentModule.params.width,
            y: this.currentModule.params.height,
            z: this.currentModule.params.depth
        };
        scale[axis] = value;
        
        this.builder.updateModule(this.currentModule, 'scale', scale);
    }
    
    updateColor(hexColor) {
        if (!this.currentModule) return;
        this.builder.updateModule(this.currentModule, 'color', hexColor);
    }
    
    refresh() {
        if (this.currentModule) {
            this.showModule(this.currentModule);
        }
    }
}
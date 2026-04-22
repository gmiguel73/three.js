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
        
        // Rotation buttons (90 degree increments)
        document.getElementById('rot-y-left').addEventListener('click', () => this.rotateY(-90));
        document.getElementById('rot-y-right').addEventListener('click', () => this.rotateY(90));
        
        // Scale
        document.getElementById('scale-x').addEventListener('change', (e) => this.updateScale('x', parseFloat(e.target.value)));
        document.getElementById('scale-y').addEventListener('change', (e) => this.updateScale('y', parseFloat(e.target.value)));
        document.getElementById('scale-z').addEventListener('change', (e) => this.updateScale('z', parseFloat(e.target.value)));
        
        // Color
        document.getElementById('color-picker').addEventListener('change', (e) => {
            const hex = parseInt(e.target.value.substring(1), 16);
            this.updateColor(hex);
        });
        
        // Export GLTF
        document.getElementById('export-gltf').addEventListener('click', () => {
            this.exportGLTF();
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
    
    rotateY(degrees) {
        if (!this.currentModule) return;
        
        const currentDegrees = this.currentModule.rotation.y * 180 / Math.PI;
        const newDegrees = currentDegrees + degrees;
        this.updateRotation('y', newDegrees);
        
        // Update the input field
        document.getElementById('rot-y').value = newDegrees.toFixed(0);
    }
    
    async exportGLTF() {
        if (!this.currentModule) return;
        
        try {
            // Dynamic import of GLTFExporter
            const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
            
            const exporter = new GLTFExporter();
            
            // Clone the module for export (to avoid modifying original)
            const clone = this.currentModule.clone();
            
            exporter.parse(
                clone,
                (gltf) => {
                    const output = JSON.stringify(gltf, null, 2);
                    const blob = new Blob([output], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${this.currentModule.type}_${Date.now()}.gltf`;
                    a.click();
                    
                    URL.revokeObjectURL(url);
                    this.builder.updateStatus(`Exported ${this.currentModule.type} as GLTF`);
                },
                (error) => {
                    console.error('Error exporting GLTF:', error);
                    this.builder.updateStatus('GLTF export failed');
                },
                { binary: false }
            );
        } catch (error) {
            console.error('Failed to load GLTFExporter:', error);
            this.builder.updateStatus('GLTF exporter not available');
        }
    }
    
    refresh() {
        if (this.currentModule) {
            this.showModule(this.currentModule);
        }
    }
}
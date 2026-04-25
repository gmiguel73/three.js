import { AssetLibrary } from '../assets/AssetLibrary.js';

export class PropertiesPanel {
    constructor(builder) {
        this.builder = builder;
        this.currentModule = null;
        // Bumped each time showModule() is called so a slow manifest fetch
        // for a previously-selected module can't overwrite the variant UI
        // for the module the user is now looking at.
        this._renderToken = 0;
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

        this.renderVariantSelectors(module);
    }

    renderVariantSelectors(module) {
        const container = document.getElementById('part-variants');
        if (!container) return;
        container.innerHTML = '';

        const decl = module.constructor.assets;
        if (!decl || !decl.parts) return;

        const token = ++this._renderToken;

        AssetLibrary.getManifest(module.type).then((manifest) => {
            // Bail if the user selected something else (or nothing) before the
            // manifest came back, otherwise we'd render dropdowns for the
            // wrong module.
            if (token !== this._renderToken) return;
            if (this.currentModule !== module) return;

            for (const partName of Object.keys(decl.parts)) {
                const partManifest = manifest.parts && manifest.parts[partName];
                if (!partManifest || !partManifest.variants) continue;
                container.appendChild(this._buildVariantRow(module, partName, partManifest));
            }
        }).catch((err) => {
            console.warn('[PropertiesPanel] no manifest for', module.type, err);
        });
    }

    _buildVariantRow(module, partName, partManifest) {
        const wrapper = document.createElement('div');
        wrapper.className = 'property-group';

        const label = document.createElement('label');
        label.textContent = partName;
        wrapper.appendChild(label);

        const select = document.createElement('select');
        select.className = 'variant-select';
        select.dataset.part = partName;

        const current = (module.params.parts && module.params.parts[partName]) || partManifest.default;

        for (const [vName, vDef] of Object.entries(partManifest.variants)) {
            const opt = document.createElement('option');
            opt.value = vName;
            opt.textContent = vDef.displayName || vName;
            if (vName === current) opt.selected = true;
            select.appendChild(opt);
        }

        select.addEventListener('change', (e) => {
            module.params.parts = { ...(module.params.parts || {}), [partName]: e.target.value };
            module.update();
            if (this.builder.storage) this.builder.storage.autoSave();
        });

        wrapper.appendChild(select);
        return wrapper;
    }

    hideModule() {
        this.currentModule = null;
        // Drop any in-flight variant render so the next selection starts clean.
        this._renderToken++;
        const variantContainer = document.getElementById('part-variants');
        if (variantContainer) variantContainer.innerHTML = '';
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
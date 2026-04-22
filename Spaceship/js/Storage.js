import { createModule } from './modules/registry.js';

export class Storage {
    constructor(builder) {
        this.builder = builder;
        this.autosaveKey = 'spaceship-builder-autosave';
        this.autosaveDelay = 1000;
        this.autosaveTimer = null;
    }
    
    autoSave() {
        // Debounce autosave
        if (this.autosaveTimer) {
            clearTimeout(this.autosaveTimer);
        }
        
        this.autosaveTimer = setTimeout(() => {
            this.saveToLocalStorage(this.autosaveKey);
        }, this.autosaveDelay);
    }
    
    save() {
        this.saveToLocalStorage('spaceship-builder-save');
        this.builder.updateStatus('Saved to localStorage');
    }
    
    load() {
        this.loadFromLocalStorage('spaceship-builder-save');
    }
    
    loadAutoSave() {
        const data = localStorage.getItem(this.autosaveKey);
        if (data) {
            if (confirm('Found autosaved ship. Load it?')) {
                this.loadFromLocalStorage(this.autosaveKey);
                this.builder.updateStatus('Autosave loaded');
                return true;
            }
        }
        return false;
    }
    
    saveToLocalStorage(key) {
        try {
            const data = this.serialize();
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save:', e);
            this.builder.updateStatus('Save failed: ' + e.message);
            return false;
        }
    }
    
    loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            if (!data) {
                this.builder.updateStatus('No saved data found');
                return false;
            }
            
            const parsed = JSON.parse(data);
            this.deserialize(parsed);
            this.builder.updateStatus('Loaded successfully');
            return true;
        } catch (e) {
            console.error('Failed to load:', e);
            this.builder.updateStatus('Load failed: ' + e.message);
            return false;
        }
    }
    
    clearAutoSave() {
        localStorage.removeItem(this.autosaveKey);
    }
    
    exportJSON() {
        const data = this.serialize();
        data.metadata = {
            name: 'My Spaceship',
            version: '1.0',
            exported: new Date().toISOString(),
            moduleCount: this.builder.modules.length
        };
        
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `spaceship-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.builder.updateStatus('Exported to JSON');
    }
    
    importJSON(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.deserialize(data);
                this.builder.updateStatus('Imported from JSON');
            } catch (err) {
                console.error('Failed to import:', err);
                this.builder.updateStatus('Import failed: Invalid JSON');
                alert('Failed to import file: ' + err.message);
            }
        };
        reader.readAsText(file);
        
        // Reset input
        event.target.value = '';
    }
    
    serialize() {
        return {
            version: '1.0',
            grid: this.builder.gridSystem.serialize(),
            modules: this.builder.modules.map(m => m.serialize()),
            currentFloor: this.builder.currentFloor,
            timestamp: Date.now()
        };
    }
    
    deserialize(data) {
        // Clear current ship
        this.builder.modules.forEach(m => this.builder.scene.remove(m));
        this.builder.modules = [];
        this.builder.selectModule(null);
        
        // Restore grid
        if (data.grid) {
            this.builder.gridSystem.deserialize(data.grid);
        }
        
        // Restore modules
        if (data.modules) {
            data.modules.forEach(moduleData => {
                const module = this.createModuleFromData(moduleData);
                if (module) {
                    this.builder.scene.add(module);
                    this.builder.modules.push(module);
                }
            });
        }
        
        // Restore floor
        if (data.currentFloor !== undefined) {
            this.builder.setCurrentFloor(data.currentFloor);
        }
        
        // Reset history
        this.builder.history = [];
        this.builder.historyIndex = -1;
        
        this.builder.updateModuleCount();
        this.builder.updateFloorDisplay();
    }
    
    createModuleFromData(data) {
        const { type, position, rotation, params, floor } = data;
        
        const module = createModule(type, params);
        if (!module) {
            console.warn('Unknown module type:', type);
            return null;
        }
        
        module.position.fromArray(position);
        module.rotation.fromArray(rotation);
        // Use stored floor, or calculate from Y position for backwards compatibility
        if (floor !== undefined) {
            module.floor = floor;
        } else {
            // Legacy save: calculate floor from Y position
            const cellSize = this.builder.gridSystem.cellSize;
            module.floor = type === 'floor' 
                ? Math.round(position[1] / cellSize)
                : Math.round((position[1] - 0.5) / cellSize);
        }
        module.castShadow = true;
        module.receiveShadow = true;
        
        return module;
    }
}
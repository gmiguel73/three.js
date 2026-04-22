import * as THREE from 'three';
import { Command } from './Command.js';
import { createModule } from '../modules/registry.js';

/**
 * Command to add a module to the scene.
 *
 * Callers must pass the module instance they just added to the scene so undo
 * can remove the same instance. Without this, the first undo silently no-ops
 * and a subsequent redo creates a duplicate sharing the original's uuid.
 */
export class AddCommand extends Command {
    constructor(builder, moduleData, existingModule = null) {
        super(builder);
        this.moduleData = moduleData;
        this.module = existingModule;
    }
    
    do() {
        // Create module from data (for redo) or use existing (first execution)
        if (!this.module) {
            this.module = createModule(this.moduleData.type, this.moduleData.params);
            if (this.module) {
                this.module.position.fromArray(this.moduleData.position);
                this.module.rotation.fromArray(this.moduleData.rotation);
                this.module.floor = this.moduleData.floor || 0;
                this.module.uuid = this.moduleData.uuid || THREE.MathUtils.generateUUID();
            }
        }
        
        if (this.module) {
            this.builder.scene.add(this.module);
            this.builder.modules.push(this.module);
        }
    }
    
    undo() {
        if (this.module) {
            this.builder.scene.remove(this.module);
            this.builder.modules = this.builder.modules.filter(m => m !== this.module);
            if (this.builder.selectedModule === this.module) {
                this.builder.selectModule(null);
            }
        }
    }
    
    getDescription() {
        return `Add ${this.moduleData.type}`;
    }
}
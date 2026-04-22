import { Command } from './Command.js';

/**
 * Command to remove a module from the scene
 */
export class RemoveCommand extends Command {
    constructor(builder, module) {
        super(builder);
        this.moduleData = builder.serializeModule(module);
        this.moduleId = module.uuid;
        this.module = module;
    }
    
    do() {
        // Find and remove the module
        const moduleToRemove = this.builder.modules.find(m => m.uuid === this.moduleId);
        if (moduleToRemove) {
            this.builder.scene.remove(moduleToRemove);
            this.builder.modules = this.builder.modules.filter(m => m !== moduleToRemove);
            if (this.builder.selectedModule === moduleToRemove) {
                this.builder.selectModule(null);
            }
        }
    }
    
    undo() {
        // Restore the module
        if (!this.module) {
            this.module = this.builder.createModuleFromData(this.moduleData);
            if (this.module) {
                this.module.uuid = this.moduleId;
            }
        }
        
        if (this.module) {
            this.builder.scene.add(this.module);
            this.builder.modules.push(this.module);
        }
    }
    
    getDescription() {
        return `Remove ${this.moduleData.type}`;
    }
}
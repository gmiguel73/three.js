import { Command } from './Command.js';

/**
 * Command to modify a module property
 */
export class ModifyCommand extends Command {
    constructor(builder, module, property, oldValue, newValue) {
        super(builder);
        this.moduleId = module.uuid;
        this.property = property;
        this.oldValue = this.cloneValue(oldValue);
        this.newValue = this.cloneValue(newValue);
    }
    
    cloneValue(value) {
        if (value && typeof value.clone === 'function') {
            return value.clone();
        }
        if (Array.isArray(value)) {
            return [...value];
        }
        if (typeof value === 'object' && value !== null) {
            return { ...value };
        }
        return value;
    }
    
    do() {
        const module = this.builder.modules.find(m => m.uuid === this.moduleId);
        if (module) {
            this.builder.applyModuleProperty(module, this.property, this.newValue);
        }
    }
    
    undo() {
        const module = this.builder.modules.find(m => m.uuid === this.moduleId);
        if (module) {
            this.builder.applyModuleProperty(module, this.property, this.oldValue);
        }
    }
    
    getDescription() {
        return `Modify ${this.property}`;
    }
}
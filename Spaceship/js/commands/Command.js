/**
 * Base Command class for undo/redo system
 * Implements the Command pattern
 */
export class Command {
    constructor(builder) {
        this.builder = builder;
    }
    
    /**
     * Execute the command
     */
    do() {
        throw new Error('do() must be implemented by subclass');
    }
    
    /**
     * Undo the command
     */
    undo() {
        throw new Error('undo() must be implemented by subclass');
    }
    
    /**
     * Get a description of the command for UI/status
     */
    getDescription() {
        return 'Command';
    }
}
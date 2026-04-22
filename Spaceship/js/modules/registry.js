/**
 * Module Registry - Single source of truth for all module types
 * 
 * This registry eliminates the 7-file touchpoint problem when adding new modules.
 * Instead of editing switches in multiple files, modules self-register here.
 */

export const MODULE_REGISTRY = new Map();

/**
 * Register a module type
 * @param {string} type - Unique identifier for the module type
 * @param {Function} ctor - Module constructor class
 * @param {Object} meta - Metadata (name, icon, description, hotkey)
 */
export function registerModule(type, ctor, meta = {}) {
    MODULE_REGISTRY.set(type, { ctor, meta });
}

/**
 * Get all registered module types
 * @returns {Array<string>} Array of type identifiers
 */
export function getModuleTypes() {
    return Array.from(MODULE_REGISTRY.keys());
}

/**
 * Get module metadata
 * @param {string} type - Module type identifier
 * @returns {Object|null} Metadata object or null if not found
 */
export function getModuleMeta(type) {
    return MODULE_REGISTRY.get(type)?.meta || null;
}

/**
 * Create a module instance
 * @param {string} type - Module type identifier
 * @param {Object} params - Module parameters
 * @returns {ShipModule|null} Module instance or null if type not found
 */
export function createModule(type, params = {}) {
    const entry = MODULE_REGISTRY.get(type);
    if (!entry) {
        console.warn(`Unknown module type: ${type}`);
        return null;
    }
    return new entry.ctor(params);
}

/**
 * Get all modules as array for inventory
 * @returns {Array<Object>} Array of {id, name, icon, description, hotkey}
 */
export function getModuleList() {
    return Array.from(MODULE_REGISTRY.entries()).map(([type, { meta }]) => ({
        id: type,
        name: meta.name || type,
        icon: meta.icon || '📦',
        description: meta.description || '',
        hotkey: meta.hotkey || null
    }));
}

/**
 * Get hotkey mapping
 * @returns {Object} Map of hotkey -> type
 */
export function getHotkeyMap() {
    const map = {};
    for (const [type, { meta }] of MODULE_REGISTRY.entries()) {
        if (meta.hotkey) {
            map[meta.hotkey] = type;
        }
    }
    return map;
}

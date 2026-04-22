import * as THREE from 'three';
import { getHotkeyMap } from './modules/registry.js';

export class Controls {
    constructor(builder) {
        this.builder = builder;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isMouseDown = false;
        this.dragStartGridPos = null;
        this.isDragging = false;
    }
    
    init() {
        const canvas = this.builder.renderer.domElement;
        
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        canvas.addEventListener('click', (e) => this.onClick(e));
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
    }
    
    onMouseDown(event) {
        this.isMouseDown = true;
        this.hasDragged = false;
        this.isDragging = false;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
        
        // Store the grid position where drag started
        this.updateMousePosition(event);
        const intersect = this.getGridIntersection();
        if (intersect && this.builder.isPlacing) {
            const gridPos = this.builder.gridSystem.snapToGrid(intersect.point);
            this.dragStartGridPos = { x: gridPos.x, z: gridPos.z };
            // Disable camera controls while dragging to define area
            this.builder.controls.enabled = false;
        }
    }
    
    onMouseUp(event) {
        if (this.isDragging && this.dragStartGridPos && this.builder.isPlacing) {
            // Area placement mode - place in all tiles in the rectangle
            this.updateMousePosition(event);
            const intersect = this.getGridIntersection();
            if (intersect) {
                const endGridPos = this.builder.gridSystem.snapToGrid(intersect.point);
                this.builder.placeArea(this.builder.placingType, this.dragStartGridPos, { x: endGridPos.x, z: endGridPos.z });
            }
        }
        // Re-enable camera controls
        this.builder.controls.enabled = true;
        this.isMouseDown = false;
        this.isDragging = false;
        this.dragStartGridPos = null;
    }
    
    onMouseMove(event) {
        if (this.isMouseDown) {
            const dx = Math.abs(event.clientX - this.dragStartX);
            const dy = Math.abs(event.clientY - this.dragStartY);
            if (dx > 3 || dy > 3) {
                this.hasDragged = true;
                this.isDragging = true;
            }
        }
        
        this.updateMousePosition(event);
        
        // Update status bar with grid position
        const intersect = this.getGridIntersection();
        if (intersect) {
            this.builder.updateMousePosition(intersect.point.x, intersect.point.z);
            
            // Update preview position if in placing mode
            if (this.builder.isPlacing) {
                if (this.isDragging && this.dragStartGridPos) {
                    // Area placement mode - show area preview
                    const currentGridPos = this.builder.gridSystem.snapToGrid(intersect.point);
                    this.builder.updateAreaPreview(this.dragStartGridPos, { x: currentGridPos.x, z: currentGridPos.z });
                } else {
                    // Single tile preview
                    this.builder.updatePreview(intersect.point);
                }
            }
        }
    }
    
    onClick(event) {
        // Don't process clicks if we were dragging for area placement
        if (this.hasDragged) {
            this.hasDragged = false;
            return;
        }
        
        this.updateMousePosition(event);
        
        if (this.builder.isPlacing) {
            // Single tile placement mode
            const intersect = this.getGridIntersection();
            if (intersect) {
                this.builder.placeModule(this.builder.placingType, intersect.point);
                // Continue placing mode (don't stop)
            }
            return;
        }
        
        // Try to select a module first
        const moduleIntersect = this.getModuleIntersection();
        if (moduleIntersect) {
            this.builder.selectModule(moduleIntersect.object);
            // Exit placing mode when selecting
            this.builder.stopPlacing();
            this.builder.ui.inventory.clearSelection();
        } else {
            // Clicked empty space - deselect
            this.builder.selectModule(null);
            this.builder.stopPlacing();
            this.builder.ui.inventory.clearSelection();
        }
    }
    
    onKeyDown(event) {
        // Ignore key events when typing in input fields
        const target = event.target;
        const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        
        // ESC - cancel placing or deselect
        if (event.key === 'Escape') {
            this.builder.stopPlacing();
            this.builder.selectModule(null);
            this.builder.ui.inventory.clearSelection();
            // Re-enable camera controls
            this.builder.controls.enabled = true;
            this.isDragging = false;
            this.dragStartGridPos = null;
        }
        
        // Delete - remove selected (only if not in input field)
        if (!isInputField && (event.key === 'Delete' || event.key === 'Backspace')) {
            this.builder.deleteSelected();
        }
        
        // Ctrl/Cmd + Z - Undo (allow even in input fields for better UX)
        if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
            event.preventDefault();
            if (!isInputField) {
                this.builder.undo();
            }
        }
        
        // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo
        if (!isInputField && (event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
            event.preventDefault();
            this.builder.redo();
        }
        
        // Ctrl/Cmd + D - Duplicate (only if not in input field)
        if (!isInputField && (event.ctrlKey || event.metaKey) && event.key === 'd') {
            event.preventDefault();
            this.builder.duplicateSelected();
        }
        
        // Ctrl/Cmd + C - Copy (only if not in input field)
        if (!isInputField && (event.ctrlKey || event.metaKey) && event.key === 'c') {
            event.preventDefault();
            this.builder.copySelected();
        }
        
        // Ctrl/Cmd + V - Paste (only if not in input field)
        if (!isInputField && (event.ctrlKey || event.metaKey) && event.key === 'v') {
            event.preventDefault();
            this.builder.pasteFromClipboard();
        }
        
        // Number keys and hotkeys - quick select parts (only if not in input field)
        if (!isInputField) {
            const hotkeyMap = getHotkeyMap();
            if (hotkeyMap[event.key]) {
                this.builder.ui.inventory.selectPart(hotkeyMap[event.key]);
            }
        }
    }
    
    updateMousePosition(event) {
        const canvas = this.builder.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    getGridIntersection() {
        this.raycaster.setFromCamera(this.mouse, this.builder.camera);
        
        const floorPlane = this.builder.gridSystem.getCurrentFloorPlane();
        if (!floorPlane) return null;
        
        const intersects = this.raycaster.intersectObject(floorPlane);
        return intersects.length > 0 ? intersects[0] : null;
    }
    
    getModuleIntersection() {
        this.raycaster.setFromCamera(this.mouse, this.builder.camera);
        
        // Get all meshes in the scene that are part of VISIBLE modules only
        const moduleMeshes = [];
        this.builder.modules.forEach(module => {
            // Skip invisible modules (on other floors)
            if (!module.visible) return;
            
            module.traverse((child) => {
                if (child.isMesh) {
                    moduleMeshes.push(child);
                }
            });
        });
        
        const intersects = this.raycaster.intersectObjects(moduleMeshes, false);
        
        if (intersects.length > 0) {
            // Find the parent module
            let obj = intersects[0].object;
            while (obj.parent && !this.builder.modules.includes(obj)) {
                obj = obj.parent;
            }
            if (this.builder.modules.includes(obj)) {
                return { object: obj, point: intersects[0].point };
            }
        }
        
        return null;
    }
}
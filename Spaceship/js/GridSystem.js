import * as THREE from 'three';

export class GridSystem {
    constructor(width = 20, length = 40, floors = 1) {
        this.width = width;
        this.length = length;
        this.floors = floors;
        this.cellSize = 1;
        this.currentFloor = 0;
        this.visible = true;
        
        this.gridHelper = null;
        this.floorPlanes = [];
        this.gridGroup = new THREE.Group();
    }
    
    addToScene(scene) {
        this.scene = scene;
        this.scene.add(this.gridGroup);
        this.createGrid();
    }
    
    createGrid() {
        // Clear existing
        this.gridGroup.clear();
        this.floorPlanes = [];
        
        // Create grid for each floor
        for (let floor = 0; floor < this.floors; floor++) {
            const y = floor * this.cellSize;
            
            // Main grid (visual helper) - more subtle
            const gridHelper = new THREE.GridHelper(
                Math.max(this.width, this.length),
                Math.max(this.width, this.length),
                0x555555,  // Center lines
                0x333333   // Grid lines
            );
            gridHelper.position.y = y;
            gridHelper.userData.floor = floor;
            gridHelper.userData.isGridHelper = true;
            gridHelper.material.transparent = true;
            gridHelper.material.opacity = 0.6;
            this.gridGroup.add(gridHelper);
            
            // Floor plane (for raycasting) - invisible
            const planeGeometry = new THREE.PlaneGeometry(this.width, this.length);
            const planeMaterial = new THREE.MeshBasicMaterial({
                visible: false,
                side: THREE.DoubleSide
            });
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.rotation.x = -Math.PI / 2;
            plane.position.y = y;
            plane.userData.floor = floor;
            plane.userData.isFloorPlane = true;
            this.gridGroup.add(plane);
            this.floorPlanes.push(plane);
            
            // Note: Floor tiles are now placeable items, not auto-generated
            // Boundary walls (visual)
            if (floor === this.currentFloor) {
                this.createBoundaryWalls(y);
            }
        }
        
        // Update visibility
        this.setCurrentFloor(this.currentFloor);
    }
    
    createBoundaryWalls(y) {
        const wallMaterial = new THREE.LineBasicMaterial({ 
            color: 0x666666,
            transparent: true,
            opacity: 0.3
        });
        
        const halfW = this.width / 2;
        const halfL = this.length / 2;
        
        const points = [
            new THREE.Vector3(-halfW, y, -halfL),
            new THREE.Vector3(halfW, y, -halfL),
            new THREE.Vector3(halfW, y, halfL),
            new THREE.Vector3(-halfW, y, halfL),
            new THREE.Vector3(-halfW, y, -halfL)
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, wallMaterial);
        line.userData.isBoundary = true;
        this.gridGroup.add(line);
    }
    
    snapToGrid(position) {
        return {
            x: Math.round(position.x / this.cellSize) * this.cellSize,
            y: Math.round(position.y / this.cellSize) * this.cellSize,
            z: Math.round(position.z / this.cellSize) * this.cellSize
        };
    }
    
    worldToGrid(worldPos) {
        return {
            x: Math.floor((worldPos.x + this.width / 2) / this.cellSize),
            y: Math.floor(worldPos.y / this.cellSize),
            z: Math.floor((worldPos.z + this.length / 2) / this.cellSize)
        };
    }
    
    gridToWorld(gridPos) {
        return {
            x: (gridPos.x + 0.5) * this.cellSize - this.width / 2,
            y: gridPos.y * this.cellSize,
            z: (gridPos.z + 0.5) * this.cellSize - this.length / 2
        };
    }
    
    isWithinBounds(position) {
        const halfW = this.width / 2;
        const halfL = this.length / 2;
        
        return (
            position.x >= -halfW && position.x <= halfW &&
            position.z >= -halfL && position.z <= halfL &&
            position.y >= 0 && position.y < this.floors * this.cellSize
        );
    }
    
    addFloor(direction = 'up') {
        if (direction === 'up') {
            this.floors++;
        } else {
            // Add below - shift everything up
            this.floors++;
            this.currentFloor++;
            // Shift all existing modules up one floor
            if (this.scene) {
                this.scene.traverse((child) => {
                    if (child.isGroup && child.floor !== undefined) {
                        child.floor++;
                        child.position.y += this.cellSize;
                    }
                });
            }
        }
        
        this.createGrid();
    }
    
    removeFloor(floorIndex) {
        if (this.floors <= 1) return false;
        
        this.floors--;
        if (this.currentFloor >= this.floors) {
            this.currentFloor = this.floors - 1;
        }
        
        this.createGrid();
        return true;
    }
    
    setCurrentFloor(floor) {
        this.currentFloor = Math.max(0, Math.min(floor, this.floors - 1));
        
        // Update grid visibility
        this.gridGroup.children.forEach(child => {
            if (child.userData.floor !== undefined && !child.userData.isFloorPlane) {
                child.visible = (child.userData.floor === this.currentFloor);
            }
            if (child.userData.isBoundary) {
                child.visible = this.visible;
            }
            // Keep floor planes invisible (they're for raycasting only)
            if (child.userData.isFloorPlane) {
                child.visible = false;
            }
        });
    }
    
    getCurrentFloorPlane() {
        return this.floorPlanes[this.currentFloor];
    }
    
    toggle() {
        this.visible = !this.visible;
        this.gridGroup.visible = this.visible;
    }
    
    reset() {
        this.width = 20;
        this.length = 40;
        this.floors = 1;
        this.currentFloor = 0;
        this.createGrid();
    }
    
    serialize() {
        return {
            width: this.width,
            length: this.length,
            floors: this.floors,
            currentFloor: this.currentFloor
        };
    }
    
    deserialize(data) {
        this.width = data.width || 20;
        this.length = data.length || 40;
        this.floors = data.floors || 1;
        this.currentFloor = data.currentFloor || 0;
        this.createGrid();
    }
}
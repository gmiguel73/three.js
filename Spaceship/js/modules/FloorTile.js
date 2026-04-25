import * as THREE from 'three';
import { ShipModule } from './ShipModule.js';
import { registerModule } from './registry.js';

export class FloorTile extends ShipModule {
    static meta = {
        name: 'Floor Tile',
        icon: '⬜',
        description: 'Structural floor panel',
        hotkey: '1'
    };
    
    constructor(params = {}) {
        super('floor', params);
        this.build();
    }
    
    buildProcedural() {
        const { width, height, depth, color } = this.params;
        
        // Floor tiles are flat (height is minimal)
        const tileHeight = 0.1;
        
        const material = new THREE.MeshStandardMaterial({
            color: color || 0x404550,
            metalness: 0.6,
            roughness: 0.5,
            side: THREE.DoubleSide
        });
        
        // Main tile surface
        const tileGeometry = new THREE.BoxGeometry(width, tileHeight, depth);
        const tile = new THREE.Mesh(tileGeometry, material);
        tile.position.y = tileHeight / 2;
        tile.castShadow = false;
        tile.receiveShadow = true;
        this.add(tile);
        
        // Add panel lines for detail
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x1a1f2a,
            transparent: true,
            opacity: 0.5
        });
        
        // Grid pattern on tile
        const divisions = 4;
        for (let i = 1; i < divisions; i++) {
            const t = i / divisions;
            
            // Lines along X
            const lineX1 = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-width/2 + width * t, tileHeight + 0.001, -depth/2),
                new THREE.Vector3(-width/2 + width * t, tileHeight + 0.001, depth/2)
            ]);
            const line1 = new THREE.Line(lineX1, lineMaterial);
            this.add(line1);
            
            // Lines along Z
            const lineZ1 = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-width/2, tileHeight + 0.001, -depth/2 + depth * t),
                new THREE.Vector3(width/2, tileHeight + 0.001, -depth/2 + depth * t)
            ]);
            const line2 = new THREE.Line(lineZ1, lineMaterial);
            this.add(line2);
        }
        
        // Corner reinforcements
        const cornerSize = 0.15;
        const cornerGeometry = new THREE.BoxGeometry(cornerSize, tileHeight + 0.02, cornerSize);
        const cornerMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2f3a,
            metalness: 0.6,
            roughness: 0.4
        });
        
        const corners = [
            [-width/2 + cornerSize/2, depth/2 - cornerSize/2],
            [width/2 - cornerSize/2, depth/2 - cornerSize/2],
            [-width/2 + cornerSize/2, -depth/2 + cornerSize/2],
            [width/2 - cornerSize/2, -depth/2 + cornerSize/2]
        ];
        
        corners.forEach(([x, z]) => {
            const corner = new THREE.Mesh(cornerGeometry, cornerMaterial);
            corner.position.set(x, tileHeight / 2 + 0.01, z);
            this.add(corner);
        });
    }
}

// Self-register with the module registry
registerModule('floor', FloorTile, FloorTile.meta);
import * as THREE from 'three';
import { ShipModule } from './ShipModule.js';

export class CargoBay extends ShipModule {
    constructor(params = {}) {
        super('cargo', params);
        this.build();
    }
    
    build() {
        const { width, height, depth, color } = this.params;
        const wallThickness = 0.1;
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.7,
            roughness: 0.3,
            side: THREE.DoubleSide
        });
        
        // Floor
        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(width, wallThickness, depth),
            material
        );
        floor.position.y = -height/2 + wallThickness/2;
        floor.receiveShadow = true;
        this.add(floor);
        
        // Ceiling
        const ceiling = new THREE.Mesh(
            new THREE.BoxGeometry(width, wallThickness, depth),
            material
        );
        ceiling.position.y = height/2 - wallThickness/2;
        ceiling.castShadow = true;
        this.add(ceiling);
        
        // Side walls (left and right)
        const sideWall1 = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, height, depth),
            material
        );
        sideWall1.position.x = -width/2 + wallThickness/2;
        sideWall1.castShadow = true;
        this.add(sideWall1);
        
        const sideWall2 = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, height, depth),
            material
        );
        sideWall2.position.x = width/2 - wallThickness/2;
        sideWall2.castShadow = true;
        this.add(sideWall2);
        
        // Back wall
        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(width - wallThickness*2, height, wallThickness),
            material
        );
        backWall.position.z = -depth/2 + wallThickness/2;
        backWall.castShadow = true;
        this.add(backWall);
        
        // Front is open (cargo door)
        
        // Door panels - number scales with width
        const panelCount = Math.max(1, Math.floor(width / 2));
        const panelWidth = (width - wallThickness*2) / panelCount;
        
        for (let i = 0; i < panelCount; i++) {
            const panel = new THREE.Mesh(
                new THREE.BoxGeometry(panelWidth * 0.9, height * 0.8, 0.05),
                new THREE.MeshStandardMaterial({
                    color: 0x555555,
                    metalness: 0.8,
                    roughness: 0.2
                })
            );
            panel.position.x = -width/2 + wallThickness + panelWidth/2 + i * panelWidth;
            panel.position.z = depth/2 - 0.025;
            panel.position.y = 0;
            this.add(panel);
            
            // Panel details
            const detail = new THREE.Mesh(
                new THREE.BoxGeometry(panelWidth * 0.7, 0.05, 0.06),
                new THREE.MeshStandardMaterial({ color: 0x333333 })
            );
            detail.position.copy(panel.position);
            detail.position.z += 0.005;
            this.add(detail);
        }
        
        // Interior lights
        const lightCount = Math.max(1, Math.floor(depth / 2));
        for (let i = 0; i < lightCount; i++) {
            const light = new THREE.Mesh(
                new THREE.BoxGeometry(width * 0.8, 0.05, 0.1),
                new THREE.MeshStandardMaterial({
                    color: 0xffffaa,
                    emissive: 0xffffaa,
                    emissiveIntensity: 0.5
                })
            );
            light.position.y = height/2 - wallThickness - 0.05;
            light.position.z = -depth/2 + wallThickness + 0.5 + i * 2;
            this.add(light);
        }
    }
}
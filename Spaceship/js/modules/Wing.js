import * as THREE from 'three';
import { ShipModule } from './ShipModule.js';

export class Wing extends ShipModule {
    constructor(params = {}) {
        super('wing', params);
        this.build();
    }
    
    build() {
        const { width, height, depth, color } = this.params;
        
        // Main wing surface - tapered
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(width, depth * 0.2);
        wingShape.lineTo(width * 0.8, depth);
        wingShape.lineTo(0, depth * 0.8);
        wingShape.lineTo(0, 0);
        
        const extrudeSettings = {
            depth: height,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.02,
            bevelSegments: 1
        };
        
        const wingGeometry = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.6,
            roughness: 0.4,
            side: THREE.DoubleSide
        });
        const wing = new THREE.Mesh(wingGeometry, wingMaterial);
        wing.rotation.x = -Math.PI / 2;
        wing.position.y = -height / 2;
        wing.position.z = -depth / 2;
        wing.castShadow = true;
        wing.receiveShadow = true;
        this.add(wing);
        
        // Panel lines - number scales with width
        const panelCount = Math.max(2, Math.floor(width / 1.5));
        for (let i = 1; i < panelCount; i++) {
            const x = (i / panelCount) * width;
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x, -height/2 - 0.01, depth * 0.2 - depth/2),
                new THREE.Vector3(x * 0.8, -height/2 - 0.01, depth - depth/2)
            ]);
            const lineMaterial = new THREE.LineBasicMaterial({ 
                color: 0x333333,
                transparent: true,
                opacity: 0.5
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            this.add(line);
        }
        
        // Leading edge reinforcement
        const edgeGeometry = new THREE.BoxGeometry(0.05, height * 1.1, depth);
        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.9,
            roughness: 0.1
        });
        const leadingEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        leadingEdge.position.x = -0.025;
        this.add(leadingEdge);
        
        // Winglets at tip
        if (width > 2) {
            const wingletGeometry = new THREE.BoxGeometry(0.1, height * 2, 0.3);
            const wingletMaterial = new THREE.MeshStandardMaterial({
                color: 0x666666,
                metalness: 0.7,
                roughness: 0.3
            });
            const winglet = new THREE.Mesh(wingletGeometry, wingletMaterial);
            winglet.position.set(width - 0.05, 0, depth * 0.4);
            winglet.castShadow = true;
            this.add(winglet);
        }
        
        // Mounting point
        const mountGeometry = new THREE.CylinderGeometry(0.15, 0.15, height * 1.5);
        const mountMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.8,
            roughness: 0.2
        });
        const mount = new THREE.Mesh(mountGeometry, mountMaterial);
        mount.position.x = 0.1;
        this.add(mount);
    }
}
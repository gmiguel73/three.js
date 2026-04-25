import * as THREE from 'three';
import { ShipModule } from './ShipModule.js';
import { registerModule } from './registry.js';

export class Habitation extends ShipModule {
    static meta = {
        name: 'Habitation',
        icon: '🏠',
        description: 'Crew quarters',
        hotkey: '8'
    };

    constructor(params = {}) {
        super('habitation', params);
        this.build();
    }
    
    buildProcedural() {
        const { width, height, depth, color } = this.params;
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.6,
            roughness: 0.4
        });
        
        // Main habitat module
        const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
        const body = new THREE.Mesh(bodyGeometry, material);
        body.castShadow = true;
        body.receiveShadow = true;
        this.add(body);
        
        // Portholes - distributed across surfaces based on size
        const portholeGeometry = new THREE.CircleGeometry(0.15, 16);
        const portholeMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.7,
            emissive: 0x224466,
            emissiveIntensity: 0.3
        });
        
        // Front face portholes
        const frontCount = Math.max(1, Math.floor(width / 1.5));
        for (let i = 0; i < frontCount; i++) {
            const x = (i - (frontCount - 1) / 2) * (width * 0.7 / frontCount);
            const porthole = new THREE.Mesh(portholeGeometry, portholeMaterial);
            porthole.position.set(x, 0, depth/2 + 0.01);
            this.add(porthole);
            
            // Frame
            const frameGeometry = new THREE.RingGeometry(0.15, 0.18, 16);
            const frame = new THREE.Mesh(frameGeometry, new THREE.MeshStandardMaterial({ color: 0x333333 }));
            frame.position.copy(porthole.position);
            frame.position.z += 0.001;
            this.add(frame);
        }
        
        // Side portholes (if wide enough)
        if (width > 2) {
            const sideCount = Math.max(1, Math.floor(depth / 2));
            for (let i = 0; i < sideCount; i++) {
                const z = (i - (sideCount - 1) / 2) * (depth * 0.6 / Math.max(1, sideCount - 1));
                
                const portholeL = new THREE.Mesh(portholeGeometry, portholeMaterial);
                portholeL.position.set(-width/2 - 0.01, 0, z);
                portholeL.rotation.y = -Math.PI / 2;
                this.add(portholeL);
                
                const portholeR = new THREE.Mesh(portholeGeometry, portholeMaterial);
                portholeR.position.set(width/2 + 0.01, 0, z);
                portholeR.rotation.y = Math.PI / 2;
                this.add(portholeR);
            }
        }
        
        // Top viewport (if tall enough)
        if (height > 1.5) {
            const viewport = new THREE.Mesh(
                new THREE.CircleGeometry(Math.min(width, depth) * 0.25, 16),
                portholeMaterial
            );
            viewport.position.y = height/2 + 0.01;
            viewport.rotation.x = -Math.PI / 2;
            this.add(viewport);
        }
        
        // Airlock door
        const doorGeometry = new THREE.BoxGeometry(0.8, height * 0.7, 0.05);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            metalness: 0.8,
            roughness: 0.2
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 0, -depth/2 - 0.025);
        this.add(door);
        
        // Door window
        const doorWindow = new THREE.Mesh(
            new THREE.CircleGeometry(0.15, 16),
            portholeMaterial
        );
        doorWindow.position.set(0, height * 0.1, -depth/2 - 0.02);
        this.add(doorWindow);
        
        // Life support vents
        const ventGeometry = new THREE.BoxGeometry(width * 0.8, 0.1, 0.1);
        const ventMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        const vent1 = new THREE.Mesh(ventGeometry, ventMaterial);
        vent1.position.y = height/2 - 0.05;
        vent1.position.z = 0;
        this.add(vent1);
        
        const vent2 = new THREE.Mesh(ventGeometry, ventMaterial);
        vent2.position.y = -height/2 + 0.05;
        vent2.position.z = 0;
        this.add(vent2);
    }
}
// Self-register with the module registry
registerModule('habitation', Habitation, Habitation.meta);

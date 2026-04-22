import * as THREE from 'three';
import { ShipModule } from './ShipModule.js';
import { registerModule } from './registry.js';

export class Cockpit extends ShipModule {
    static meta = {
        name: 'Cockpit',
        icon: '🚀',
        description: 'Command module with viewport',
        hotkey: '2'
    };
    
    constructor(params = {}) {
        super('cockpit', params);
        this.build();
    }
    
    build() {
        const { width, height, depth, color } = this.params;
        
        // Main cockpit body - cone shape
        const bodyGeometry = new THREE.ConeGeometry(
            Math.max(width, depth) / 2,
            height,
            8
        );
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.8,
            roughness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2;
        body.position.z = depth / 4;
        body.castShadow = true;
        body.receiveShadow = true;
        this.add(body);
        
        // Cockpit base
        const baseGeometry = new THREE.CylinderGeometry(
            Math.max(width, depth) / 2.2,
            Math.max(width, depth) / 2,
            height * 0.3,
            8
        );
        const base = new THREE.Mesh(baseGeometry, bodyMaterial);
        base.position.y = -height * 0.35;
        base.castShadow = true;
        base.receiveShadow = true;
        this.add(base);
        
        // Windows - dynamic based on width
        const windowCount = Math.max(1, Math.floor(width / 1.5));
        const windowSpacing = width * 0.7 / windowCount;
        
        for (let i = 0; i < windowCount; i++) {
            const windowGeometry = new THREE.PlaneGeometry(0.4, 0.3);
            const windowMaterial = new THREE.MeshStandardMaterial({
                color: 0x4488ff,
                metalness: 0.9,
                roughness: 0.1,
                transparent: true,
                opacity: 0.7,
                emissive: 0x112244,
                emissiveIntensity: 0.2
            });
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            
            const xOffset = (i - (windowCount - 1) / 2) * windowSpacing;
            window.position.set(xOffset, height * 0.1, depth / 2 + 0.01);
            window.castShadow = true;
            this.add(window);
            
            // Window frame
            const frameGeometry = new THREE.EdgesGeometry(windowGeometry);
            const frameMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
            const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
            frame.position.copy(window.position);
            frame.position.z += 0.001;
            this.add(frame);
        }
        
        // Top viewport
        const viewportGeometry = new THREE.CircleGeometry(width * 0.2, 16);
        const viewportMaterial = new THREE.MeshStandardMaterial({
            color: 0x4488ff,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.6,
            emissive: 0x112244,
            emissiveIntensity: 0.3
        });
        const viewport = new THREE.Mesh(viewportGeometry, viewportMaterial);
        viewport.position.set(0, height * 0.3, 0);
        viewport.rotation.x = -Math.PI / 2;
        this.add(viewport);
    }
}

// Self-register with the module registry
registerModule('cockpit', Cockpit, Cockpit.meta);
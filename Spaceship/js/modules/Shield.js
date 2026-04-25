import * as THREE from 'three';
import { ShipModule } from './ShipModule.js';
import { registerModule } from './registry.js';

export class Shield extends ShipModule {
    static meta = {
        name: 'Shield',
        icon: '🛡️',
        description: 'Deflector shield generator',
        hotkey: '-'
    };

    constructor(params = {}) {
        super('shield', params);
        this.build();
    }
    
    buildProcedural() {
        const { width, height, depth, color } = this.params;
        const size = Math.min(width, height, depth);
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.6,
            roughness: 0.4
        });
        
        // Main shield generator housing
        const housingGeometry = new THREE.OctahedronGeometry(size * 0.4, 0);
        const housing = new THREE.Mesh(housingGeometry, material);
        housing.castShadow = true;
        housing.receiveShadow = true;
        this.add(housing);
        
        // Shield bubble (transparent)
        const bubbleGeometry = new THREE.SphereGeometry(size * 0.7, 24, 24);
        const bubbleMaterial = new THREE.MeshStandardMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.15,
            emissive: 0x1144aa,
            emissiveIntensity: 0.3,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        this.add(bubble);
        
        // Energy rings
        for (let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.TorusGeometry(size * (0.5 + i * 0.15), 0.03, 8, 32);
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: 0x66aaff,
                emissive: 0x2266cc,
                emissiveIntensity: 0.6,
                transparent: true,
                opacity: 0.7
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2 + (i * 0.2);
            ring.rotation.z = i * 0.3;
            this.add(ring);
        }
        
        // Projector nodes
        const nodeCount = 6;
        for (let i = 0; i < nodeCount; i++) {
            const phi = Math.acos(-1 + (2 * i) / nodeCount);
            const theta = Math.sqrt(nodeCount * Math.PI) * phi;
            
            const nodeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
            const nodeMaterial = new THREE.MeshStandardMaterial({
                color: 0x88ccff,
                emissive: 0x4488ff,
                emissiveIntensity: 0.8
            });
            const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
            
            const radius = size * 0.55;
            node.position.x = radius * Math.cos(theta) * Math.sin(phi);
            node.position.y = radius * Math.cos(phi);
            node.position.z = radius * Math.sin(theta) * Math.sin(phi);
            this.add(node);
        }
        
        // Base platform
        const baseGeometry = new THREE.CylinderGeometry(size * 0.45, size * 0.5, 0.15, 6);
        const base = new THREE.Mesh(baseGeometry, material);
        base.position.y = -size * 0.3;
        this.add(base);
        
        // Power conduits
        const conduitCount = 3;
        for (let i = 0; i < conduitCount; i++) {
            const angle = (i / conduitCount) * Math.PI * 2;
            const conduitGeometry = new THREE.BoxGeometry(0.08, size * 0.4, 0.08);
            const conduitMaterial = new THREE.MeshStandardMaterial({
                color: 0x334455,
                emissive: 0x112233,
                emissiveIntensity: 0.4
            });
            const conduit = new THREE.Mesh(conduitGeometry, conduitMaterial);
            conduit.position.x = Math.cos(angle) * size * 0.3;
            conduit.position.z = Math.sin(angle) * size * 0.3;
            conduit.position.y = size * 0.05;
            this.add(conduit);
        }
    }
}
// Self-register with the module registry
registerModule('shield', Shield, Shield.meta);

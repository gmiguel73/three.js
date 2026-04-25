import * as THREE from 'three';
import { ShipModule } from './ShipModule.js';
import { registerModule } from './registry.js';

export class Sensor extends ShipModule {
    static meta = {
        name: 'Sensor',
        icon: '📡',
        description: 'Scanning array',
        hotkey: '0'
    };

    constructor(params = {}) {
        super('sensor', params);
        this.build();
    }
    
    buildProcedural() {
        const { width, height, depth, color } = this.params;
        const size = Math.min(width, height, depth);
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.7,
            roughness: 0.3
        });
        
        // Main sensor housing
        const housingGeometry = new THREE.SphereGeometry(size * 0.4, 16, 16);
        const housing = new THREE.Mesh(housingGeometry, material);
        housing.castShadow = true;
        housing.receiveShadow = true;
        this.add(housing);
        
        // Sensor dish
        const dishGeometry = new THREE.SphereGeometry(
            size * 0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6
        );
        const dishMaterial = new THREE.MeshStandardMaterial({
            color: 0x446688,
            metalness: 0.9,
            roughness: 0.1,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const dish = new THREE.Mesh(dishGeometry, dishMaterial);
        dish.rotation.x = Math.PI;
        dish.position.y = size * 0.2;
        this.add(dish);
        
        // Scanning beam effect
        const beamGeometry = new THREE.ConeGeometry(size * 0.5, size * 0.8, 16, 1, true);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.rotation.x = Math.PI;
        beam.position.y = size * 0.6;
        this.add(beam);
        
        // Sensor array rings
        for (let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.TorusGeometry(size * 0.3 + i * 0.1, 0.02, 8, 24);
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: 0x6688aa,
                emissive: 0x224466,
                emissiveIntensity: 0.3
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = size * (0.1 + i * 0.05);
            this.add(ring);
        }
        
        // Support struts
        const strutCount = 4;
        for (let i = 0; i < strutCount; i++) {
            const angle = (i / strutCount) * Math.PI * 2;
            const strutGeometry = new THREE.CylinderGeometry(0.03, 0.03, size * 0.5);
            const strutMaterial = new THREE.MeshStandardMaterial({
                color: 0x555555,
                metalness: 0.8,
                roughness: 0.2
            });
            const strut = new THREE.Mesh(strutGeometry, strutMaterial);
            strut.position.x = Math.cos(angle) * size * 0.25;
            strut.position.z = Math.sin(angle) * size * 0.25;
            strut.position.y = -size * 0.1;
            this.add(strut);
        }
        
        // Base
        const baseGeometry = new THREE.CylinderGeometry(size * 0.35, size * 0.4, 0.15, 16);
        const base = new THREE.Mesh(baseGeometry, material);
        base.position.y = -size * 0.35;
        this.add(base);
    }
}
// Self-register with the module registry
registerModule('sensor', Sensor, Sensor.meta);

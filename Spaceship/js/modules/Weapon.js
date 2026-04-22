import * as THREE from 'three';
import { ShipModule } from './ShipModule.js';
import { registerModule } from './registry.js';

export class Weapon extends ShipModule {
    static meta = {
        name: 'Weapon',
        icon: '⚡',
        description: 'Energy weapon turret',
        hotkey: '9'
    };

    constructor(params = {}) {
        super('weapon', params);
        this.build();
    }
    
    build() {
        const { width, height, depth, color } = this.params;
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.9,
            roughness: 0.1
        });
        
        // Main weapon housing
        const housingGeometry = new THREE.BoxGeometry(width * 0.8, height * 0.6, depth * 0.8);
        const housing = new THREE.Mesh(housingGeometry, material);
        housing.castShadow = true;
        housing.receiveShadow = true;
        this.add(housing);
        
        // Barrel
        const barrelLength = depth * 1.2;
        const barrelGeometry = new THREE.CylinderGeometry(width * 0.15, width * 0.2, barrelLength, 12);
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.95,
            roughness: 0.05
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = barrelLength / 2 - depth * 0.1;
        barrel.castShadow = true;
        this.add(barrel);
        
        // Muzzle
        const muzzleGeometry = new THREE.CylinderGeometry(width * 0.18, width * 0.15, 0.2, 12);
        const muzzle = new THREE.Mesh(muzzleGeometry, barrelMaterial);
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.z = barrelLength - depth * 0.1;
        this.add(muzzle);
        
        // Power core (glowing)
        const coreGeometry = new THREE.SphereGeometry(width * 0.2, 16, 16);
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: 0xff4400,
            emissive: 0xff4400,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = height * 0.1;
        this.add(core);
        
        // Cooling fins
        const finCount = 6;
        for (let i = 0; i < finCount; i++) {
            const angle = (i / finCount) * Math.PI * 2;
            const finGeometry = new THREE.BoxGeometry(0.05, height * 0.5, depth * 0.6);
            const finMaterial = new THREE.MeshStandardMaterial({
                color: 0x444444,
                metalness: 0.8,
                roughness: 0.2
            });
            const fin = new THREE.Mesh(finGeometry, finMaterial);
            fin.position.x = Math.cos(angle) * (width * 0.45);
            fin.position.z = Math.sin(angle) * (width * 0.25);
            fin.rotation.y = -angle;
            this.add(fin);
        }
        
        // Mounting base
        const baseGeometry = new THREE.CylinderGeometry(width * 0.5, width * 0.6, 0.2, 16);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.7,
            roughness: 0.3
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -height * 0.3;
        this.add(base);
    }
}
// Self-register with the module registry
registerModule('weapon', Weapon, Weapon.meta);

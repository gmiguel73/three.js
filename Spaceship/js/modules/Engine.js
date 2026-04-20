import * as THREE from 'three';
import { ShipModule } from './ShipModule.js';

export class Engine extends ShipModule {
    constructor(params = {}) {
        super('engine', params);
        this.build();
    }
    
    build() {
        const { width, height, depth, color } = this.params;
        
        // Main engine housing
        const housingGeometry = new THREE.CylinderGeometry(
            width / 2,
            width / 2 * 1.1,
            depth,
            12
        );
        const housingMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.9,
            roughness: 0.1
        });
        const housing = new THREE.Mesh(housingGeometry, housingMaterial);
        housing.rotation.x = Math.PI / 2;
        housing.castShadow = true;
        housing.receiveShadow = true;
        this.add(housing);
        
        // Engine nozzle (back)
        const nozzleGeometry = new THREE.ConeGeometry(
            width / 2 * 0.9,
            depth * 0.3,
            12,
            1,
            true
        );
        const nozzleMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.95,
            roughness: 0.05
        });
        const nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
        nozzle.rotation.x = -Math.PI / 2;
        nozzle.position.z = -depth / 2 - depth * 0.15;
        nozzle.castShadow = true;
        this.add(nozzle);
        
        // Thruster glow (dynamic based on size)
        const glowSize = Math.min(width, height) * 0.4;
        const glowGeometry = new THREE.ConeGeometry(glowSize, depth * 0.5, 12);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.6
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.rotation.x = -Math.PI / 2;
        glow.position.z = -depth / 2 - depth * 0.4;
        this.add(glow);
        
        // Cooling fins - number scales with width
        const finCount = Math.max(4, Math.floor(width * 2));
        for (let i = 0; i < finCount; i++) {
            const angle = (i / finCount) * Math.PI * 2;
            const finGeometry = new THREE.BoxGeometry(0.05, height * 0.8, depth * 0.8);
            const finMaterial = new THREE.MeshStandardMaterial({
                color: 0x555555,
                metalness: 0.8,
                roughness: 0.3
            });
            const fin = new THREE.Mesh(finGeometry, finMaterial);
            fin.position.x = Math.cos(angle) * (width / 2 + 0.025);
            fin.position.z = Math.sin(angle) * (width / 2 + 0.025);
            fin.rotation.y = -angle;
            fin.castShadow = true;
            this.add(fin);
        }
        
        // Mounting brackets
        const bracketGeometry = new THREE.BoxGeometry(width * 1.2, 0.1, 0.2);
        const bracketMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.7,
            roughness: 0.4
        });
        
        const bracket1 = new THREE.Mesh(bracketGeometry, bracketMaterial);
        bracket1.position.y = height / 2 + 0.05;
        bracket1.position.z = depth * 0.25;
        this.add(bracket1);
        
        const bracket2 = new THREE.Mesh(bracketGeometry, bracketMaterial);
        bracket2.position.y = height / 2 + 0.05;
        bracket2.position.z = -depth * 0.25;
        this.add(bracket2);
    }
}
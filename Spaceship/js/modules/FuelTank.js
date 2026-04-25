import * as THREE from 'three';
import { ShipModule } from './ShipModule.js';
import { registerModule } from './registry.js';

export class FuelTank extends ShipModule {
    static meta = {
        name: 'Fuel Tank',
        icon: '⛽',
        description: 'Fuel storage',
        hotkey: '6'
    };

    static assets = {
        parts: {
            main: {}
        }
    };

    constructor(params = {}) {
        super('fuel', params);
        this.build();
    }
    
    buildProcedural() {
        const { width, height, depth, color } = this.params;
        const radius = Math.min(width, depth) / 2;
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const bodyGeometry = new THREE.CylinderGeometry(radius, radius, height, 16);
        const body = new THREE.Mesh(bodyGeometry, material);
        body.castShadow = true;
        body.receiveShadow = true;
        body.userData.placeholder = true;
        this.add(body);
        
        const capGeometry = new THREE.SphereGeometry(radius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const topCap = new THREE.Mesh(capGeometry, material);
        topCap.position.y = height / 2;
        topCap.castShadow = true;
        topCap.userData.placeholder = true;
        this.add(topCap);
        
        const bottomCap = new THREE.Mesh(capGeometry, material);
        bottomCap.position.y = -height / 2;
        bottomCap.rotation.x = Math.PI;
        bottomCap.castShadow = true;
        bottomCap.userData.placeholder = true;
        this.add(bottomCap);
        
        const bandCount = Math.max(2, Math.floor(height / 1.5));
        for (let i = 0; i < bandCount; i++) {
            const y = -height/2 + (i + 0.5) * (height / bandCount);
            const bandGeometry = new THREE.TorusGeometry(radius + 0.02, 0.05, 8, 16);
            const bandMaterial = new THREE.MeshStandardMaterial({
                color: 0x444444,
                metalness: 0.9,
                roughness: 0.1
            });
            const band = new THREE.Mesh(bandGeometry, bandMaterial);
            band.rotation.x = Math.PI / 2;
            band.position.y = y;
            band.userData.placeholder = true;
            this.add(band);
        }
        
        const pipeGeometry = new THREE.CylinderGeometry(0.08, 0.08, height * 0.8);
        const pipeMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.7,
            roughness: 0.3
        });
        
        const pipe1 = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe1.position.x = radius + 0.08;
        pipe1.position.y = 0;
        pipe1.userData.placeholder = true;
        this.add(pipe1);
        
        const pipe2 = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe2.position.x = -radius - 0.08;
        pipe2.position.y = 0;
        pipe2.userData.placeholder = true;
        this.add(pipe2);
        
        const indicatorGeometry = new THREE.BoxGeometry(0.1, height * 0.8, 0.02);
        const indicatorMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.z = radius + 0.01;
        indicator.userData.placeholder = true;
        this.add(indicator);
        
        if (height > 2) {
            const stripeCount = 8;
            for (let i = 0; i < stripeCount; i++) {
                const angle = (i / stripeCount) * Math.PI * 2;
                const stripeGeometry = new THREE.BoxGeometry(0.05, 0.2, 0.02);
                const stripeMaterial = new THREE.MeshStandardMaterial({
                    color: i % 2 === 0 ? 0xff0000 : 0xffff00
                });
                const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
                stripe.position.x = Math.cos(angle) * (radius + 0.03);
                stripe.position.z = Math.sin(angle) * (radius + 0.03);
                stripe.position.y = height / 2 - 0.3;
                stripe.rotation.y = -angle;
                stripe.userData.placeholder = true;
                this.add(stripe);
            }
        }
    }
}
// Self-register with the module registry
registerModule('fuel', FuelTank, FuelTank.meta);

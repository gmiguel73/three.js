import * as THREE from 'three';
import { ShipModule } from './ShipModule.js';

export class Connector extends ShipModule {
    constructor(params = {}) {
        super('connector', params);
        this.build();
    }
    
    build() {
        const { width, height, depth, color } = this.params;
        const size = Math.min(width, height, depth);
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.8,
            roughness: 0.2
        });
        
        // Central cube
        const coreGeometry = new THREE.BoxGeometry(size * 0.6, size * 0.6, size * 0.6);
        const core = new THREE.Mesh(coreGeometry, material);
        core.castShadow = true;
        core.receiveShadow = true;
        this.add(core);
        
        // Connection points on all 6 faces
        const connectorGeometry = new THREE.CylinderGeometry(0.15, 0.15, size * 0.4);
        const connectorMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.9,
            roughness: 0.1
        });
        
        // +X
        const connX1 = new THREE.Mesh(connectorGeometry, connectorMaterial);
        connX1.rotation.z = Math.PI / 2;
        connX1.position.x = size * 0.5;
        this.add(connX1);
        
        // -X
        const connX2 = new THREE.Mesh(connectorGeometry, connectorMaterial);
        connX2.rotation.z = Math.PI / 2;
        connX2.position.x = -size * 0.5;
        this.add(connX2);
        
        // +Y
        const connY1 = new THREE.Mesh(connectorGeometry, connectorMaterial);
        connY1.position.y = size * 0.5;
        this.add(connY1);
        
        // -Y
        const connY2 = new THREE.Mesh(connectorGeometry, connectorMaterial);
        connY2.position.y = -size * 0.5;
        this.add(connY2);
        
        // +Z
        const connZ1 = new THREE.Mesh(connectorGeometry, connectorMaterial);
        connZ1.rotation.x = Math.PI / 2;
        connZ1.position.z = size * 0.5;
        this.add(connZ1);
        
        // -Z
        const connZ2 = new THREE.Mesh(connectorGeometry, connectorMaterial);
        connZ2.rotation.x = Math.PI / 2;
        connZ2.position.z = -size * 0.5;
        this.add(connZ2);
        
        // Central hub detail
        const hubGeometry = new THREE.SphereGeometry(size * 0.2, 12, 12);
        const hubMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0x222222,
            emissiveIntensity: 0.2
        });
        const hub = new THREE.Mesh(hubGeometry, hubMaterial);
        this.add(hub);
    }
}
import * as THREE from 'three';

export class ShipModule extends THREE.Group {
    constructor(type, params = {}) {
        super();
        this.type = type;
        this.params = {
            width: 1,
            height: 1,
            depth: 1,
            color: 0x888888,
            ...params
        };
        this.castShadow = true;
        this.receiveShadow = true;
    }
    
    build() {
        // Override in subclasses
        const geometry = new THREE.BoxGeometry(
            this.params.width,
            this.params.height,
            this.params.depth
        );
        const material = new THREE.MeshStandardMaterial({
            color: this.params.color,
            metalness: 0.7,
            roughness: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.add(mesh);
    }
    
    clear() {
        while(this.children.length > 0) {
            this.remove(this.children[0]);
        }
    }
    
    update() {
        this.clear();
        this.build();
    }
    
    setScale(width, height, depth) {
        this.params.width = Math.max(1, Math.min(10, width));
        this.params.height = Math.max(1, Math.min(10, height));
        this.params.depth = Math.max(1, Math.min(10, depth));
        this.update();
    }
    
    setColor(hexColor) {
        this.params.color = hexColor;
        this.traverse((child) => {
            if (child.material) {
                child.material.color.setHex(hexColor);
            }
        });
    }
    
    clone() {
        const cloned = new this.constructor(this.params);
        cloned.position.copy(this.position);
        cloned.rotation.copy(this.rotation);
        cloned.params = JSON.parse(JSON.stringify(this.params));
        cloned.update();
        return cloned;
    }
    
    serialize() {
        return {
            type: this.type,
            position: this.position.toArray(),
            rotation: this.rotation.toArray(),
            params: this.params
        };
    }
    
    static deserialize(data) {
        const module = new this(data.params);
        module.position.fromArray(data.position);
        module.rotation.fromArray(data.rotation);
        return module;
    }
}
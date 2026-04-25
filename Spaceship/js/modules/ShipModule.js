import * as THREE from 'three';
import { AssetLibrary } from '../assets/AssetLibrary.js';

export class ShipModule extends THREE.Group {
    constructor(type, params = {}) {
        super();
        this.type = type;
        this.params = {
            width: 1,
            height: 1,
            depth: 1,
            color: 0x888888,
            ...params,
            // Always own a fresh map so paste/clone don't share references.
            parts: { ...(params.parts || {}) }
        };
        // partName -> Group wrapping the loaded glTF scene clone.
        this.parts = {};
        // Resolves once asset parts (if any) finish loading. Pure-procedural
        // modules resolve immediately. Use `await module.ready` if you need
        // to act on the final geometry.
        this.ready = Promise.resolve(this);
        this.castShadow = true;
        this.receiveShadow = true;
    }

    /**
     * Orchestrator. Subclasses should NOT override this — override
     * `buildProcedural()` instead. Runs the procedural pass synchronously
     * so the module is renderable immediately, then kicks off any glTF
     * loads declared via `static assets`.
     */
    build() {
        this.parts = {};
        this.buildProcedural();

        const decl = this.constructor.assets;
        if (!decl) {
            this.ready = Promise.resolve(this);
            return;
        }

        const partsParams = this.params.parts || {};
        this.ready = AssetLibrary.loadModuleParts(this.type, partsParams)
            .then((loaded) => {
                this.removePlaceholders();
                for (const [partName, { scene, variantName }] of Object.entries(loaded)) {
                    const group = new THREE.Group();
                    group.name = partName;
                    group.userData.assetPart = true;
                    group.userData.variant = variantName;
                    group.add(scene);
                    this.parts[partName] = group;
                    this.add(group);
                }
                this.applyColorToAssetParts();
                return this;
            })
            .catch((err) => {
                // Asset load failures leave the procedural placeholder in place
                // so the module remains visible and editable. Logged for the
                // author; not surfaced to the user UI in this iteration.
                console.warn(`[ShipModule] asset load failed for "${this.type}":`, err);
                return this;
            });
    }

    /**
     * Default placeholder geometry — a tinted unit box, tagged so the
     * orchestrator can swap it out once asset parts arrive. Subclasses
     * override this to generate detailed procedural geometry. Tag any
     * meshes that should disappear once assets load with
     * `mesh.userData.placeholder = true`.
     */
    buildProcedural() {
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
        mesh.userData.placeholder = true;
        this.add(mesh);
    }

    /**
     * Strip children that buildProcedural() flagged as placeholders.
     * Permanent procedural detail (hybrid modules) stays put.
     */
    removePlaceholders() {
        for (let i = this.children.length - 1; i >= 0; i--) {
            const child = this.children[i];
            if (child.userData && child.userData.placeholder) {
                this.remove(child);
            }
        }
    }

    /**
     * Tint asset-part materials according to each variant's `tintable` list
     * from the manifest. No-op for modules without a `static assets` block,
     * and for parts whose variant declares no tintable materials.
     */
    async applyColorToAssetParts() {
        const decl = this.constructor.assets;
        if (!decl) return;
        if (!this.parts || Object.keys(this.parts).length === 0) return;

        let manifest;
        try {
            manifest = await AssetLibrary.getManifest(this.type);
        } catch (e) {
            return;
        }

        for (const [partName, partGroup] of Object.entries(this.parts)) {
            const variantName = partGroup.userData.variant;
            const tintable = manifest.parts
                && manifest.parts[partName]
                && manifest.parts[partName].variants
                && manifest.parts[partName].variants[variantName]
                && manifest.parts[partName].variants[variantName].tintable;
            if (!Array.isArray(tintable) || tintable.length === 0) continue;
            this._tintAssetMaterials(partGroup, new Set(tintable), this.params.color);
        }
    }

    _tintAssetMaterials(root, allowed, hexColor) {
        root.traverse((child) => {
            if (!child.material) return;
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            for (let i = 0; i < mats.length; i++) {
                const mat = mats[i];
                if (!allowed.has(mat.name)) continue;
                // Clone shared materials on first tint so multiple module
                // instances with different colors don't bleed into each other.
                let target = mat;
                if (!mat.userData._tintCloned) {
                    target = mat.clone();
                    target.userData._tintCloned = true;
                    if (Array.isArray(child.material)) {
                        child.material[i] = target;
                    } else {
                        child.material = target;
                    }
                }
                if (target.color) target.color.setHex(hexColor);
            }
        });
    }

    clear() {
        while (this.children.length > 0) {
            this.remove(this.children[0]);
        }
    }

    update() {
        this.clear();
        this.build();
    }

    setScale(width, height, depth) {
        // Guard against NaN from empty inputs
        width = Number.isFinite(width) ? width : 1;
        height = Number.isFinite(height) ? height : 1;
        depth = Number.isFinite(depth) ? depth : 1;

        this.params.width = Math.max(1, Math.min(10, width));
        this.params.height = Math.max(1, Math.min(10, height));
        this.params.depth = Math.max(1, Math.min(10, depth));
        this.update();
    }

    setColor(hexColor) {
        this.params.color = hexColor;
        this.traverse((child) => {
            if (!child.material) return;
            // Asset parts are tinted separately so authored PBR materials
            // outside the variant's `tintable` allowlist are preserved.
            if (this._isAssetDescendant(child)) return;
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            for (const mat of mats) {
                if (mat.color) mat.color.setHex(hexColor);
            }
        });
        this.applyColorToAssetParts();
    }

    _isAssetDescendant(obj) {
        let p = obj;
        while (p && p !== this) {
            if (p.userData && p.userData.assetPart) return true;
            p = p.parent;
        }
        return false;
    }

    clone() {
        // Deep-copy params before construction so the clone owns its own
        // params (including the `parts` variant map) and can't accidentally
        // mutate the original via shared references.
        const clonedParams = JSON.parse(JSON.stringify(this.params));
        const cloned = new this.constructor(clonedParams);
        cloned.position.copy(this.position);
        cloned.rotation.copy(this.rotation);
        return cloned;
    }

    serialize() {
        return {
            type: this.type,
            position: this.position.toArray(),
            rotation: this.rotation.toArray(),
            floor: this.floor || 0,
            params: { ...this.params, parts: { ...(this.params.parts || {}) } }
        };
    }

    static deserialize(data) {
        const module = new this(data.params);
        module.position.fromArray(data.position);
        module.rotation.fromArray(data.rotation);
        return module;
    }
}

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GridSystem } from './GridSystem.js';
import { Storage } from './Storage.js';
import { PartInventory } from './ui/PartInventory.js';
import { PropertiesPanel } from './ui/PropertiesPanel.js';
import { FloorManager } from './ui/FloorManager.js';
import { Controls } from './Controls.js';
import { ShipModule } from './modules/ShipModule.js';
import { MODULE_REGISTRY, createModule } from './modules/registry.js';
import { AddCommand } from './commands/AddCommand.js';
import { RemoveCommand } from './commands/RemoveCommand.js';
import { ModifyCommand } from './commands/ModifyCommand.js';
// Import all modules to trigger self-registration (side effects)
import './modules/FloorTile.js';
import './modules/Cockpit.js';
import './modules/Engine.js';
import './modules/Wing.js';
import './modules/CargoBay.js';
import './modules/FuelTank.js';
import './modules/Connector.js';
import './modules/Habitation.js';
import './modules/Weapon.js';
import './modules/Sensor.js';
import './modules/Shield.js';

export class SpaceshipBuilder {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.gridSystem = null;
        this.storage = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.modules = [];
        this.selectedModule = null;
        this.currentFloor = 0;
        this.isPlacing = false;
        this.placingType = null;
        
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
        
        this.ui = {
            inventory: null,
            properties: null,
            floors: null
        };
        
        // Preview system
        this.previewMesh = null;
        this.previewOutline = null;
        this.previewValid = true;
        this.areaPreviewMeshes = [];
        
        // Clipboard for copy/paste
        this.clipboard = null;
    }
    
    init() {
        this.setupScene();
        this.setupGrid();
        this.setupUI();
        this.setupControls();
        this.setupEventListeners();
        this.setupStorage();
        
        this.animate();
        
        // Initialize floor display after UI is ready
        this.updateFloorDisplay();
        this.updateStatus('Spaceship Builder ready - 1 floor initialized');
        
        // Ensure grid is visible
        this.gridSystem.visible = true;
        this.gridSystem.gridGroup.visible = true;
        
        // Try to load autosave
        const loaded = this.storage.loadAutoSave();
        
        // If no autosave, create default floor tiles
        if (!loaded) {
            this.createDefaultFloor();
        }
    }
    
    createDefaultFloor() {
        // Create a 5x5 floor area in the center as starting point
        const floorSize = 5;
        const startX = -Math.floor(floorSize / 2);
        const startZ = -Math.floor(floorSize / 2);
        
        for (let x = 0; x < floorSize; x++) {
            for (let z = 0; z < floorSize; z++) {
                const pos = {
                    x: startX + x,
                    y: this.currentFloor * this.gridSystem.cellSize,  // Floor tiles at ground level
                    z: startZ + z
                };
                const floorTile = createModule('floor');
                if (floorTile) {
                    floorTile.position.copy(pos);
                    floorTile.floor = this.currentFloor;
                    floorTile.castShadow = true;
                    floorTile.receiveShadow = true;
                    this.scene.add(floorTile);
                    this.modules.push(floorTile);
                }
            }
        }
        this.updateModuleCount();
    }
    setupScene() {
        const container = document.getElementById('viewport');
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 50, 200);
        
        // Store container for camera updates
        this.viewportContainer = container;
        
        // Create all three camera types
        this.cameras = {};
        const aspect = container.clientWidth / container.clientHeight;
        
        // 1. 3/4 Side view (DEFAULT) - Isometric-like perspective
        this.cameras.threeQuarter = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.cameras.threeQuarter.position.set(25, 20, 25);
        this.cameras.threeQuarter.lookAt(0, 0, 0);
        
        // 2. Top-down view - Orthographic
        const frustumSize = 35;
        this.cameras.topDown = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            0.1,
            1000
        );
        this.cameras.topDown.position.set(0, 50, 0);
        this.cameras.topDown.lookAt(0, 0, 0);
        
        // 3. 3D Free view - Perspective for detailed work
        this.cameras.free3d = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.cameras.free3d.position.set(15, 15, 15);
        this.cameras.free3d.lookAt(0, 0, 0);
        
        // Set default camera
        this.currentCameraMode = 'threeQuarter';
        this.camera = this.cameras[this.currentCameraMode];
        
        // Renderer with enhanced settings
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        container.appendChild(this.renderer.domElement);
        
        // Enhanced lighting setup
        // Ambient light for base illumination
        const ambient = new THREE.AmbientLight(0x404060, 0.4);
        this.scene.add(ambient);
        
        // Main directional light (sun)
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(30, 40, 20);
        dirLight.castShadow = true;
        dirLight.shadow.camera.left = -60;
        dirLight.shadow.camera.right = 60;
        dirLight.shadow.camera.top = 60;
        dirLight.shadow.camera.bottom = -60;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 150;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.bias = -0.0001;
        dirLight.shadow.radius = 4;
        this.scene.add(dirLight);
        
        // Fill light from opposite direction
        const fillLight = new THREE.DirectionalLight(0x8090ff, 0.3);
        fillLight.position.set(-20, 20, -15);
        this.scene.add(fillLight);
        
        // Hemisphere light for natural ambient
        const hemiLight = new THREE.HemisphereLight(0x606080, 0x202030, 0.5);
        this.scene.add(hemiLight);
        
        // Orbit controls - will be reconfigured per camera mode
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.configureControlsForCamera();
    }
    
    configureControlsForCamera() {
        const mode = this.currentCameraMode;
        
        if (mode === 'topDown') {
            // Top-down: pan and zoom only, no rotation
            this.controls.enableRotate = false;
            this.controls.mouseButtons = {
                LEFT: THREE.MOUSE.PAN,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN
            };
        } else if (mode === 'threeQuarter') {
            // 3/4 view: limited rotation, good for building
            this.controls.enableRotate = true;
            this.controls.minPolarAngle = Math.PI * 0.2;
            this.controls.maxPolarAngle = Math.PI * 0.45;
            this.controls.minDistance = 10;
            this.controls.maxDistance = 80;
            this.controls.mouseButtons = {
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN
            };
        } else if (mode === 'free3d') {
            // Free 3D: full rotation
            this.controls.enableRotate = true;
            this.controls.minPolarAngle = 0;
            this.controls.maxPolarAngle = Math.PI;
            this.controls.minDistance = 5;
            this.controls.maxDistance = 200;
            this.controls.mouseButtons = {
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN
            };
        }
    }
    
    switchCamera(mode) {
        if (!this.cameras[mode]) return;
        
        // Save current camera position if switching from free modes
        if (this.currentCameraMode === 'free3d' || this.currentCameraMode === 'threeQuarter') {
            this.cameras[this.currentCameraMode].position.copy(this.camera.position);
            this.cameras[this.currentCameraMode].quaternion.copy(this.camera.quaternion);
        }
        
        this.currentCameraMode = mode;
        this.camera = this.cameras[mode];
        
        // Update controls
        this.controls.object = this.camera;
        this.configureControlsForCamera();
        this.controls.update();
        
        // Update UI buttons
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`view-${mode === 'threeQuarter' ? '3q' : mode === 'topDown' ? 'top' : '3d'}`).classList.add('active');
        
        this.updateStatus(`Switched to ${mode === 'threeQuarter' ? '3/4' : mode === 'topDown' ? 'Top-Down' : '3D Free'} view`);
    }
    
    setupGrid() {
        this.gridSystem = new GridSystem(20, 40, 1);
        this.gridSystem.addToScene(this.scene);
        // Don't call updateFloorDisplay here - UI not ready yet
        // It will be called after setupUI
    }
    
    setupUI() {
        this.ui.inventory = new PartInventory(this);
        this.ui.properties = new PropertiesPanel(this);
        this.ui.floors = new FloorManager(this);
        
        this.ui.inventory.init();
        this.ui.properties.init();
        this.ui.floors.init();
    }
    
    setupControls() {
        this.interactionControls = new Controls(this);
        this.interactionControls.init();
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Toolbar actions
        document.getElementById('btn-new').addEventListener('click', () => this.newShip());
        document.getElementById('btn-save').addEventListener('click', () => this.save());
        document.getElementById('btn-load').addEventListener('click', () => this.load());
        document.getElementById('btn-export').addEventListener('click', () => this.exportJSON());
        document.getElementById('btn-import').addEventListener('click', () => {
            document.getElementById('file-import-input').click();
        });
        document.getElementById('file-import-input').addEventListener('change', (e) => this.importJSON(e));
        
        document.getElementById('btn-undo').addEventListener('click', () => this.undo());
        document.getElementById('btn-redo').addEventListener('click', () => this.redo());
        
        document.getElementById('btn-grid').addEventListener('click', () => this.toggleGrid());
        
        // Camera view buttons
        document.getElementById('view-3q').addEventListener('click', () => this.switchCamera('threeQuarter'));
        document.getElementById('view-top').addEventListener('click', () => this.switchCamera('topDown'));
        document.getElementById('view-3d').addEventListener('click', () => this.switchCamera('free3d'));
    }
    
    setupStorage() {
        this.storage = new Storage(this);
    }
    
    onWindowResize() {
        const container = this.viewportContainer || document.getElementById('viewport');
        const aspect = container.clientWidth / container.clientHeight;
        
        // Update all cameras
        Object.values(this.cameras).forEach(cam => {
            if (cam.isPerspectiveCamera) {
                cam.aspect = aspect;
            } else if (cam.isOrthographicCamera) {
                const frustumSize = 35;
                cam.left = frustumSize * aspect / -2;
                cam.right = frustumSize * aspect / 2;
                cam.top = frustumSize / 2;
                cam.bottom = frustumSize / -2;
            }
            cam.updateProjectionMatrix();
        });
        
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    startPlacing(type) {
        this.isPlacing = true;
        this.placingType = type;
        this.updateStatus(`Placing ${type} - Click on grid to place`);
        document.body.style.cursor = 'crosshair';
        // Create preview
        this.createPreview(type);
        // Set initial preview position at center of grid
        const centerPos = { x: 0, y: 0, z: 0 };
        this.updatePreview(centerPos);
    }
    
    stopPlacing() {
        this.isPlacing = false;
        this.placingType = null;
        document.body.style.cursor = 'default';
        this.updateStatus('Ready');
        // Clear preview
        this.clearPreview();
        // Re-enable camera controls
        if (this.controls) {
            this.controls.enabled = true;
        }
    }
    
    placeModule(type, position) {
        const snappedPos = this.gridSystem.snapToGrid(position);
        
        // Floor tiles sit at ground level, other modules sit 0.5 units above
        if (type === 'floor') {
            snappedPos.y = this.currentFloor * this.gridSystem.cellSize;
        } else {
            snappedPos.y = this.currentFloor * this.gridSystem.cellSize + 0.5;
        }
        
        // Check for collision with existing modules
        const collision = this.checkCollision(snappedPos, type);
        if (collision) {
            if (collision.type === 'no-floor') {
                this.updateStatus('Cannot place here - requires floor tile');
            } else {
                this.updateStatus(`Cannot place here - position occupied by ${collision.type}`);
            }
            return null;
        }
        
        const module = createModule(type);
        if (!module) return null;
        
        module.position.copy(snappedPos);
        module.floor = this.currentFloor;  // Store floor as property
        module.castShadow = true;
        module.receiveShadow = true;
        
        this.scene.add(module);
        this.modules.push(module);
        
        this.selectModule(module);
        this.saveToHistory('add', module);
        this.updateModuleCount();
        this.storage.autoSave();
        
        return module;
    }
    
    checkCollision(position, type = null) {
        // Check if any existing module occupies this position (with tolerance for floating point)
        const tolerance = 0.1;
        let hasFloorTile = false;
        
        // Determine which floor we're checking
        const posFloor = this.currentFloor;
        
        for (const module of this.modules) {
            // Use stored floor property instead of calculating from Y
            const moduleFloor = module.floor !== undefined ? module.floor : 0;
            
            if (moduleFloor === posFloor) {
                const dx = Math.abs(module.position.x - position.x);
                const dz = Math.abs(module.position.z - position.z);
                
                if (dx < tolerance && dz < tolerance) {
                    // Found a module at this position
                    if (module.type === 'floor') {
                        hasFloorTile = true;
                        // Floor tiles block other floor tiles
                        if (type === 'floor') {
                            return module;
                        }
                        // Floor tiles don't block non-floor modules (they go on top)
                    } else {
                        // Non-floor module blocks other non-floor modules
                        if (type !== 'floor') {
                            return module;
                        }
                        // Non-floor modules don't block floor tiles (floor goes underneath)
                    }
                }
            }
        }
        
        // Non-floor modules require a floor tile beneath them
        if (type && type !== 'floor' && !hasFloorTile) {
            return { type: 'no-floor', message: 'Requires floor tile' };
        }
        
        return null;
    }
    
    createPreview(type) {
        // Remove existing preview
        this.clearPreview();
        
        // Create preview mesh using registry
        const previewModule = createModule(type);
        if (!previewModule) return;
        
        // Make it semi-transparent and visible
        previewModule.traverse((child) => {
            if (child.isMesh) {
                // Clone material to avoid affecting original
                if (Array.isArray(child.material)) {
                    child.material = child.material.map(mat => {
                        const newMat = mat.clone();
                        newMat.transparent = true;
                        newMat.opacity = 0.5;
                        newMat.depthWrite = false;
                        newMat.depthTest = false;
                        return newMat;
                    });
                } else if (child.material) {
                    child.material = child.material.clone();
                    child.material.transparent = true;
                    child.material.opacity = 0.5;
                    child.material.depthWrite = false;
                    child.material.depthTest = false;
                }
                child.renderOrder = 999; // Render on top
            }
        });
        
        previewModule.castShadow = false;
        previewModule.receiveShadow = false;
        previewModule.renderOrder = 999;
        // Position will be set by updatePreview
        this.previewMesh = previewModule;
        this.scene.add(this.previewMesh);
        
        // Create boundary outline on floor
        const outlineGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 0.02, 1));
        const outlineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ff00,
            linewidth: 2,
            depthTest: false,
            depthWrite: false
        });
        this.previewOutline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
        this.previewOutline.position.y = this.currentFloor * this.gridSystem.cellSize + 0.02;
        this.previewOutline.renderOrder = 1000;
        this.scene.add(this.previewOutline);
    }
    
    updatePreview(position) {
        if (!this.previewMesh || !this.isPlacing) return;
        
        const snappedPos = this.gridSystem.snapToGrid(position);
        // Floor tiles at ground level, other modules 0.5 units above
        if (this.placingType === 'floor') {
            snappedPos.y = this.currentFloor * this.gridSystem.cellSize;
        } else {
            snappedPos.y = this.currentFloor * this.gridSystem.cellSize + 0.5;
        }
        
        // Update preview mesh position
        this.previewMesh.position.copy(snappedPos);
        
        // Update outline position
        if (this.previewOutline) {
            this.previewOutline.position.x = snappedPos.x;
            this.previewOutline.position.z = snappedPos.z;
            this.previewOutline.position.y = this.currentFloor * this.gridSystem.cellSize + 0.02;
            
            // Check collision and update color
            const collision = this.checkCollision(snappedPos, this.placingType);
            this.previewValid = !collision;
            this.previewOutline.material.color.setHex(collision ? 0xff0000 : 0x00ff00);
        }
    }
    
    clearPreview() {
        if (this.previewMesh) {
            this.scene.remove(this.previewMesh);
            this.previewMesh = null;
        }
        if (this.previewOutline) {
            this.scene.remove(this.previewOutline);
            this.previewOutline = null;
        }
        // Clear area preview meshes
        if (this.areaPreviewMeshes) {
            this.areaPreviewMeshes.forEach(mesh => this.scene.remove(mesh));
            this.areaPreviewMeshes = [];
        }
    }
    
    updateAreaPreview(startPos, endPos) {
        // Clear existing area preview
        if (this.areaPreviewMeshes) {
            this.areaPreviewMeshes.forEach(mesh => this.scene.remove(mesh));
        }
        this.areaPreviewMeshes = [];
        
        // Calculate rectangle bounds
        const minX = Math.min(startPos.x, endPos.x);
        const maxX = Math.max(startPos.x, endPos.x);
        const minZ = Math.min(startPos.z, endPos.z);
        const maxZ = Math.max(startPos.z, endPos.z);
        
        // Create preview for each tile in the area
        for (let x = minX; x <= maxX; x += this.gridSystem.cellSize) {
            for (let z = minZ; z <= maxZ; z += this.gridSystem.cellSize) {
                const pos = { x: x, y: 0, z: z };
                const snappedPos = this.gridSystem.snapToGrid(pos);
                
                // Check if position is valid
                const checkPos = { ...snappedPos };
                if (this.placingType === 'floor') {
                    checkPos.y = this.currentFloor * this.gridSystem.cellSize;
                } else {
                    checkPos.y = this.currentFloor * this.gridSystem.cellSize + 0.5;
                }
                
                const collision = this.checkCollision(checkPos, this.placingType);
                const isValid = !collision;
                
                // Create outline for this tile
                const outlineGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 0.02, 1));
                const outlineMaterial = new THREE.LineBasicMaterial({ 
                    color: isValid ? 0x00ff00 : 0xff0000,
                    depthTest: false,
                    depthWrite: false
                });
                const outline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
                outline.position.set(snappedPos.x, this.currentFloor * this.gridSystem.cellSize + 0.02, snappedPos.z);
                outline.renderOrder = 1000;
                this.scene.add(outline);
                this.areaPreviewMeshes.push(outline);
            }
        }
    }
    
    placeArea(type, startPos, endPos) {
        // Calculate rectangle bounds
        const minX = Math.min(startPos.x, endPos.x);
        const maxX = Math.max(startPos.x, endPos.x);
        const minZ = Math.min(startPos.z, endPos.z);
        const maxZ = Math.max(startPos.z, endPos.z);
        
        let placedCount = 0;
        let blockedCount = 0;
        
        // Place in each tile in the area
        for (let x = minX; x <= maxX; x += this.gridSystem.cellSize) {
            for (let z = minZ; z <= maxZ; z += this.gridSystem.cellSize) {
                const pos = { x: x, y: 0, z: z };
                const result = this.placeModule(type, pos);
                if (result) {
                    placedCount++;
                } else {
                    blockedCount++;
                }
            }
        }
        
        if (placedCount > 0) {
            this.updateStatus(`Placed ${placedCount} ${type}(s)` + (blockedCount > 0 ? `, ${blockedCount} blocked` : ''));
        }
        
        // Clear area preview
        if (this.areaPreviewMeshes) {
            this.areaPreviewMeshes.forEach(mesh => this.scene.remove(mesh));
            this.areaPreviewMeshes = [];
        }
    }
    
    selectModule(module) {
        // Deselect previous
        if (this.selectedModule) {
            this.selectedModule.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((mat, idx) => {
                            const key = `originalEmissive_${idx}`;
                            if (mat.emissive && child.userData[key]) {
                                mat.emissive.copy(child.userData[key]);
                            }
                        });
                    } else if (child.material.emissive && child.userData.originalEmissive) {
                        child.material.emissive.copy(child.userData.originalEmissive);
                    }
                }
            });
            // Remove selection outline
            if (this.selectedModule.userData.selectionBox) {
                this.scene.remove(this.selectedModule.userData.selectionBox);
                this.selectedModule.userData.selectionBox = null;
            }
        }
        
        this.selectedModule = module;
        
        if (module) {
            // Highlight selected with emissive
            module.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((mat, idx) => {
                            if (mat.emissive) {
                                const key = `originalEmissive_${idx}`;
                                if (!child.userData[key]) {
                                    child.userData[key] = mat.emissive.clone();
                                }
                                mat.emissive.setHex(0x444444);
                            }
                        });
                    } else if (child.material.emissive) {
                        if (!child.userData.originalEmissive) {
                            child.userData.originalEmissive = child.material.emissive.clone();
                        }
                        child.material.emissive.setHex(0x444444);
                    }
                }
            });
            
            // Add selection box helper
            const box = new THREE.Box3().setFromObject(module);
            const boxHelper = new THREE.Box3Helper(box, 0x00ffff);
            boxHelper.userData.isSelectionHelper = true;
            this.scene.add(boxHelper);
            module.userData.selectionBox = boxHelper;
            
            this.ui.properties.showModule(module);
            this.updateStatus(`Selected ${module.type}`);
        } else {
            this.ui.properties.hideModule();
            this.updateStatus('Ready');
        }
    }
    
    deleteSelected() {
        if (!this.selectedModule) {
            this.updateStatus('No module selected to delete');
            return;
        }
        
        const module = this.selectedModule;
        const moduleType = module.type;
        
        // Remove selection box first
        if (module.userData.selectionBox) {
            this.scene.remove(module.userData.selectionBox);
            module.userData.selectionBox = null;
        }
        
        this.scene.remove(module);
        this.modules = this.modules.filter(m => m !== module);
        
        this.saveToHistory('remove', module);
        this.selectModule(null);
        this.updateModuleCount();
        this.storage.autoSave();
        this.updateStatus(`Deleted ${moduleType}`);
    }
    
    duplicateSelected() {
        if (!this.selectedModule) return;
        
        const original = this.selectedModule;
        const clone = original.clone();
        
        clone.position.x += 2;
        clone.position.z += 2;
        
        this.scene.add(clone);
        this.modules.push(clone);
        
        this.selectModule(clone);
        this.saveToHistory('add', clone);
        this.updateModuleCount();
        this.storage.autoSave();
    }
    
    copySelected() {
        if (!this.selectedModule) {
            this.updateStatus('No module selected to copy');
            return;
        }
        
        // Serialize the selected module to clipboard
        this.clipboard = this.serializeModule(this.selectedModule);
        this.updateStatus(`Copied ${this.selectedModule.type} to clipboard`);
    }
    
    pasteFromClipboard() {
        if (!this.clipboard) {
            this.updateStatus('Clipboard is empty');
            return;
        }
        
        // Create module from clipboard data
        const module = this.createModuleFromData(this.clipboard);
        if (!module) {
            this.updateStatus('Failed to paste from clipboard');
            return;
        }
        
        // Offset position slightly so it's visible
        module.position.x += 2;
        module.position.z += 2;
        module.uuid = THREE.MathUtils.generateUUID(); // New UUID for the copy
        
        // Check collision at new position
        const collision = this.checkCollision(module.position, module.type);
        if (collision) {
            this.updateStatus('Cannot paste here - position occupied');
            return;
        }
        
        this.scene.add(module);
        this.modules.push(module);
        
        this.selectModule(module);
        this.saveToHistory('add', module);
        this.updateModuleCount();
        this.storage.autoSave();
        this.updateStatus(`Pasted ${module.type} from clipboard`);
    }
    
    updateModule(module, property, value) {
        if (!module) return;
        
        let oldValue;
        if (property === 'color') {
            // Get current color from first mesh material
            module.traverse((child) => {
                if (child.isMesh && child.material && child.material.color) {
                    oldValue = child.material.color.getHex();
                    return true; // break traverse
                }
            });
            if (oldValue === undefined) oldValue = 0x888888;
        } else if (property === 'scale') {
            // Scale is stored in params, not in Object3D.scale
            oldValue = {
                x: module.params.width,
                y: module.params.height,
                z: module.params.depth
            };
        } else {
            oldValue = module[property].clone ? module[property].clone() : module[property];
        }
        
        switch(property) {
            case 'position':
                module.position.copy(value);
                break;
            case 'rotation':
                module.rotation.copy(value);
                break;
            case 'scale':
                module.setScale(value.x, value.y, value.z);
                break;
            case 'color':
                module.traverse((child) => {
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => {
                                if (mat.color) mat.color.setHex(value);
                            });
                        } else if (child.material.color) {
                            child.material.color.setHex(value);
                        }
                    }
                });
                // Also update params.color for serialization
                module.params.color = value;
                break;
        }
        
        this.saveToHistory('modify', module, { property, oldValue, newValue: value });
        this.storage.autoSave();
    }
    
    saveToHistory(action, module, data = {}) {
        // Remove any future history if we're not at the end
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        let command;
        switch(action) {
            case 'add':
                command = new AddCommand(this, this.serializeModule(module), module);
                break;
            case 'remove':
                command = new RemoveCommand(this, module);
                break;
            case 'modify':
                command = new ModifyCommand(this, module, data.property, data.oldValue, data.newValue);
                break;
            default:
                console.warn('Unknown action type:', action);
                return;
        }
        
        this.history.push(command);
        this.historyIndex++;
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.historyIndex--;
        }
    }
    
    undo() {
        if (this.historyIndex < 0) {
            this.updateStatus('Nothing to undo');
            return;
        }
        
        const command = this.history[this.historyIndex];
        command.undo();
        
        this.historyIndex--;
        this.updateModuleCount();
        this.updateStatus(`Undo: ${command.getDescription()}`);
        this.storage.autoSave();
    }
    
    redo() {
        if (this.historyIndex >= this.history.length - 1) {
            this.updateStatus('Nothing to redo');
            return;
        }
        
        this.historyIndex++;
        const command = this.history[this.historyIndex];
        command.do();
        
        this.updateModuleCount();
        this.updateStatus(`Redo: ${command.getDescription()}`);
        this.storage.autoSave();
    }
    
    applyModuleProperty(module, property, value) {
        switch(property) {
            case 'position':
                if (value.clone) {
                    module.position.copy(value);
                } else {
                    module.position.fromArray(value);
                }
                break;
            case 'rotation':
                if (value.clone) {
                    module.rotation.copy(value);
                } else {
                    module.rotation.fromArray(value);
                }
                break;
            case 'scale':
                if (value.x !== undefined) {
                    module.setScale(value.x, value.y, value.z);
                } else {
                    module.setScale(value[0], value[1], value[2]);
                }
                break;
            case 'color':
                module.traverse((child) => {
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => {
                                if (mat.color) mat.color.setHex(value);
                            });
                        } else if (child.material.color) {
                            child.material.color.setHex(value);
                        }
                    }
                });
                // Also update params.color for serialization
                module.params.color = value;
                break;
        }
    }
    
    serializeModule(module) {
        // Delegate to module's serialize method (single source of truth)
        return module.serialize();
    }
    
    createModuleFromData(data) {
        // Delegate to Storage's implementation (single source of truth)
        return this.storage.createModuleFromData(data);
    }
    
    newShip() {
        if (!confirm('Create new ship? Unsaved changes will be lost.')) return;
        
        this.modules.forEach(m => this.scene.remove(m));
        this.modules = [];
        this.selectModule(null);
        this.gridSystem.reset();
        this.currentFloor = 0;
        this.history = [];
        this.historyIndex = -1;
        this.clipboard = null;
        this.updateModuleCount();
        this.updateFloorDisplay();
        this.storage.clearAutoSave();
        this.updateStatus('New ship created');
    }
    
    save() {
        this.storage.save();
        this.updateStatus('Ship saved to localStorage');
    }
    
    load() {
        this.storage.load();
        this.updateStatus('Ship loaded from localStorage');
    }
    
    exportJSON() {
        this.storage.exportJSON();
        this.updateStatus('Ship exported to JSON');
    }
    
    importJSON(event) {
        this.storage.importJSON(event);
    }
    
    toggleGrid() {
        this.gridSystem.toggle();
        this.updateStatus(`Grid ${this.gridSystem.visible ? 'shown' : 'hidden'}`);
    }
    
    resetCamera() {
        this.camera.position.set(30, 30, 30);
        this.camera.lookAt(0, 0, 0);
        this.controls.reset();
        this.updateStatus('Camera reset');
    }
    
    setCurrentFloor(floor) {
        this.currentFloor = floor;
        this.gridSystem.setCurrentFloor(floor);
        this.updateFloorDisplay();
        
        // Show/hide modules based on stored floor property
        this.modules.forEach(module => {
            module.visible = (module.floor === floor);
        });
    }
    
    addFloor(direction) {
        this.gridSystem.addFloor(direction);
        this.updateFloorDisplay();
        this.storage.autoSave();
        this.updateStatus(`Added floor ${direction === 'up' ? 'above' : 'below'}. Total floors: ${this.gridSystem.floors}`);
    }
    
    updateModuleCount() {
        const moduleCountEl = document.getElementById('module-count');
        if (moduleCountEl) {
            moduleCountEl.textContent = this.modules.length;
        }
    }
    
    updateFloorDisplay() {
        const floorCountEl = document.getElementById('floor-count');
        if (floorCountEl) {
            floorCountEl.textContent = this.gridSystem.floors;
        }
        if (this.ui.floors) {
            this.ui.floors.updateFloorList();
        }
    }
    
    updateStatus(text) {
        const statusEl = document.getElementById('status-text');
        if (statusEl) {
            statusEl.textContent = text;
        }
    }
    
    updateMousePosition(x, z) {
        const mousePosEl = document.getElementById('mouse-position');
        if (mousePosEl) {
            mousePosEl.textContent = `X: ${x.toFixed(1)}, Z: ${z.toFixed(1)}`;
        }
    }
}
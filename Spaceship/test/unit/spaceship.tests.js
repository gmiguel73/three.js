import * as THREE from 'three';
import { GridSystem } from '../../js/GridSystem.js';
import { ShipModule } from '../../js/modules/ShipModule.js';
import { Cockpit } from '../../js/modules/Cockpit.js';
import { Engine } from '../../js/modules/Engine.js';
import { Wing } from '../../js/modules/Wing.js';
import { CargoBay } from '../../js/modules/CargoBay.js';
import { FuelTank } from '../../js/modules/FuelTank.js';
import { FloorTile } from '../../js/modules/FloorTile.js';
import { getModuleMeta, createModule } from '../../js/modules/registry.js';
import { AddCommand } from '../../js/commands/AddCommand.js';
import { RemoveCommand } from '../../js/commands/RemoveCommand.js';
import { ModifyCommand } from '../../js/commands/ModifyCommand.js';

// Side-effect imports — populate MODULE_REGISTRY with the remaining modules
// not already imported as named bindings above. main.js does the same.
import '../../js/modules/Connector.js';
import '../../js/modules/Habitation.js';
import '../../js/modules/Weapon.js';
import '../../js/modules/Sensor.js';
import '../../js/modules/Shield.js';

QUnit.module('Spaceship Builder', () => {
    
    QUnit.module('GridSystem', () => {
        
        QUnit.test('constructor initializes with correct defaults', (assert) => {
            const grid = new GridSystem();
            assert.equal(grid.width, 20, 'Default width is 20');
            assert.equal(grid.length, 40, 'Default length is 40');
            assert.equal(grid.floors, 1, 'Default floors is 1');
            assert.equal(grid.cellSize, 1, 'Cell size is 1');
        });
        
        QUnit.test('snapToGrid rounds to nearest integer', (assert) => {
            const grid = new GridSystem();
            
            let result = grid.snapToGrid({ x: 1.2, y: 0.7, z: 3.8 });
            assert.equal(result.x, 1, 'X snaps to 1');
            assert.equal(result.y, 1, 'Y snaps to 1');
            assert.equal(result.z, 4, 'Z snaps to 4');
            
            result = grid.snapToGrid({ x: -1.6, y: 2.3, z: -0.4 });
            assert.equal(result.x, -2, 'Negative X snaps correctly');
            assert.equal(result.y, 2, 'Y snaps correctly');
            assert.equal(result.z, 0, 'Negative small Z snaps to 0');
        });
        
        QUnit.test('isWithinBounds checks boundaries correctly', (assert) => {
            const grid = new GridSystem(20, 40, 1);
            
            assert.ok(grid.isWithinBounds({ x: 0, y: 0, z: 0 }), 'Origin is within bounds');
            assert.ok(grid.isWithinBounds({ x: 9, y: 0, z: 19 }), 'Near edge is within bounds');
            assert.ok(grid.isWithinBounds({ x: -10, y: 0, z: -20 }), 'Negative edge is within bounds');
            
            assert.notOk(grid.isWithinBounds({ x: 11, y: 0, z: 0 }), 'X out of bounds');
            assert.notOk(grid.isWithinBounds({ x: 0, y: 0, z: 21 }), 'Z out of bounds');
            assert.notOk(grid.isWithinBounds({ x: 0, y: 2, z: 0 }), 'Y out of bounds (only 1 floor)');
        });
        
        QUnit.test('addFloor increases floor count', (assert) => {
            const grid = new GridSystem(20, 40, 1);
            assert.equal(grid.floors, 1, 'Starts with 1 floor');
            
            grid.addFloor('up');
            assert.equal(grid.floors, 2, 'After adding floor up');
            
            grid.addFloor('up');
            assert.equal(grid.floors, 3, 'After adding second floor');
        });
        
        QUnit.test('serialize and deserialize preserve state', (assert) => {
            const grid1 = new GridSystem(25, 50, 3);
            grid1.currentFloor = 2;
            
            const data = grid1.serialize();
            assert.equal(data.width, 25, 'Serialized width');
            assert.equal(data.length, 50, 'Serialized length');
            assert.equal(data.floors, 3, 'Serialized floors');
            assert.equal(data.currentFloor, 2, 'Serialized current floor');
            
            const grid2 = new GridSystem();
            grid2.deserialize(data);
            assert.equal(grid2.width, 25, 'Deserialized width');
            assert.equal(grid2.length, 50, 'Deserialized length');
            assert.equal(grid2.floors, 3, 'Deserialized floors');
            assert.equal(grid2.currentFloor, 2, 'Deserialized current floor');
        });
    });
    
    QUnit.module('ShipModule', () => {
        
        QUnit.test('base module initializes correctly', (assert) => {
            const module = new ShipModule('test');
            assert.equal(module.type, 'test', 'Type is set');
            assert.equal(module.params.width, 1, 'Default width');
            assert.equal(module.params.height, 1, 'Default height');
            assert.equal(module.params.depth, 1, 'Default depth');
        });
        
        QUnit.test('setScale updates dimensions', (assert) => {
            const module = new ShipModule('test');
            module.setScale(3, 4, 5);
            
            assert.equal(module.params.width, 3, 'Width updated');
            assert.equal(module.params.height, 4, 'Height updated');
            assert.equal(module.params.depth, 5, 'Depth updated');
        });
        
        QUnit.test('setScale clamps to valid range', (assert) => {
            const module = new ShipModule('test');
            
            module.setScale(0, 15, -5);
            assert.equal(module.params.width, 1, 'Min clamped to 1');
            assert.equal(module.params.height, 10, 'Max clamped to 10');
            assert.equal(module.params.depth, 1, 'Negative clamped to 1');
        });
        
        QUnit.test('serialize preserves module data', (assert) => {
            const module = new ShipModule('test', { width: 2, height: 3, depth: 4, color: 0xff0000 });
            module.position.set(5, 1, 10);
            module.rotation.set(0, Math.PI/2, 0);
            
            const data = module.serialize();
            assert.equal(data.type, 'test', 'Type preserved');
            assert.deepEqual(data.position, [5, 1, 10], 'Position preserved');
            assert.equal(data.params.width, 2, 'Width preserved');
            assert.equal(data.params.color, 0xff0000, 'Color preserved');
        });
    });
    
    QUnit.module('Cockpit Module', () => {
        
        QUnit.test('cockpit creates with correct type', (assert) => {
            const cockpit = new Cockpit();
            assert.equal(cockpit.type, 'cockpit', 'Type is cockpit');
            assert.ok(cockpit.children.length > 0, 'Has geometry');
        });
        
        QUnit.test('cockpit scales window count with width', (assert) => {
            // Window panes are PlaneGeometry meshes tinted 0x4488ff. The top
            // viewport shares the color but uses CircleGeometry — filter on
            // geometry type to count windows only.
            const isWindow = (c) =>
                c.geometry?.type === 'PlaneGeometry' &&
                c.material?.color?.getHex() === 0x4488ff;

            const small = new Cockpit({ width: 1, height: 1, depth: 1 });
            const smallWindows = small.children.filter(isWindow).length;

            const large = new Cockpit({ width: 6, height: 1, depth: 1 });
            const largeWindows = large.children.filter(isWindow).length;

            assert.ok(largeWindows > smallWindows, 'Larger cockpit has more windows');
            assert.equal(smallWindows, 1, 'Small cockpit has 1 window');
            assert.ok(largeWindows >= 3, 'Large cockpit has 3+ windows');
        });
        
        QUnit.test('cockpit update rebuilds geometry', (assert) => {
            const cockpit = new Cockpit({ width: 2, height: 2, depth: 2 });
            const initialChildCount = cockpit.children.length;
            
            cockpit.setScale(4, 2, 2);
            const updatedChildCount = cockpit.children.length;
            
            assert.ok(updatedChildCount > initialChildCount, 'More children after scaling up');
            assert.equal(cockpit.params.width, 4, 'Width updated');
        });
    });
    
    QUnit.module('Engine Module', () => {
        
        QUnit.test('engine creates with correct type', (assert) => {
            const engine = new Engine();
            assert.equal(engine.type, 'engine', 'Type is engine');
            assert.ok(engine.children.length >= 4, 'Has housing, nozzle, glow, and fins');
        });
        
        QUnit.test('engine fin count scales with width', (assert) => {
            const small = new Engine({ width: 1, height: 1, depth: 2 });
            const large = new Engine({ width: 4, height: 1, depth: 2 });
            
            // Count fins (they are small boxes around the engine)
            const smallFins = small.children.filter(c => 
                c.geometry && c.geometry.type === 'BoxGeometry' && c.position.x !== 0
            ).length;
            const largeFins = large.children.filter(c => 
                c.geometry && c.geometry.type === 'BoxGeometry' && c.position.x !== 0
            ).length;
            
            assert.ok(largeFins > smallFins, 'Larger engine has more fins');
        });
    });
    
    QUnit.module('Wing Module', () => {
        
        QUnit.test('wing creates with correct type', (assert) => {
            const wing = new Wing();
            assert.equal(wing.type, 'wing', 'Type is wing');
            assert.ok(wing.children.length > 0, 'Has geometry');
        });
        
        QUnit.test('wing panel lines scale with width', (assert) => {
            const small = new Wing({ width: 2, height: 0.2, depth: 3 });
            const large = new Wing({ width: 6, height: 0.2, depth: 3 });
            
            // Wings should have more panel lines when wider
            assert.ok(large.children.length >= small.children.length, 'Larger wing has more or equal children');
        });
    });
    
    QUnit.module('CargoBay Module', () => {
        
        QUnit.test('cargo bay creates hollow structure', (assert) => {
            const cargo = new CargoBay({ width: 4, height: 2, depth: 3 });
            assert.equal(cargo.type, 'cargo', 'Type is cargo');
            // Should have floor, ceiling, 3 walls, and door panels
            assert.ok(cargo.children.length >= 6, 'Has multiple parts for hollow structure');
        });
        
        QUnit.test('cargo bay door panels scale with width', (assert) => {
            const small = new CargoBay({ width: 2, height: 2, depth: 2 });
            const large = new CargoBay({ width: 6, height: 2, depth: 2 });
            
            assert.ok(large.children.length > small.children.length, 'Wider cargo bay has more door panels');
        });
    });
    
    QUnit.module('FuelTank Module', () => {
        
        QUnit.test('fuel tank creates with correct type', (assert) => {
            const tank = new FuelTank();
            assert.equal(tank.type, 'fuel', 'Type is fuel');
            assert.ok(tank.children.length > 0, 'Has geometry');
        });
        
        QUnit.test('fuel tank bands scale with height', (assert) => {
            const short = new FuelTank({ width: 2, height: 2, depth: 2 });
            const tall = new FuelTank({ width: 2, height: 6, depth: 2 });
            
            // Count torus geometries (the bands)
            const shortBands = short.children.filter(c => 
                c.geometry && c.geometry.type === 'TorusGeometry'
            ).length;
            const tallBands = tall.children.filter(c => 
                c.geometry && c.geometry.type === 'TorusGeometry'
            ).length;
            
            assert.ok(tallBands > shortBands, 'Taller tank has more bands');
        });
    });
    
    QUnit.module('FloorTile Module', () => {
        
        QUnit.test('floor tile creates with correct type', (assert) => {
            const tile = new FloorTile();
            assert.equal(tile.type, 'floor', 'Type is floor');
            assert.ok(tile.children.length > 0, 'Has geometry');
        });
        
        QUnit.test('floor tile is flat', (assert) => {
            const tile = new FloorTile({ width: 2, height: 1, depth: 2 });
            // Floor tiles should be thin (height is not used, they use fixed 0.1)
            assert.equal(tile.params.width, 2, 'Width is set');
            assert.equal(tile.params.depth, 2, 'Depth is set');
        });
    });
    
    QUnit.module('Module Registry', () => {
        
        QUnit.test('registry contains all module types', (assert) => {
            const types = ['floor', 'cockpit', 'engine', 'wing', 'cargo', 'fuel', 
                          'connector', 'habitation', 'weapon', 'sensor', 'shield'];
            types.forEach(type => {
                const meta = getModuleMeta(type);
                assert.ok(meta, `${type} is registered`);
                assert.ok(meta.name, `${type} has name`);
                assert.ok(meta.icon, `${type} has icon`);
            });
        });
        
        QUnit.test('createModule factory works', (assert) => {
            const cockpit = createModule('cockpit', { width: 2, height: 2, depth: 2 });
            assert.ok(cockpit, 'Created cockpit');
            assert.equal(cockpit.type, 'cockpit', 'Type is correct');
            assert.equal(cockpit.params.width, 2, 'Params passed through');
            
            const invalid = createModule('nonexistent');
            assert.equal(invalid, null, 'Invalid type returns null');
        });
    });
    
    QUnit.module('Serialize Round-trip', () => {
        
        QUnit.test('module serialize preserves all data', (assert) => {
            const original = new Cockpit({ 
                width: 4, 
                height: 3, 
                depth: 6, 
                color: 0xff0000 
            });
            original.position.set(5, 0.5, 10);
            original.rotation.set(0, Math.PI / 4, 0);
            original.floor = 1;
            
            const serialized = original.serialize();
            
            assert.equal(serialized.type, 'cockpit', 'Type preserved');
            assert.equal(serialized.floor, 1, 'Floor preserved');
            assert.deepEqual(serialized.position, [5, 0.5, 10], 'Position preserved');
            assert.equal(serialized.params.width, 4, 'Width preserved');
            assert.equal(serialized.params.height, 3, 'Height preserved');
            assert.equal(serialized.params.depth, 6, 'Depth preserved');
        });
        
        QUnit.test('serialize/deserialize round-trip preserves data', (assert) => {
            const original = new Engine({ width: 3, height: 2, depth: 4 });
            original.position.set(2, 0.5, 3);
            original.rotation.set(Math.PI / 2, 0, 0);
            original.floor = 2;
            
            // Simulate serialize/deserialize
            const serialized = original.serialize();
            const restored = createModule(serialized.type, serialized.params);
            restored.position.fromArray(serialized.position);
            restored.rotation.fromArray(serialized.rotation);
            restored.floor = serialized.floor;
            
            assert.equal(restored.type, original.type, 'Type matches');
            assert.equal(restored.floor, original.floor, 'Floor matches');
            assert.equal(restored.params.width, original.params.width, 'Width matches');
            assert.deepEqual(
                restored.position.toArray().map(v => Math.round(v * 10) / 10),
                original.position.toArray().map(v => Math.round(v * 10) / 10),
                'Position matches'
            );
        });
        
        QUnit.test('floor property is serialized', (assert) => {
            const floorTile = new FloorTile({ width: 1, height: 1, depth: 1 });
            floorTile.floor = 3;
            
            const serialized = floorTile.serialize();
            assert.equal(serialized.floor, 3, 'Floor property included in serialization');
            assert.equal(serialized.type, 'floor', 'Type is floor');
        });
        
        QUnit.test('setScale updates params correctly', (assert) => {
            const module = new Cockpit({ width: 2, height: 2, depth: 2 });
            module.setScale(5, 3, 4);
            
            assert.equal(module.params.width, 5, 'Width updated');
            assert.equal(module.params.height, 3, 'Height updated');
            assert.equal(module.params.depth, 4, 'Depth updated');
        });
        
        QUnit.test('setScale clamps values to valid range', (assert) => {
            const module = new Cockpit();
            module.setScale(0, 15, -5);
            
            assert.equal(module.params.width, 1, 'Min clamped to 1');
            assert.equal(module.params.height, 10, 'Max clamped to 10');
            assert.equal(module.params.depth, 1, 'Negative clamped to 1');
        });
        
        QUnit.test('setScale handles NaN inputs', (assert) => {
            const module = new Cockpit({ width: 2, height: 2, depth: 2 });
            module.setScale(NaN, Infinity, -Infinity);

            assert.equal(module.params.width, 1, 'NaN width defaults to 1');
            assert.equal(module.params.height, 1, 'Infinity height defaults to 1');
            assert.equal(module.params.depth, 1, '-Infinity depth defaults to 1');
        });
    });

    QUnit.module('Undo / Redo (Commands)', () => {

        // Minimal stand-in for SpaceshipBuilder. Only implements the surface
        // the Command classes touch — anything else is intentionally absent so
        // tests fail loudly if commands start reaching for new builder methods.
        function makeStubBuilder() {
            const scene = new THREE.Scene();
            return {
                scene,
                modules: [],
                selectedModule: null,
                selectModule(m) { this.selectedModule = m; },
                serializeModule(m) { return m.serialize(); },
                createModuleFromData(data) {
                    const m = createModule(data.type, data.params);
                    if (m) {
                        m.position.fromArray(data.position);
                        m.rotation.fromArray(data.rotation);
                        m.floor = data.floor || 0;
                    }
                    return m;
                },
                applyCalls: [],
                applyModuleProperty(module, property, value) {
                    this.applyCalls.push({ moduleId: module.uuid, property, value });
                    if (property === 'scale') {
                        const v = value.x !== undefined ? value : { x: value[0], y: value[1], z: value[2] };
                        module.setScale(v.x, v.y, v.z);
                    }
                }
            };
        }

        QUnit.test('AddCommand: undo after place removes the original module', (assert) => {
            // Regression for the bug where placeModule()'s AddCommand had
            // this.module = null, so the first undo silently no-op'd.
            const builder = makeStubBuilder();
            const m = createModule('cockpit');

            // Mirror placeModule(): caller adds to scene + modules, then logs the command.
            builder.scene.add(m);
            builder.modules.push(m);
            const cmd = new AddCommand(builder, m.serialize(), m);

            assert.equal(builder.modules.length, 1, 'Module in modules before undo');
            assert.equal(builder.scene.children.length, 1, 'Module in scene before undo');

            cmd.undo();

            assert.equal(builder.modules.length, 0, 'Module removed from modules after undo');
            assert.equal(builder.scene.children.length, 0, 'Module removed from scene after undo');
        });

        QUnit.test('AddCommand: undo→redo restores the SAME instance, no duplicate', (assert) => {
            // Regression for the secondary corruption: when the original instance
            // was untracked, redo would createModule() a new one with the same
            // uuid, leaving two copies in the scene.
            const builder = makeStubBuilder();
            const m = createModule('engine');
            builder.scene.add(m);
            builder.modules.push(m);
            const cmd = new AddCommand(builder, m.serialize(), m);

            cmd.undo();
            cmd.do();

            assert.equal(builder.modules.length, 1, 'Exactly one module after undo→redo');
            assert.strictEqual(builder.modules[0], m, 'Same instance restored, not a duplicate');
        });

        QUnit.test('AddCommand: undo clears selection if the removed module was selected', (assert) => {
            const builder = makeStubBuilder();
            const m = createModule('wing');
            builder.scene.add(m);
            builder.modules.push(m);
            builder.selectedModule = m;
            const cmd = new AddCommand(builder, m.serialize(), m);

            cmd.undo();

            assert.equal(builder.selectedModule, null, 'Selection cleared');
        });

        QUnit.test('RemoveCommand: undo restores the deleted module', (assert) => {
            const builder = makeStubBuilder();
            const m = createModule('fuel');
            builder.scene.add(m);
            builder.modules.push(m);

            // Mirror deleteSelected(): caller removes, then logs the command.
            const cmd = new RemoveCommand(builder, m);
            builder.scene.remove(m);
            builder.modules = builder.modules.filter(x => x !== m);

            assert.equal(builder.modules.length, 0, 'Module gone before undo');

            cmd.undo();

            assert.equal(builder.modules.length, 1, 'Module restored after undo');
            assert.strictEqual(builder.modules[0], m, 'Same instance restored');
        });

        QUnit.test('RemoveCommand: undo→redo removes the module again by uuid', (assert) => {
            const builder = makeStubBuilder();
            const m = createModule('cargo');
            builder.scene.add(m);
            builder.modules.push(m);
            const cmd = new RemoveCommand(builder, m);
            builder.scene.remove(m);
            builder.modules = builder.modules.filter(x => x !== m);

            cmd.undo();
            cmd.do();

            assert.equal(builder.modules.length, 0, 'Module removed again on redo');
        });

        QUnit.test('ModifyCommand (scale): undo restores params, redo applies new scale', (assert) => {
            // Regression for the round-2 fix: oldValue must come from
            // params.{width,height,depth}, NOT from THREE.Object3D.scale (which
            // is always (1,1,1) since we resize by rebuilding geometry).
            const builder = makeStubBuilder();
            const m = createModule('cargo', { width: 5, height: 5, depth: 5 });
            builder.modules.push(m);

            const oldValue = { x: 5, y: 5, z: 5 };  // shape that updateModule() now produces
            const newValue = { x: 2, y: 2, z: 2 };
            const cmd = new ModifyCommand(builder, m, 'scale', oldValue, newValue);

            cmd.undo();
            assert.equal(m.params.width, 5, 'undo restores width to 5');
            assert.equal(m.params.height, 5, 'undo restores height to 5');
            assert.equal(m.params.depth, 5, 'undo restores depth to 5');

            cmd.do();
            assert.equal(m.params.width, 2, 'redo applies width 2');
            assert.equal(m.params.depth, 2, 'redo applies depth 2');
        });

        QUnit.test('ModifyCommand (color): undo dispatches old color, redo dispatches new', (assert) => {
            const builder = makeStubBuilder();
            const m = createModule('shield', { color: 0xff0000 });
            builder.modules.push(m);

            const cmd = new ModifyCommand(builder, m, 'color', 0xff0000, 0x00ff00);

            cmd.undo();
            const undoCall = builder.applyCalls[builder.applyCalls.length - 1];
            assert.equal(undoCall.property, 'color', 'undo dispatches color property');
            assert.equal(undoCall.value, 0xff0000, 'undo applies old hex');

            cmd.do();
            const doCall = builder.applyCalls[builder.applyCalls.length - 1];
            assert.equal(doCall.value, 0x00ff00, 'redo applies new hex');
        });

        QUnit.test('ModifyCommand (position): cloneValue isolates the captured Vector3 from later mutation', (assert) => {
            const builder = makeStubBuilder();
            const m = createModule('engine');
            builder.modules.push(m);

            const livePos = new THREE.Vector3(1, 0.5, 2);
            const cmd = new ModifyCommand(builder, m, 'position', livePos, new THREE.Vector3(5, 0.5, 5));

            // Mutate the original after construction — the command must not see this.
            livePos.set(99, 99, 99);

            cmd.undo();
            const undoCall = builder.applyCalls[builder.applyCalls.length - 1];
            assert.equal(undoCall.value.x, 1, 'oldValue x captured at construction time');
            assert.equal(undoCall.value.z, 2, 'oldValue z captured at construction time');
        });
    });
});
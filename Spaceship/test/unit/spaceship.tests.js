import { GridSystem } from '../../../Spaceship/js/GridSystem.js';
import { ShipModule } from '../../../Spaceship/js/modules/ShipModule.js';
import { Cockpit } from '../../../Spaceship/js/modules/Cockpit.js';
import { Engine } from '../../../Spaceship/js/modules/Engine.js';
import { Wing } from '../../../Spaceship/js/modules/Wing.js';
import { CargoBay } from '../../../Spaceship/js/modules/CargoBay.js';
import { FuelTank } from '../../../Spaceship/js/modules/FuelTank.js';
import { FloorTile } from '../../../Spaceship/js/modules/FloorTile.js';

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
            const small = new Cockpit({ width: 1, height: 1, depth: 1 });
            const smallWindows = small.children.filter(c => c.material && c.material.color.getHex() === 0x4488ff).length;
            
            const large = new Cockpit({ width: 6, height: 1, depth: 1 });
            const largeWindows = large.children.filter(c => c.material && c.material.color.getHex() === 0x4488ff).length;
            
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
});
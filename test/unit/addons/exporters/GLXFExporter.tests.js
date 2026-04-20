import { GLXFExporter } from '../../../../examples/jsm/exporters/GLXFExporter.js';
import {
	BoxGeometry,
	Group,
	Mesh,
	MeshStandardMaterial,
	Scene,
	SphereGeometry,
} from '../../../../src/Three.js';

export default QUnit.module( 'Addons', () => {

	QUnit.module( 'Exporters', () => {

		QUnit.module( 'GLXFExporter', () => {

			QUnit.test( 'methods', ( assert ) => {

				const exporter = new GLXFExporter();
				assert.ok(
					exporter instanceof GLXFExporter,
					'GLXFExporter can be instantiated'
				);
				assert.ok(
					typeof exporter.parseAsync === 'function',
					'parseAsync method exists'
				);
				assert.ok(
					typeof exporter.parse === 'function',
					'parse method exists'
				);

			} );

			QUnit.test( 'export basic scene', async ( assert ) => {

				const exporter = new GLXFExporter();
				const scene = new Scene();
				scene.name = 'TestScene';
				const mesh = new Mesh(
					new BoxGeometry( 1, 1, 1 ),
					new MeshStandardMaterial()
				);
				mesh.name = 'Box';
				mesh.userData.glxfURI = 'models/box.gltf';
				scene.add( mesh );

				const result = await exporter.parseAsync( scene );

				assert.ok( typeof result.glxf === 'string', 'glxf is a string' );
				assert.ok( result.assets instanceof Map, 'assets is a Map' );

				const glxf = JSON.parse( result.glxf );

				assert.equal( glxf.asset.version, '2.0', 'Version is 2.0' );
				assert.ok( glxf.asset.generator.includes( 'GLXFExporter' ), 'Generator set' );
				assert.ok( glxf.assets.length > 0, 'Has at least one asset' );
				assert.ok( glxf.nodes.length > 0, 'Has at least one node' );
				assert.ok( glxf.scenes.length > 0, 'Has at least one scene' );
				assert.equal( glxf.scene, 0, 'Default scene is 0' );

			} );

			QUnit.test( 'experience flag', async ( assert ) => {

				const exporter = new GLXFExporter();
				const scene = new Scene();
				const mesh = new Mesh( new BoxGeometry(), new MeshStandardMaterial() );
				mesh.userData.glxfURI = 'test.gltf';
				scene.add( mesh );

				const resultTrue = await exporter.parseAsync( scene, { experience: true } );
				const glxfTrue = JSON.parse( resultTrue.glxf );
				assert.strictEqual( glxfTrue.asset.experience, true, 'experience=true is set' );

				const resultFalse = await exporter.parseAsync( scene, { experience: false } );
				const glxfFalse = JSON.parse( resultFalse.glxf );
				assert.strictEqual( glxfFalse.asset.experience, undefined, 'experience=false omits the flag' );

			} );

			QUnit.test( 'spec constraints', async ( assert ) => {

				const exporter = new GLXFExporter();
				const scene = new Scene();
				const mesh = new Mesh( new BoxGeometry(), new MeshStandardMaterial() );
				mesh.userData.glxfURI = 'test.gltf';
				scene.add( mesh );

				const result = await exporter.parseAsync( scene );
				const glxf = JSON.parse( result.glxf );

				const forbidden = [
					'buffers', 'bufferViews', 'accessors', 'meshes',
					'skins', 'textures', 'images', 'samplers', 'materials', 'animations'
				];

				for ( const key of forbidden ) {

					assert.strictEqual( glxf[ key ], undefined, 'glXF must not contain "' + key + '"' );

				}

				for ( const node of glxf.nodes ) {

					assert.strictEqual( node.mesh, undefined, 'Node must not have "mesh" property' );
					assert.strictEqual( node.skin, undefined, 'Node must not have "skin" property' );
					assert.strictEqual( node.weights, undefined, 'Node must not have "weights" property' );

				}

			} );

			QUnit.test( 'manual URI assignment', async ( assert ) => {

				const exporter = new GLXFExporter();
				const scene = new Scene();
				const mesh = new Mesh( new BoxGeometry(), new MeshStandardMaterial() );
				mesh.name = 'Chair';
				mesh.userData.glxfURI = 'models/chair.gltf';
				mesh.userData.glxfScene = 'main';
				scene.add( mesh );

				const result = await exporter.parseAsync( scene );

				assert.equal( result.assets.size, 0, 'No .gltf files generated for external reference' );

				const glxf = JSON.parse( result.glxf );
				assert.equal( glxf.assets[ 0 ].uri, 'models/chair.gltf', 'Asset URI matches userData' );
				assert.equal( glxf.assets[ 0 ].scene, 'main', 'Asset scene property set' );

			} );

			QUnit.test( 'manual URI with glxfNodes and glxfTransform', async ( assert ) => {

				const exporter = new GLXFExporter();
				const scene = new Scene();
				const mesh = new Mesh( new BoxGeometry(), new MeshStandardMaterial() );
				mesh.name = 'Ball';
				mesh.userData.glxfURI = 'models/ball.gltf';
				mesh.userData.glxfNodes = [ 'ball_mesh' ];
				mesh.userData.glxfTransform = 'none';
				scene.add( mesh );

				const result = await exporter.parseAsync( scene );
				const glxf = JSON.parse( result.glxf );

				assert.deepEqual( glxf.assets[ 0 ].nodes, [ 'ball_mesh' ], 'Asset nodes property set' );
				assert.equal( glxf.assets[ 0 ].transform, 'none', 'Asset transform property set' );

			} );

			QUnit.test( 'export scene with groups', async ( assert ) => {

				const exporter = new GLXFExporter();
				const scene = new Scene();
				scene.name = 'GroupScene';

				const group = new Group();
				group.name = 'MyGroup';
				group.position.set( 1, 2, 3 );

				const mesh = new Mesh( new SphereGeometry(), new MeshStandardMaterial() );
				mesh.name = 'Sphere';
				mesh.userData.glxfURI = 'sphere.gltf';
				group.add( mesh );
				scene.add( group );

				const result = await exporter.parseAsync( scene );
				const glxf = JSON.parse( result.glxf );

				const groupNode = glxf.nodes.find( n => n.name === 'MyGroup' );
				assert.ok( groupNode, 'Group node exists' );
				assert.ok( Array.isArray( groupNode.children ), 'Group has children array' );
				assert.ok( groupNode.children.length > 0, 'Group has at least one child' );

				assert.deepEqual( groupNode.translation, [ 1, 2, 3 ], 'Group translation preserved' );

			} );

			QUnit.test( 'transform preservation', async ( assert ) => {

				const exporter = new GLXFExporter();
				const scene = new Scene();

				const mesh = new Mesh( new BoxGeometry(), new MeshStandardMaterial() );
				mesh.name = 'Transformed';
				mesh.userData.glxfURI = 'external.gltf';
				mesh.position.set( 5, 10, 15 );
				mesh.quaternion.set( 0, 0.707, 0, 0.707 );
				mesh.scale.set( 2, 2, 2 );
				scene.add( mesh );

				const result = await exporter.parseAsync( scene );
				const glxf = JSON.parse( result.glxf );

				const node = glxf.nodes.find( n => n.name === 'Transformed' );
				assert.ok( node, 'Node found' );
				assert.deepEqual( node.translation, [ 5, 10, 15 ], 'Translation correct' );
				assert.deepEqual( node.rotation, [ 0, 0.707, 0, 0.707 ], 'Rotation correct' );
				assert.deepEqual( node.scale, [ 2, 2, 2 ], 'Scale correct' );

			} );

			QUnit.test( 'identity transform omitted', async ( assert ) => {

				const exporter = new GLXFExporter();
				const scene = new Scene();

				const mesh = new Mesh( new BoxGeometry(), new MeshStandardMaterial() );
				mesh.name = 'Default';
				mesh.userData.glxfURI = 'external.gltf';
				scene.add( mesh );

				const result = await exporter.parseAsync( scene );
				const glxf = JSON.parse( result.glxf );

				const node = glxf.nodes.find( n => n.name === 'Default' );
				assert.strictEqual( node.translation, undefined, 'No translation for identity' );
				assert.strictEqual( node.rotation, undefined, 'No rotation for identity' );
				assert.strictEqual( node.scale, undefined, 'No scale for identity' );

			} );

			QUnit.test( 'subtree ownership warning', async ( assert ) => {

				const exporter = new GLXFExporter();
				const scene = new Scene();

				const parent = new Group();
				parent.name = 'Parent';
				parent.userData.glxfURI = 'models/parent.gltf';

				const child = new Mesh( new BoxGeometry(), new MeshStandardMaterial() );
				child.name = 'Child';
				child.userData.glxfURI = 'models/child.gltf';

				parent.add( child );
				scene.add( parent );

				const warnings = [];
				const originalWarn = console.warn;
				console.warn = function () {

					warnings.push( Array.prototype.join.call( arguments, ' ' ) );

				};

				await exporter.parseAsync( scene );

				console.warn = originalWarn;

				assert.ok( warnings.length > 0, 'Warning was logged' );
				assert.ok(
					warnings[ 0 ].indexOf( 'Child' ) !== - 1 && warnings[ 0 ].indexOf( 'Parent' ) !== - 1,
					'Warning mentions both child and parent names'
				);

			} );

			QUnit.test( 'subtree ownership uses parent URI', async ( assert ) => {

				const exporter = new GLXFExporter();
				const scene = new Scene();

				const parent = new Group();
				parent.name = 'Parent';
				parent.userData.glxfURI = 'models/parent.gltf';

				const child = new Mesh( new BoxGeometry(), new MeshStandardMaterial() );
				child.name = 'Child';
				child.userData.glxfURI = 'models/child.gltf';

				parent.add( child );
				scene.add( parent );

				const originalWarn = console.warn;
				console.warn = function () {};

				const result = await exporter.parseAsync( scene );

				console.warn = originalWarn;

				const glxf = JSON.parse( result.glxf );

				assert.equal( glxf.assets.length, 1, 'Only one asset registered' );
				assert.equal( glxf.assets[ 0 ].uri, 'models/parent.gltf', 'Parent URI used' );

				const childAsset = glxf.assets.find( a => a.uri === 'models/child.gltf' );
				assert.strictEqual( childAsset, undefined, 'Child URI was not registered' );

			} );

			QUnit.test( 'shared URI deduplication', async ( assert ) => {

				const exporter = new GLXFExporter();
				const scene = new Scene();

				const mesh1 = new Mesh( new BoxGeometry(), new MeshStandardMaterial() );
				mesh1.name = 'Instance1';
				mesh1.userData.glxfURI = 'models/shared.gltf';
				mesh1.position.set( 0, 0, 0 );

				const mesh2 = new Mesh( new BoxGeometry(), new MeshStandardMaterial() );
				mesh2.name = 'Instance2';
				mesh2.userData.glxfURI = 'models/shared.gltf';
				mesh2.position.set( 5, 0, 0 );

				scene.add( mesh1 );
				scene.add( mesh2 );

				const result = await exporter.parseAsync( scene );
				const glxf = JSON.parse( result.glxf );

				assert.equal( glxf.assets.length, 1, 'Shared URI produces one asset entry' );

				const node1 = glxf.nodes.find( n => n.name === 'Instance1' );
				const node2 = glxf.nodes.find( n => n.name === 'Instance2' );
				assert.equal( node1.asset, node2.asset, 'Both nodes reference the same asset index' );

			} );

			QUnit.test( 'multiple scenes', async ( assert ) => {

				const exporter = new GLXFExporter();
				const scene1 = new Scene();
				scene1.name = 'Scene1';
				const m1 = new Mesh( new BoxGeometry(), new MeshStandardMaterial() );
				m1.userData.glxfURI = 'a.gltf';
				scene1.add( m1 );

				const scene2 = new Scene();
				scene2.name = 'Scene2';
				const m2 = new Mesh( new SphereGeometry(), new MeshStandardMaterial() );
				m2.userData.glxfURI = 'b.gltf';
				scene2.add( m2 );

				const result = await exporter.parseAsync( [ scene1, scene2 ] );
				const glxf = JSON.parse( result.glxf );

				assert.equal( glxf.scenes.length, 2, 'Two scenes exported' );
				assert.equal( glxf.scenes[ 0 ].name, 'Scene1', 'First scene name' );
				assert.equal( glxf.scenes[ 1 ].name, 'Scene2', 'Second scene name' );

			} );

		} );

	} );

} );

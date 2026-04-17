import { Mesh } from '../../../../src/objects/Mesh.js';
import { Scene } from '../../../../src/scenes/Scene.js';
import { BoxGeometry } from '../../../../src/geometries/BoxGeometry.js';
import { MeshBasicMaterial } from '../../../../src/materials/MeshBasicMaterial.js';
import { ObjectLoader } from '../../../../src/loaders/ObjectLoader.js';

export default QUnit.module( 'Objects', () => {

	QUnit.module( 'ObjectExport', () => {

		// https://github.com/mrdoob/three.js/issues/22586
		QUnit.test( 'toJSON/parse round-trip preserves baked vertex transforms', ( assert ) => {

			const done = assert.async();

			const scene = new Scene();
			const material = new MeshBasicMaterial();
			const geometry = new BoxGeometry( 5, 5, 5 );

			geometry.translate( 10, 20, 10 );

			const sourcePos = geometry.getAttribute( 'position' ).clone();

			const mesh = new Mesh( geometry, material );
			scene.add( mesh );

			const jsonOutput = scene.toJSON();

			const loader = new ObjectLoader();
			loader.parse( jsonOutput, function ( parsed ) {

				const parsedMesh = parsed.children[ 0 ];
				assert.ok( parsedMesh.isMesh, 'Parsed child is a Mesh' );

				const parsedPos = parsedMesh.geometry.getAttribute( 'position' );

				assert.strictEqual( parsedPos.count, sourcePos.count, 'Vertex count matches after round-trip' );

				let maxError = 0;
				for ( let i = 0; i < sourcePos.count; i ++ ) {

					maxError = Math.max( maxError,
						Math.abs( parsedPos.getX( i ) - sourcePos.getX( i ) ),
						Math.abs( parsedPos.getY( i ) - sourcePos.getY( i ) ),
						Math.abs( parsedPos.getZ( i ) - sourcePos.getZ( i ) )
					);

				}

				assert.ok( maxError < 1e-6, 'Vertex positions survive round-trip (max error: ' + maxError + ')' );

				done();

			} );

		} );

	} );

} );

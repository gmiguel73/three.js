import { Curve } from '../../../../../src/extras/core/Curve.js';
import { CubicBezierCurve3 } from '../../../../../src/extras/curves/CubicBezierCurve3.js';
import { Vector3 } from '../../../../../src/math/Vector3.js';

export default QUnit.module( 'Extras', () => {

	QUnit.module( 'Core', () => {

		QUnit.module( 'Curve', () => {

			// INSTANCING
			QUnit.test( 'Instancing', ( assert ) => {

				const object = new Curve();
				assert.ok( object, 'Can instantiate a Curve.' );

			} );

			// PROPERTIES
			QUnit.test( 'type', ( assert ) => {

				const object = new Curve();
				assert.ok(
					object.type === 'Curve',
					'Curve.type should be Curve'
				);

			} );

			// PUBLIC
			QUnit.test( 'getCurvature/getCurvatureAt', ( assert ) => {

				const curve = new CubicBezierCurve3(
					new Vector3( 0, 0, 0 ),
					new Vector3( 5, 10, 0 ),
					new Vector3( 15, 10, 0 ),
					new Vector3( 20, 0, 0 )
				);

				const curvature = curve.getCurvature( 0.5 );
				assert.ok( typeof curvature === 'number' && isFinite( curvature ), 'getCurvature returns a finite number' );
				assert.ok( curvature > 0, 'Non-degenerate curve has positive curvature' );

				const curvatureAt = curve.getCurvatureAt( 0.5 );
				assert.ok( typeof curvatureAt === 'number' && isFinite( curvatureAt ), 'getCurvatureAt returns a finite number' );
				assert.ok( curvatureAt > 0, 'getCurvatureAt also positive for non-degenerate curve' );

			} );

			QUnit.test( 'getTorsion/getTorsionAt', ( assert ) => {

				const curve = new CubicBezierCurve3(
					new Vector3( 0, 0, 0 ),
					new Vector3( 5, 10, 3 ),
					new Vector3( 15, 10, - 3 ),
					new Vector3( 20, 0, 0 )
				);

				const torsion = curve.getTorsion( 0.5 );
				assert.ok( typeof torsion === 'number' && isFinite( torsion ), 'getTorsion returns a finite number' );

				const torsionAt = curve.getTorsionAt( 0.5 );
				assert.ok( typeof torsionAt === 'number' && isFinite( torsionAt ), 'getTorsionAt returns a finite number' );

				// Planar curve should have zero torsion
				const planar = new CubicBezierCurve3(
					new Vector3( 0, 0, 0 ),
					new Vector3( 5, 10, 0 ),
					new Vector3( 15, 10, 0 ),
					new Vector3( 20, 0, 0 )
				);

				assert.numEqual( planar.getTorsion( 0.5 ), 0, 'Planar curve has zero torsion' );

			} );

		} );

	} );

} );

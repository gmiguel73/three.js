import { NURBSCurve } from '../../../../examples/jsm/curves/NURBSCurve.js';
import { MathUtils } from '../../../../src/math/MathUtils.js';
import { Vector4 } from '../../../../src/math/Vector4.js';

export default QUnit.module( 'Extras', () => {

	QUnit.module( 'Curves', () => {

		QUnit.module( 'NURBSCurve', ( hooks ) => {

			let _nurbsCurve = undefined;

			hooks.before( function () {

				const nurbsControlPoints = [];
				const nurbsKnots = [];
				const nurbsDegree = 3;

				for ( let i = 0; i <= nurbsDegree; i ++ ) {

					nurbsKnots.push( 0 );

				}

				for ( let i = 0, j = 20; i < j; i ++ ) {

					const point = new Vector4( Math.random(), Math.random(), Math.random(), 1 );
					nurbsControlPoints.push( point );

					const knot = ( i + 1 ) / ( j - nurbsDegree );
					nurbsKnots.push( MathUtils.clamp( knot, 0, 1 ) );

				}

				 _nurbsCurve = new NURBSCurve( nurbsDegree, nurbsKnots, nurbsControlPoints );

			} );

			QUnit.test( 'toJSON', ( assert ) => {

				const json = _nurbsCurve.toJSON();

				assert.equal( json.degree, _nurbsCurve.degree, 'json.degree ok' );
				assert.deepEqual( json.knots, _nurbsCurve.knots, 'json.knots ok' );
				assert.deepEqual( json.controlPoints, _nurbsCurve.controlPoints.map( p => p.toArray() ), 'json.controlPoints ok' );
				assert.equal( json.startKnot, _nurbsCurve.startKnot, 'json.startKnot ok' );
				assert.equal( json.endKnot, _nurbsCurve.endKnot, 'json.endKnot ok' );

			} );

			QUnit.test( 'fromJSON', ( assert ) => {

				const json = _nurbsCurve.toJSON();
				const fromJson = new NURBSCurve().fromJSON( json );

				assert.equal( fromJson.degree, _nurbsCurve.degree, 'json.degree ok' );
				assert.deepEqual( fromJson.knots, _nurbsCurve.knots, 'json.knots ok' );
				assert.deepEqual( fromJson.controlPoints, _nurbsCurve.controlPoints, 'json.controlPoints ok' );
				assert.equal( fromJson.startKnot, _nurbsCurve.startKnot, 'json.startKnot ok' );
				assert.equal( fromJson.endKnot, _nurbsCurve.endKnot, 'json.endKnot ok' );

			} );

			QUnit.test( 'getCurvature/getTorsion', ( assert ) => {

				const curvature = _nurbsCurve.getCurvature( 0.5 );
				assert.ok( typeof curvature === 'number' && isFinite( curvature ), 'Curvature at midpoint is finite' );
				assert.ok( curvature >= 0, 'Curvature is non-negative' );

				const torsion = _nurbsCurve.getTorsion( 0.5 );
				assert.ok( typeof torsion === 'number' && isFinite( torsion ), 'Torsion at midpoint is finite' );

				// Straight line NURBS should have zero curvature
				const straightNurbs = new NURBSCurve(
					1,
					[ 0, 0, 1, 1 ],
					[ new Vector4( 0, 0, 0, 1 ), new Vector4( 10, 0, 0, 1 ) ]
				);
				assert.ok( Math.abs( straightNurbs.getCurvature( 0.5 ) ) < 1e-6, 'Straight NURBS has zero curvature' );

			} );

		} );

	} );

} );

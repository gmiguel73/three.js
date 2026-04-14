import { ArcCurve } from '../../../../../src/extras/curves/ArcCurve.js';

import { EllipseCurve } from '../../../../../src/extras/curves/EllipseCurve.js';

export default QUnit.module( 'Extras', () => {

	QUnit.module( 'Curves', () => {

		QUnit.module( 'ArcCurve', () => {

			// INHERITANCE
			QUnit.test( 'Extending', ( assert ) => {

				const object = new ArcCurve();
				assert.strictEqual(
					object instanceof EllipseCurve, true,
					'ArcCurve extends from EllipseCurve'
				);

			} );

			// INSTANCING
			QUnit.test( 'Instancing', ( assert ) => {

				const object = new ArcCurve();
				assert.ok( object, 'Can instantiate an ArcCurve.' );

			} );

			// PROPERTIES
			QUnit.test( 'type', ( assert ) => {

				const object = new ArcCurve();
				assert.ok(
					object.type === 'ArcCurve',
					'ArcCurve.type should be ArcCurve'
				);

			} );

			// PUBLIC
			QUnit.test( 'isArcCurve', ( assert ) => {

				const object = new ArcCurve();
				assert.ok(
					object.isArcCurve,
					'ArcCurve.isArcCurve should be true'
				);

			} );

			QUnit.test( 'getCurvature', ( assert ) => {

				const radius = 5;
				const arc = new ArcCurve( 0, 0, radius, 0, Math.PI * 2, false );
				const expectedCurvature = 1 / radius;

				assert.numEqual( arc.getCurvature( 0 ), expectedCurvature, 'Arc curvature at t=0 is 1/r' );
				assert.numEqual( arc.getCurvature( 0.5 ), expectedCurvature, 'Arc curvature at t=0.5 is 1/r' );
				assert.numEqual( arc.getCurvature( 0.75 ), expectedCurvature, 'Arc curvature at t=0.75 is 1/r' );

			} );

		} );

	} );

} );

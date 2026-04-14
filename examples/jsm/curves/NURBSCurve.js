import {
	Curve,
	Vector3,
	Vector4
} from 'three';
import * as NURBSUtils from '../curves/NURBSUtils.js';

/**
 * This class represents a NURBS curve.
 *
 * Implementation is based on `(x, y [, z=0 [, w=1]])` control points with `w=weight`.
 *
 * @augments Curve
 * @three_import import { NURBSCurve } from 'three/addons/curves/NURBSCurve.js';
 */
class NURBSCurve extends Curve {

	/**
	 * Constructs a new NURBS curve.
	 *
	 * @param {number} degree - The NURBS degree.
	 * @param {Array<number>} knots - The knots as a flat array of numbers.
	 * @param {Array<Vector2|Vector3|Vector4>} controlPoints - An array holding control points.
	 * @param {number} [startKnot] - Index of the start knot into the `knots` array.
	 * @param {number} [endKnot] - Index of the end knot into the `knots` array.
	 */
	constructor( degree, knots, controlPoints, startKnot, endKnot ) {

		super();

		const knotsLength = knots ? knots.length - 1 : 0;
		const pointsLength = controlPoints ? controlPoints.length : 0;

		/**
		 * The NURBS degree.
		 *
		 * @type {number}
		 */
		this.degree = degree;

		/**
		 * The knots as a flat array of numbers.
		 *
		 * @type {Array<number>}
		 */
		this.knots = knots;

		/**
		 * An array of control points.
		 *
		 * @type {Array<Vector4>}
		 */
		this.controlPoints = [];

		/**
		 * Index of the start knot into the `knots` array.
		 *
		 * @type {number}
		 */
		this.startKnot = startKnot || 0;

		/**
		 * Index of the end knot into the `knots` array.
		 *
		 * @type {number}
		 */
		this.endKnot = endKnot || knotsLength;

		for ( let i = 0; i < pointsLength; ++ i ) {

			// ensure Vector4 for control points
			const point = controlPoints[ i ];
			this.controlPoints[ i ] = new Vector4( point.x, point.y, point.z, point.w );

		}

	}

	/**
	 * This method returns a vector in 3D space for the given interpolation factor.
	 *
	 * @param {number} t - A interpolation factor representing a position on the curve. Must be in the range `[0,1]`.
	 * @param {Vector3} [optionalTarget] - The optional target vector the result is written to.
	 * @return {Vector3} The position on the curve.
	 */
	getPoint( t, optionalTarget = new Vector3() ) {

		const point = optionalTarget;

		const u = this.knots[ this.startKnot ] + t * ( this.knots[ this.endKnot ] - this.knots[ this.startKnot ] ); // linear mapping t->u

		// following results in (wx, wy, wz, w) homogeneous point
		const hpoint = NURBSUtils.calcBSplinePoint( this.degree, this.knots, this.controlPoints, u );

		if ( hpoint.w !== 1.0 ) {

			// project to 3D space: (wx, wy, wz, w) -> (x, y, z, 1)
			hpoint.divideScalar( hpoint.w );

		}

		return point.set( hpoint.x, hpoint.y, hpoint.z );

	}

	/**
	 * Returns a unit vector tangent for the given interpolation factor.
	 *
	 * @param {number} t - The interpolation factor.
	 * @param {Vector3} [optionalTarget] - The optional target vector the result is written to.
	 * @return {Vector3} The tangent vector.
	 */
	getTangent( t, optionalTarget = new Vector3() ) {

		const tangent = optionalTarget;

		const u = this.knots[ 0 ] + t * ( this.knots[ this.knots.length - 1 ] - this.knots[ 0 ] );
		const ders = NURBSUtils.calcNURBSDerivatives( this.degree, this.knots, this.controlPoints, u, 1 );
		tangent.copy( ders[ 1 ] ).normalize();

		return tangent;

	}

	getCurvature( t ) {

		const u = this.knots[ 0 ] + t * ( this.knots[ this.knots.length - 1 ] - this.knots[ 0 ] );
		const ders = NURBSUtils.calcNURBSDerivatives( this.degree, this.knots, this.controlPoints, u, 2 );

		const d1 = ders[ 1 ];
		const d2 = ders[ 2 ];

		const cx = d1.y * d2.z - d1.z * d2.y;
		const cy = d1.z * d2.x - d1.x * d2.z;
		const cz = d1.x * d2.y - d1.y * d2.x;

		const crossLen = Math.sqrt( cx * cx + cy * cy + cz * cz );
		const speed = d1.length();

		if ( speed < 1e-10 ) return 0;

		return crossLen / ( speed * speed * speed );

	}

	getTorsion( t ) {

		const u = this.knots[ 0 ] + t * ( this.knots[ this.knots.length - 1 ] - this.knots[ 0 ] );
		const ders = NURBSUtils.calcNURBSDerivatives( this.degree, this.knots, this.controlPoints, u, 3 );

		const d1 = ders[ 1 ];
		const d2 = ders[ 2 ];
		const d3 = ders[ 3 ];

		const cx = d1.y * d2.z - d1.z * d2.y;
		const cy = d1.z * d2.x - d1.x * d2.z;
		const cz = d1.x * d2.y - d1.y * d2.x;

		const crossLenSq = cx * cx + cy * cy + cz * cz;

		if ( crossLenSq < 1e-20 ) return 0;

		return ( cx * d3.x + cy * d3.y + cz * d3.z ) / crossLenSq;

	}

	toJSON() {

		const data = super.toJSON();

		data.degree = this.degree;
		data.knots = [ ...this.knots ];
		data.controlPoints = this.controlPoints.map( p => p.toArray() );
		data.startKnot = this.startKnot;
		data.endKnot = this.endKnot;

		return data;

	}

	fromJSON( json ) {

		super.fromJSON( json );

		this.degree = json.degree;
		this.knots = [ ...json.knots ];
		this.controlPoints = json.controlPoints.map( p => new Vector4( p[ 0 ], p[ 1 ], p[ 2 ], p[ 3 ] ) );
		this.startKnot = json.startKnot;
		this.endKnot = json.endKnot;

		return this;

	}

}

export { NURBSCurve };

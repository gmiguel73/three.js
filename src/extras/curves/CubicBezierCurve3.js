import { Curve } from '../core/Curve.js';
import { CubicBezier, CubicBezierDer1, CubicBezierDer2, CubicBezierDer3 } from '../core/Interpolations.js';
import { Vector3 } from '../../math/Vector3.js';

/**
 * A curve representing a 3D Cubic Bezier curve.
 *
 * @augments Curve
 */
class CubicBezierCurve3 extends Curve {

	/**
	 * Constructs a new Cubic Bezier curve.
	 *
	 * @param {Vector3} [v0] - The start point.
	 * @param {Vector3} [v1] - The first control point.
	 * @param {Vector3} [v2] - The second control point.
	 * @param {Vector3} [v3] - The end point.
	 */
	constructor( v0 = new Vector3(), v1 = new Vector3(), v2 = new Vector3(), v3 = new Vector3() ) {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isCubicBezierCurve3 = true;

		this.type = 'CubicBezierCurve3';

		/**
		 * The start point.
		 *
		 * @type {Vector3}
		 */
		this.v0 = v0;

		/**
		 * The first control point.
		 *
		 * @type {Vector3}
		 */
		this.v1 = v1;

		/**
		 * The second control point.
		 *
		 * @type {Vector3}
		 */
		this.v2 = v2;

		/**
		 * The end point.
		 *
		 * @type {Vector3}
		 */
		this.v3 = v3;

	}

	/**
	 * Returns a point on the curve.
	 *
	 * @param {number} t - A interpolation factor representing a position on the curve. Must be in the range `[0,1]`.
	 * @param {Vector3} [optionalTarget] - The optional target vector the result is written to.
	 * @return {Vector3} The position on the curve.
	 */
	getPoint( t, optionalTarget = new Vector3() ) {

		const point = optionalTarget;

		const v0 = this.v0, v1 = this.v1, v2 = this.v2, v3 = this.v3;

		point.set(
			CubicBezier( t, v0.x, v1.x, v2.x, v3.x ),
			CubicBezier( t, v0.y, v1.y, v2.y, v3.y ),
			CubicBezier( t, v0.z, v1.z, v2.z, v3.z )
		);

		return point;

	}

	getCurvature( t ) {

		const v0 = this.v0, v1 = this.v1, v2 = this.v2, v3 = this.v3;

		const dx = CubicBezierDer1( t, v0.x, v1.x, v2.x, v3.x );
		const dy = CubicBezierDer1( t, v0.y, v1.y, v2.y, v3.y );
		const dz = CubicBezierDer1( t, v0.z, v1.z, v2.z, v3.z );
		const ddx = CubicBezierDer2( t, v0.x, v1.x, v2.x, v3.x );
		const ddy = CubicBezierDer2( t, v0.y, v1.y, v2.y, v3.y );
		const ddz = CubicBezierDer2( t, v0.z, v1.z, v2.z, v3.z );

		const cx = dy * ddz - dz * ddy;
		const cy = dz * ddx - dx * ddz;
		const cz = dx * ddy - dy * ddx;

		const crossLen = Math.sqrt( cx * cx + cy * cy + cz * cz );
		const speed = Math.sqrt( dx * dx + dy * dy + dz * dz );

		if ( speed < 1e-10 ) return 0;

		return crossLen / ( speed * speed * speed );

	}

	getTorsion( t ) {

		const v0 = this.v0, v1 = this.v1, v2 = this.v2, v3 = this.v3;

		const dx = CubicBezierDer1( t, v0.x, v1.x, v2.x, v3.x );
		const dy = CubicBezierDer1( t, v0.y, v1.y, v2.y, v3.y );
		const dz = CubicBezierDer1( t, v0.z, v1.z, v2.z, v3.z );
		const ddx = CubicBezierDer2( t, v0.x, v1.x, v2.x, v3.x );
		const ddy = CubicBezierDer2( t, v0.y, v1.y, v2.y, v3.y );
		const ddz = CubicBezierDer2( t, v0.z, v1.z, v2.z, v3.z );
		const dddx = CubicBezierDer3( t, v0.x, v1.x, v2.x, v3.x );
		const dddy = CubicBezierDer3( t, v0.y, v1.y, v2.y, v3.y );
		const dddz = CubicBezierDer3( t, v0.z, v1.z, v2.z, v3.z );

		const cx = dy * ddz - dz * ddy;
		const cy = dz * ddx - dx * ddz;
		const cz = dx * ddy - dy * ddx;

		const crossLenSq = cx * cx + cy * cy + cz * cz;

		if ( crossLenSq < 1e-20 ) return 0;

		return ( cx * dddx + cy * dddy + cz * dddz ) / crossLenSq;

	}

	copy( source ) {

		super.copy( source );

		this.v0.copy( source.v0 );
		this.v1.copy( source.v1 );
		this.v2.copy( source.v2 );
		this.v3.copy( source.v3 );

		return this;

	}

	toJSON() {

		const data = super.toJSON();

		data.v0 = this.v0.toArray();
		data.v1 = this.v1.toArray();
		data.v2 = this.v2.toArray();
		data.v3 = this.v3.toArray();

		return data;

	}

	fromJSON( json ) {

		super.fromJSON( json );

		this.v0.fromArray( json.v0 );
		this.v1.fromArray( json.v1 );
		this.v2.fromArray( json.v2 );
		this.v3.fromArray( json.v3 );

		return this;

	}

}

export { CubicBezierCurve3 };

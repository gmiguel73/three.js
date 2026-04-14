import { clamp } from '../../math/MathUtils.js';
import { Vector2 } from '../../math/Vector2.js';
import { Vector3 } from '../../math/Vector3.js';
import { Matrix4 } from '../../math/Matrix4.js';
import { warn } from '../../utils.js';

/**
 * An abstract base class for creating an analytic curve object that contains methods
 * for interpolation.
 *
 * @abstract
 */
class Curve {

	/**
	 * Constructs a new curve.
	 */
	constructor() {

		/**
		 * The type property is used for detecting the object type
		 * in context of serialization/deserialization.
		 *
		 * @type {string}
		 * @readonly
		 */
		this.type = 'Curve';

		/**
		 * This value determines the amount of divisions when calculating the
		 * cumulative segment lengths of a curve via {@link Curve#getLengths}. To ensure
		 * precision when using methods like {@link Curve#getSpacedPoints}, it is
		 * recommended to increase the value of this property if the curve is very large.
		 *
		 * @type {number}
		 * @default 200
		 */
		this.arcLengthDivisions = 200;

		/**
		 * Must be set to `true` if the curve parameters have changed.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.needsUpdate = false;

		/**
		 * An internal cache that holds precomputed curve length values.
		 *
		 * @private
		 * @type {?Array<number>}
		 * @default null
		 */
		this.cacheArcLengths = null;

	}

	/**
	 * This method returns a vector in 2D or 3D space (depending on the curve definition)
	 * for the given interpolation factor.
	 *
	 * @abstract
	 * @param {number} t - A interpolation factor representing a position on the curve. Must be in the range `[0,1]`.
	 * @param {(Vector2|Vector3)} [optionalTarget] - The optional target vector the result is written to.
	 * @return {(Vector2|Vector3)} The position on the curve. It can be a 2D or 3D vector depending on the curve definition.
	 */
	getPoint( /* t, optionalTarget */ ) {

		warn( 'Curve: .getPoint() not implemented.' );

	}

	/**
	 * This method returns a vector in 2D or 3D space (depending on the curve definition)
	 * for the given interpolation factor. Unlike {@link Curve#getPoint}, this method honors the length
	 * of the curve which equidistant samples.
	 *
	 * @param {number} u - A interpolation factor representing a position on the curve. Must be in the range `[0,1]`.
	 * @param {(Vector2|Vector3)} [optionalTarget] - The optional target vector the result is written to.
	 * @return {(Vector2|Vector3)} The position on the curve. It can be a 2D or 3D vector depending on the curve definition.
	 */
	getPointAt( u, optionalTarget ) {

		const t = this.getUtoTmapping( u );
		return this.getPoint( t, optionalTarget );

	}

	/**
	 * This method samples the curve via {@link Curve#getPoint} and returns an array of points representing
	 * the curve shape.
	 *
	 * @param {number} [divisions=5] - The number of divisions.
	 * @return {Array<(Vector2|Vector3)>} An array holding the sampled curve values. The number of points is `divisions + 1`.
	 */
	getPoints( divisions = 5 ) {

		const points = [];

		for ( let d = 0; d <= divisions; d ++ ) {

			points.push( this.getPoint( d / divisions ) );

		}

		return points;

	}

	// Get sequence of points using getPointAt( u )

	/**
	 * This method samples the curve via {@link Curve#getPointAt} and returns an array of points representing
	 * the curve shape. Unlike {@link Curve#getPoints}, this method returns equi-spaced points across the entire
	 * curve.
	 *
	 * @param {number} [divisions=5] - The number of divisions.
	 * @return {Array<(Vector2|Vector3)>} An array holding the sampled curve values. The number of points is `divisions + 1`.
	 */
	getSpacedPoints( divisions = 5 ) {

		const points = [];

		for ( let d = 0; d <= divisions; d ++ ) {

			points.push( this.getPointAt( d / divisions ) );

		}

		return points;

	}

	/**
	 * Returns the total arc length of the curve.
	 *
	 * @return {number} The length of the curve.
	 */
	getLength() {

		const lengths = this.getLengths();
		return lengths[ lengths.length - 1 ];

	}

	/**
	 * Returns an array of cumulative segment lengths of the curve.
	 *
	 * @param {number} [divisions=this.arcLengthDivisions] - The number of divisions.
	 * @return {Array<number>} An array holding the cumulative segment lengths.
	 */
	getLengths( divisions = this.arcLengthDivisions ) {

		if ( this.cacheArcLengths &&
			( this.cacheArcLengths.length === divisions + 1 ) &&
			! this.needsUpdate ) {

			return this.cacheArcLengths;

		}

		this.needsUpdate = false;

		const cache = [];
		let current, last = this.getPoint( 0 );
		let sum = 0;

		cache.push( 0 );

		for ( let p = 1; p <= divisions; p ++ ) {

			current = this.getPoint( p / divisions );
			sum += current.distanceTo( last );
			cache.push( sum );
			last = current;

		}

		this.cacheArcLengths = cache;

		return cache; // { sums: cache, sum: sum }; Sum is in the last element.

	}

	/**
	 * Update the cumulative segment distance cache. The method must be called
	 * every time curve parameters are changed. If an updated curve is part of a
	 * composed curve like {@link CurvePath}, this method must be called on the
	 * composed curve, too.
	 */
	updateArcLengths() {

		this.needsUpdate = true;
		this.getLengths();

	}

	/**
	 * Given an interpolation factor in the range `[0,1]`, this method returns an updated
	 * interpolation factor in the same range that can be ued to sample equidistant points
	 * from a curve.
	 *
	 * @param {number} u - The interpolation factor.
	 * @param {?number} distance - An optional distance on the curve.
	 * @return {number} The updated interpolation factor.
	 */
	getUtoTmapping( u, distance = null ) {

		const arcLengths = this.getLengths();

		let i = 0;
		const il = arcLengths.length;

		let targetArcLength; // The targeted u distance value to get

		if ( distance ) {

			targetArcLength = distance;

		} else {

			targetArcLength = u * arcLengths[ il - 1 ];

		}

		// binary search for the index with largest value smaller than target u distance

		let low = 0, high = il - 1, comparison;

		while ( low <= high ) {

			i = Math.floor( low + ( high - low ) / 2 ); // less likely to overflow, though probably not issue here, JS doesn't really have integers, all numbers are floats

			comparison = arcLengths[ i ] - targetArcLength;

			if ( comparison < 0 ) {

				low = i + 1;

			} else if ( comparison > 0 ) {

				high = i - 1;

			} else {

				high = i;
				break;

				// DONE

			}

		}

		i = high;

		if ( arcLengths[ i ] === targetArcLength ) {

			return i / ( il - 1 );

		}

		// we could get finer grain at lengths, or use simple interpolation between two points

		const lengthBefore = arcLengths[ i ];
		const lengthAfter = arcLengths[ i + 1 ];

		const segmentLength = lengthAfter - lengthBefore;

		// determine where we are between the 'before' and 'after' points

		const segmentFraction = ( targetArcLength - lengthBefore ) / segmentLength;

		// add that fractional amount to t

		const t = ( i + segmentFraction ) / ( il - 1 );

		return t;

	}

	/**
	 * Returns a unit vector tangent for the given interpolation factor.
	 * If the derived curve does not implement its tangent derivation,
	 * two points a small delta apart will be used to find its gradient
	 * which seems to give a reasonable approximation.
	 *
	 * @param {number} t - The interpolation factor.
	 * @param {(Vector2|Vector3)} [optionalTarget] - The optional target vector the result is written to.
	 * @return {(Vector2|Vector3)} The tangent vector.
	 */
	getTangent( t, optionalTarget ) {

		const delta = 0.0001;
		let t1 = t - delta;
		let t2 = t + delta;

		// Capping in case of danger

		if ( t1 < 0 ) t1 = 0;
		if ( t2 > 1 ) t2 = 1;

		const pt1 = this.getPoint( t1 );
		const pt2 = this.getPoint( t2 );

		const tangent = optionalTarget || ( ( pt1.isVector2 ) ? new Vector2() : new Vector3() );

		tangent.copy( pt2 ).sub( pt1 ).normalize();

		return tangent;

	}

	/**
	 * Same as {@link Curve#getTangent} but with equidistant samples.
	 *
	 * @param {number} u - The interpolation factor.
	 * @param {(Vector2|Vector3)} [optionalTarget] - The optional target vector the result is written to.
	 * @return {(Vector2|Vector3)} The tangent vector.
	 * @see {@link Curve#getPointAt}
	 */
	getTangentAt( u, optionalTarget ) {

		const t = this.getUtoTmapping( u );
		return this.getTangent( t, optionalTarget );

	}

	/**
	 * Returns the curvature at the given interpolation factor.
	 * If the derived curve does not implement its own override,
	 * a numerical approximation via finite differences is used.
	 *
	 * For 2D curves, returns signed curvature (positive = counter-clockwise).
	 * For 3D curves, returns unsigned curvature (always >= 0).
	 *
	 * @param {number} t - The interpolation factor.
	 * @return {number} The curvature at the given point.
	 */
	getCurvature( t ) {

		const delta = 0.0001;

		const t0 = Math.max( t - delta, 0 );
		const t1 = t;
		const t2 = Math.min( t + delta, 1 );

		const p0 = this.getPoint( t0 );
		const p1 = this.getPoint( t1 );
		const p2 = this.getPoint( t2 );

		const dt01 = t1 - t0;
		const dt12 = t2 - t1;

		if ( p0.isVector2 ) {

			const dx1 = ( p1.x - p0.x ) / dt01;
			const dy1 = ( p1.y - p0.y ) / dt01;
			const dx2 = ( p2.x - p1.x ) / dt12;
			const dy2 = ( p2.y - p1.y ) / dt12;

			const dtAvg = ( dt01 + dt12 ) * 0.5;
			const ddx = ( dx2 - dx1 ) / dtAvg;
			const ddy = ( dy2 - dy1 ) / dtAvg;

			const dxAvg = ( dx1 + dx2 ) * 0.5;
			const dyAvg = ( dy1 + dy2 ) * 0.5;

			const speedSq = dxAvg * dxAvg + dyAvg * dyAvg;
			const speed = Math.sqrt( speedSq );

			if ( speed < 1e-10 ) return 0;

			return ( dxAvg * ddy - dyAvg * ddx ) / ( speedSq * speed );

		} else {

			const dx1 = ( p1.x - p0.x ) / dt01;
			const dy1 = ( p1.y - p0.y ) / dt01;
			const dz1 = ( p1.z - p0.z ) / dt01;
			const dx2 = ( p2.x - p1.x ) / dt12;
			const dy2 = ( p2.y - p1.y ) / dt12;
			const dz2 = ( p2.z - p1.z ) / dt12;

			const dtAvg = ( dt01 + dt12 ) * 0.5;
			const ddx = ( dx2 - dx1 ) / dtAvg;
			const ddy = ( dy2 - dy1 ) / dtAvg;
			const ddz = ( dz2 - dz1 ) / dtAvg;

			const dxAvg = ( dx1 + dx2 ) * 0.5;
			const dyAvg = ( dy1 + dy2 ) * 0.5;
			const dzAvg = ( dz1 + dz2 ) * 0.5;

			// cross product of first and second derivatives
			const cx = dyAvg * ddz - dzAvg * ddy;
			const cy = dzAvg * ddx - dxAvg * ddz;
			const cz = dxAvg * ddy - dyAvg * ddx;

			const crossLen = Math.sqrt( cx * cx + cy * cy + cz * cz );
			const speed = Math.sqrt( dxAvg * dxAvg + dyAvg * dyAvg + dzAvg * dzAvg );

			if ( speed < 1e-10 ) return 0;

			return crossLen / ( speed * speed * speed );

		}

	}

	/**
	 * Same as {@link Curve#getCurvature} but with equidistant samples.
	 *
	 * @param {number} u - The interpolation factor.
	 * @return {number} The curvature at the given point.
	 * @see {@link Curve#getPointAt}
	 */
	getCurvatureAt( u ) {

		const t = this.getUtoTmapping( u );
		return this.getCurvature( t );

	}

	/**
	 * Returns the torsion at the given interpolation factor.
	 * Torsion measures how a 3D curve twists out of its osculating plane.
	 * For 2D curves, torsion is always `0`.
	 *
	 * If the derived curve does not implement its own override,
	 * a numerical approximation via finite differences is used.
	 *
	 * @param {number} t - The interpolation factor.
	 * @return {number} The torsion at the given point.
	 */
	getTorsion( t ) {

		const p0 = this.getPoint( 0 );

		if ( p0.isVector2 ) return 0;

		const delta = 0.0001;

		const t0 = Math.max( t - delta, 0 );
		const t1 = Math.max( t - delta * 0.5, 0 );
		const t2 = Math.min( t + delta * 0.5, 1 );
		const t3 = Math.min( t + delta, 1 );

		const pa = this.getPoint( t0 );
		const pb = this.getPoint( t1 );
		const pc = this.getPoint( t2 );
		const pd = this.getPoint( t3 );

		const dt1 = t1 - t0 || 1e-10;
		const dt2 = t2 - t1 || 1e-10;
		const dt3 = t3 - t2 || 1e-10;

		// first derivatives at two half-step points
		const d1x_a = ( pb.x - pa.x ) / dt1;
		const d1y_a = ( pb.y - pa.y ) / dt1;
		const d1z_a = ( pb.z - pa.z ) / dt1;

		const d1x_b = ( pc.x - pb.x ) / dt2;
		const d1y_b = ( pc.y - pb.y ) / dt2;
		const d1z_b = ( pc.z - pb.z ) / dt2;

		const d1x_c = ( pd.x - pc.x ) / dt3;
		const d1y_c = ( pd.y - pc.y ) / dt3;
		const d1z_c = ( pd.z - pc.z ) / dt3;

		// first derivative (central)
		const d1x = ( d1x_a + d1x_b ) * 0.5;
		const d1y = ( d1y_a + d1y_b ) * 0.5;
		const d1z = ( d1z_a + d1z_b ) * 0.5;

		// second derivative
		const dtAvg12 = ( dt1 + dt2 ) * 0.5;
		const dtAvg23 = ( dt2 + dt3 ) * 0.5;
		const d2x = ( d1x_b - d1x_a ) / dtAvg12;
		const d2y = ( d1y_b - d1y_a ) / dtAvg12;
		const d2z = ( d1z_b - d1z_a ) / dtAvg12;

		// third derivative
		const d2x_b = ( d1x_c - d1x_b ) / dtAvg23;
		const d2y_b = ( d1y_c - d1y_b ) / dtAvg23;
		const d2z_b = ( d1z_c - d1z_b ) / dtAvg23;

		const dtAvg = ( dtAvg12 + dtAvg23 ) * 0.5;
		const d3x = ( d2x_b - d2x ) / dtAvg;
		const d3y = ( d2y_b - d2y ) / dtAvg;
		const d3z = ( d2z_b - d2z ) / dtAvg;

		// cross product r' x r''
		const cx = d1y * d2z - d1z * d2y;
		const cy = d1z * d2x - d1x * d2z;
		const cz = d1x * d2y - d1y * d2x;

		const crossLenSq = cx * cx + cy * cy + cz * cz;

		if ( crossLenSq < 1e-20 ) return 0;

		// torsion = (r' x r'') . r''' / |r' x r''|^2
		return ( cx * d3x + cy * d3y + cz * d3z ) / crossLenSq;

	}

	/**
	 * Same as {@link Curve#getTorsion} but with equidistant samples.
	 *
	 * @param {number} u - The interpolation factor.
	 * @return {number} The torsion at the given point.
	 * @see {@link Curve#getPointAt}
	 */
	getTorsionAt( u ) {

		const t = this.getUtoTmapping( u );
		return this.getTorsion( t );

	}

	/**
	 * Generates the Frenet Frames. Requires a curve definition in 3D space. Used
	 * in geometries like {@link TubeGeometry} or {@link ExtrudeGeometry}.
	 *
	 * @param {number} segments - The number of segments.
	 * @param {boolean} [closed=false] - Whether the curve is closed or not.
	 * @return {{tangents: Array<Vector3>, normals: Array<Vector3>, binormals: Array<Vector3>}} The Frenet Frames.
	 */
	computeFrenetFrames( segments, closed = false ) {

		// see http://www.cs.indiana.edu/pub/techreports/TR425.pdf

		const normal = new Vector3();

		const tangents = [];
		const normals = [];
		const binormals = [];

		const vec = new Vector3();
		const mat = new Matrix4();

		// compute the tangent vectors for each segment on the curve

		for ( let i = 0; i <= segments; i ++ ) {

			const u = i / segments;

			tangents[ i ] = this.getTangentAt( u, new Vector3() );

		}

		// select an initial normal vector perpendicular to the first tangent vector,
		// and in the direction of the minimum tangent xyz component

		normals[ 0 ] = new Vector3();
		binormals[ 0 ] = new Vector3();
		let min = Number.MAX_VALUE;
		const tx = Math.abs( tangents[ 0 ].x );
		const ty = Math.abs( tangents[ 0 ].y );
		const tz = Math.abs( tangents[ 0 ].z );

		if ( tx <= min ) {

			min = tx;
			normal.set( 1, 0, 0 );

		}

		if ( ty <= min ) {

			min = ty;
			normal.set( 0, 1, 0 );

		}

		if ( tz <= min ) {

			normal.set( 0, 0, 1 );

		}

		vec.crossVectors( tangents[ 0 ], normal ).normalize();

		normals[ 0 ].crossVectors( tangents[ 0 ], vec );
		binormals[ 0 ].crossVectors( tangents[ 0 ], normals[ 0 ] );


		// compute the slowly-varying normal and binormal vectors for each segment on the curve

		for ( let i = 1; i <= segments; i ++ ) {

			normals[ i ] = normals[ i - 1 ].clone();

			binormals[ i ] = binormals[ i - 1 ].clone();

			vec.crossVectors( tangents[ i - 1 ], tangents[ i ] );

			if ( vec.length() > Number.EPSILON ) {

				vec.normalize();

				const theta = Math.acos( clamp( tangents[ i - 1 ].dot( tangents[ i ] ), - 1, 1 ) ); // clamp for floating pt errors

				normals[ i ].applyMatrix4( mat.makeRotationAxis( vec, theta ) );

			}

			binormals[ i ].crossVectors( tangents[ i ], normals[ i ] );

		}

		// if the curve is closed, postprocess the vectors so the first and last normal vectors are the same

		if ( closed === true ) {

			let theta = Math.acos( clamp( normals[ 0 ].dot( normals[ segments ] ), - 1, 1 ) );
			theta /= segments;

			if ( tangents[ 0 ].dot( vec.crossVectors( normals[ 0 ], normals[ segments ] ) ) > 0 ) {

				theta = - theta;

			}

			for ( let i = 1; i <= segments; i ++ ) {

				// twist a little...
				normals[ i ].applyMatrix4( mat.makeRotationAxis( tangents[ i ], theta * i ) );
				binormals[ i ].crossVectors( tangents[ i ], normals[ i ] );

			}

		}

		return {
			tangents: tangents,
			normals: normals,
			binormals: binormals
		};

	}

	/**
	 * Returns a new curve with copied values from this instance.
	 *
	 * @return {Curve} A clone of this instance.
	 */
	clone() {

		return new this.constructor().copy( this );

	}

	/**
	 * Copies the values of the given curve to this instance.
	 *
	 * @param {Curve} source - The curve to copy.
	 * @return {Curve} A reference to this curve.
	 */
	copy( source ) {

		this.arcLengthDivisions = source.arcLengthDivisions;

		return this;

	}

	/**
	 * Serializes the curve into JSON.
	 *
	 * @return {Object} A JSON object representing the serialized curve.
	 * @see {@link ObjectLoader#parse}
	 */
	toJSON() {

		const data = {
			metadata: {
				version: 4.7,
				type: 'Curve',
				generator: 'Curve.toJSON'
			}
		};

		data.arcLengthDivisions = this.arcLengthDivisions;
		data.type = this.type;

		return data;

	}

	/**
	 * Deserializes the curve from the given JSON.
	 *
	 * @param {Object} json - The JSON holding the serialized curve.
	 * @return {Curve} A reference to this curve.
	 */
	fromJSON( json ) {

		this.arcLengthDivisions = json.arcLengthDivisions;

		return this;

	}

}


export { Curve };

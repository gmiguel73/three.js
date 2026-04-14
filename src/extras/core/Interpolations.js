/**
 * Interpolations contains spline and Bézier functions internally used by concrete curve classes.
 *
 * Bezier Curves formulas obtained from: https://en.wikipedia.org/wiki/B%C3%A9zier_curve
 *
 * @module Interpolations
 */

/**
 * Computes a point on a Catmull-Rom spline.
 *
 * @param {number} t - The interpolation factor.
 * @param {number} p0 - The first control point.
 * @param {number} p1 - The second control point.
 * @param {number} p2 - The third control point.
 * @param {number} p3 - The fourth control point.
 * @return {number} The calculated point on a Catmull-Rom spline.
 */
function CatmullRom( t, p0, p1, p2, p3 ) {

	const v0 = ( p2 - p0 ) * 0.5;
	const v1 = ( p3 - p1 ) * 0.5;
	const t2 = t * t;
	const t3 = t * t2;
	return ( 2 * p1 - 2 * p2 + v0 + v1 ) * t3 + ( - 3 * p1 + 3 * p2 - 2 * v0 - v1 ) * t2 + v0 * t + p1;

}

//

function QuadraticBezierP0( t, p ) {

	const k = 1 - t;
	return k * k * p;

}

function QuadraticBezierP1( t, p ) {

	return 2 * ( 1 - t ) * t * p;

}

function QuadraticBezierP2( t, p ) {

	return t * t * p;

}

/**
 * Computes a point on a Quadratic Bezier curve.
 *
 * @param {number} t - The interpolation factor.
 * @param {number} p0 - The first control point.
 * @param {number} p1 - The second control point.
 * @param {number} p2 - The third control point.
 * @return {number} The calculated point on a Quadratic Bezier curve.
 */
function QuadraticBezier( t, p0, p1, p2 ) {

	return QuadraticBezierP0( t, p0 ) + QuadraticBezierP1( t, p1 ) +
		QuadraticBezierP2( t, p2 );

}

//

function CubicBezierP0( t, p ) {

	const k = 1 - t;
	return k * k * k * p;

}

function CubicBezierP1( t, p ) {

	const k = 1 - t;
	return 3 * k * k * t * p;

}

function CubicBezierP2( t, p ) {

	return 3 * ( 1 - t ) * t * t * p;

}

function CubicBezierP3( t, p ) {

	return t * t * t * p;

}

/**
 * Computes a point on a Cubic Bezier curve.
 *
 * @param {number} t - The interpolation factor.
 * @param {number} p0 - The first control point.
 * @param {number} p1 - The second control point.
 * @param {number} p2 - The third control point.
 * @param {number} p3 - The fourth control point.
 * @return {number} The calculated point on a Cubic Bezier curve.
 */
function CubicBezier( t, p0, p1, p2, p3 ) {

	return CubicBezierP0( t, p0 ) + CubicBezierP1( t, p1 ) + CubicBezierP2( t, p2 ) +
		CubicBezierP3( t, p3 );

}

//

/**
 * Computes the first derivative of a Catmull-Rom spline.
 *
 * @param {number} t - The interpolation factor.
 * @param {number} p0 - The first control point.
 * @param {number} p1 - The second control point.
 * @param {number} p2 - The third control point.
 * @param {number} p3 - The fourth control point.
 * @return {number} The first derivative value.
 */
function CatmullRomDer1( t, p0, p1, p2, p3 ) {

	const v0 = ( p2 - p0 ) * 0.5;
	const v1 = ( p3 - p1 ) * 0.5;
	const t2 = t * t;
	// d/dt of: (2p1 - 2p2 + v0 + v1)*t^3 + (-3p1 + 3p2 - 2v0 - v1)*t^2 + v0*t + p1
	return 3 * ( 2 * p1 - 2 * p2 + v0 + v1 ) * t2 + 2 * ( - 3 * p1 + 3 * p2 - 2 * v0 - v1 ) * t + v0;

}

/**
 * Computes the second derivative of a Catmull-Rom spline.
 *
 * @param {number} t - The interpolation factor.
 * @param {number} p0 - The first control point.
 * @param {number} p1 - The second control point.
 * @param {number} p2 - The third control point.
 * @param {number} p3 - The fourth control point.
 * @return {number} The second derivative value.
 */
function CatmullRomDer2( t, p0, p1, p2, p3 ) {

	const v0 = ( p2 - p0 ) * 0.5;
	const v1 = ( p3 - p1 ) * 0.5;
	return 6 * ( 2 * p1 - 2 * p2 + v0 + v1 ) * t + 2 * ( - 3 * p1 + 3 * p2 - 2 * v0 - v1 );

}

//

/**
 * Computes the first derivative of a Quadratic Bezier curve.
 *
 * @param {number} t - The interpolation factor.
 * @param {number} p0 - The first control point.
 * @param {number} p1 - The second control point.
 * @param {number} p2 - The third control point.
 * @return {number} The first derivative value.
 */
function QuadraticBezierDer1( t, p0, p1, p2 ) {

	return 2 * ( 1 - t ) * ( p1 - p0 ) + 2 * t * ( p2 - p1 );

}

/**
 * Computes the second derivative of a Quadratic Bezier curve.
 * This is constant with respect to t.
 *
 * @param {number} t - The interpolation factor (unused, kept for API consistency).
 * @param {number} p0 - The first control point.
 * @param {number} p1 - The second control point.
 * @param {number} p2 - The third control point.
 * @return {number} The second derivative value.
 */
function QuadraticBezierDer2( t, p0, p1, p2 ) {

	return 2 * ( p2 - 2 * p1 + p0 );

}

//

/**
 * Computes the first derivative of a Cubic Bezier curve.
 *
 * @param {number} t - The interpolation factor.
 * @param {number} p0 - The first control point.
 * @param {number} p1 - The second control point.
 * @param {number} p2 - The third control point.
 * @param {number} p3 - The fourth control point.
 * @return {number} The first derivative value.
 */
function CubicBezierDer1( t, p0, p1, p2, p3 ) {

	const k = 1 - t;
	return 3 * k * k * ( p1 - p0 ) + 6 * k * t * ( p2 - p1 ) + 3 * t * t * ( p3 - p2 );

}

/**
 * Computes the second derivative of a Cubic Bezier curve.
 *
 * @param {number} t - The interpolation factor.
 * @param {number} p0 - The first control point.
 * @param {number} p1 - The second control point.
 * @param {number} p2 - The third control point.
 * @param {number} p3 - The fourth control point.
 * @return {number} The second derivative value.
 */
function CubicBezierDer2( t, p0, p1, p2, p3 ) {

	return 6 * ( 1 - t ) * ( p2 - 2 * p1 + p0 ) + 6 * t * ( p3 - 2 * p2 + p1 );

}

/**
 * Computes the third derivative of a Cubic Bezier curve.
 * This is constant with respect to t.
 *
 * @param {number} t - The interpolation factor (unused, kept for API consistency).
 * @param {number} p0 - The first control point.
 * @param {number} p1 - The second control point.
 * @param {number} p2 - The third control point.
 * @param {number} p3 - The fourth control point.
 * @return {number} The third derivative value.
 */
function CubicBezierDer3( t, p0, p1, p2, p3 ) {

	return 6 * ( p3 - 3 * p2 + 3 * p1 - p0 );

}

export {
	CatmullRom, CatmullRomDer1, CatmullRomDer2,
	QuadraticBezier, QuadraticBezierDer1, QuadraticBezierDer2,
	CubicBezier, CubicBezierDer1, CubicBezierDer2, CubicBezierDer3
};

/*
 * This file provides a collection of useful methods for vertex and fragment shader.
 *
 * @author Human Interactive
 */

/*
 * SYMBOLIC CONSTANTS
 * ---------------------------------------------------
 */
#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define NUM_OCTAVES 5

/*
 * RANDOM
 * ---------------------------------------------------
 */

/*
 * Calculates a pseudo-random value for a single
 * input parameter.
 *
 * @param {float} x - The input parameter.
 *
 * @returns {float} The pseudo-random value.
 */
float random( in float x ) {

    return fract( sin( x ) * 1e4 );
}

/*
 * Calculates a pseudo-random value for a two-dimensional
 * input parameter.
 *
 * @param {vec2} uv - The two-dimensional parameter.
 *
 * @returns {float} The pseudo-random value.
 */
float random( in vec2 uv ) {

    return fract( 1e4 * sin( 17.0 * uv.x + uv.y * 0.1 ) * ( 0.1 + abs( sin( uv.y * 13.0 + uv.x ) ) ) );
}

/*
 * NOISE
 * ---------------------------------------------------
 */

 /*
  * Calculates an one-dimensional value noise.
  *
  * see: https://en.wikipedia.org/wiki/Value_noise
  *
  * @param {float} x - The input parameter.
  *
  * @returns {float} The noise value.
  */
float noise( in float x ) {

    float i = floor( x );
    float f = fract( x );

    // cubic curve for interpolation
    float u = f * f * ( 3.0 - 2.0 * f );

    // smooth interpolation between a random value of an integer to the next one
    return mix( random( i ), random( i + 1.0 ), u );
}

 /*
  * Calculates a two-dimensional value noise.
  *
  * see: https://en.wikipedia.org/wiki/Value_noise
  *
  * @param {vec2} x - The input vector.
  *
  * @returns {float} The noise value.
  */
float noise( in vec2 p )
{
    vec2 i = floor( p );
    vec2 f = fract( p );
	
    // cubic curve for interpolation
	vec2 u = f * f * ( 3.0 - 2.0 * f );

    return mix( mix( random( i + vec2( 0.0, 0.0 ) ), 
                     random( i + vec2( 1.0, 0.0 ) ), u.x ),
                mix( random( i + vec2( 0.0, 1.0 ) ), 
                     random( i + vec2( 1.0, 1.0 ) ), u.x ), u.y );
}

 /*
  * Calculates a three-dimensional value noise.
  *
  * see: https://en.wikipedia.org/wiki/Value_noise
  *
  * @param {vec3} x - The input vector.
  *
  * @returns {float} The noise value.
  */
float noise( in vec3 x ) {

    const vec3 step = vec3( 110, 241, 171 );

    vec3 i = floor( x );
    vec3 f = fract( x );

    float n = dot(i, step);

    // cubic curve for interpolation
    vec3 u = f * f * ( 3.0 - 2.0 * f );

    return mix( mix( mix( random( n + dot( step, vec3( 0, 0, 0 ) ) ), random( n + dot( step, vec3( 1, 0, 0 ) ) ), u.x ),
                     mix( random( n + dot( step, vec3( 0, 1, 0 ) ) ), random( n + dot( step, vec3( 1, 1, 0 ) ) ), u.x ), u.y ),
                mix( mix( random( n + dot( step, vec3( 0, 0, 1 ) ) ), random( n + dot( step, vec3( 1, 0, 1 ) ) ), u.x ),
                     mix( random( n + dot( step, vec3( 0, 1, 1 ) ) ), random( n + dot( step, vec3( 1, 1, 1 ) ) ), u.x ), u.y ), u.z );
}

/*
 * FRACTAL BROWNIAN MOTION
 * ---------------------------------------------------
 */

 /*
  * Calculates a one-dimensional fbm-noise.
  *
  * @param {float} x - The input parameter.
  *
  * @returns {float} The fbm-noise value.
  */
float fbm( in float x ) {

  float v = 0.0;
  float a = 0.5;
  float shift = float( 100 );

  for ( int i = 0; i < NUM_OCTAVES; ++i ) {

    // sum noise functions
    v += a * noise( x ) ;
    x = x * 2.0 + shift;
    a *= 0.5;
  }

  return v;
}

 /*
  * Calculates a two-dimensional fbm-noise.
  *
  * @param {vec2} x - The input vector.
  *
  * @returns {float} The fbm-noise value.
  */
float fbm( in vec2 x ) {

  float v = 0.0;
  float a = 0.5;

  vec2 shift = vec2( 100 );

  // rotate to reduce axial bias
  mat2 rot = mat2( cos( 0.5 ), sin( 0.5 ), -sin( 0.5 ), cos( 0.5 ) );

  for ( int i = 0; i < NUM_OCTAVES; ++i ) {

    // sum noise functions
    v += a * noise( x );
    x = rot * x * 2.0 + shift;
    a *= 0.5;
  }

  return v;
}

 /*
  * Calculates a three-dimensional fbm-noise.
  *
  * @param {vec3} x - The input vector.
  *
  * @returns {float} The fbm-noise value.
  */
float fbm( in vec3 x ) {

  float v = 0.0;
  float a = 0.5;

  vec3 shift = vec3( 100 );

  for ( int i = 0; i < NUM_OCTAVES; ++i ) {

    // sum noise functions
    v += a * noise( x );
    x = x * 2.0 + shift;
    a *= 0.5;
  }

  return v;
}

/*
 * TRANSFORMATIONS
 * ---------------------------------------------------
 */

/*
 * Creates a 2x2 rotation matrix. This method should
 * rotate shapes always around the origin.
 *
 * @param {float} angle - The angle for rotation.
 *
 * @returns {mat2} The 2x2 rotation matrix.
 */
mat2 rotate2d( in float angle ) {
     return mat2(  cos( angle ),  sin( angle ),
                  -sin( angle ),  cos( angle ) );
}

/*
 * Creates a 3x3 rotation matrix. This method should
 * rotate shapes always around the origin.
 *
 * @param {float} angle - The angle for rotation.
 *
 * @returns {mat3} The 3x3 rotation matrix.
 */
mat3 rotate( in float angle ) {
     return mat3(  cos( angle ),  sin( angle ), 0.0,
                  -sin( angle ),  cos( angle ), 0.0,
                            0.0,           0.0, 1.0 );
}

/*
 * Creates a 2x2 scaling matrix.
 *
 * @param {vec2} scale - Scale values for x and y.
 *
 * @returns {mat3} The 2x2 scaling matrix.
 */
mat2 scale2d( in vec2 scale ) {
    return mat2( scale.x,     0.0,
                     0.0, scale.y );
}

/*
 * Creates a 3x3 scaling matrix.
 *
 * @param {vec2} scale - Scale values for x and y.
 *
 * @returns {mat3} The 3x3 scaling matrix.
 */
mat3 scale( in vec2 scale ) {
    return mat3( scale.x,     0.0, 0.0,
                     0.0, scale.y, 0.0,
                     0.0,     0.0, 1.0 );
}

/*
 * Creates a 3x3 translation matrix.
 *
 * @param {vec2} translate - The amount to translate.
 *
 * @returns {mat3} The 3x3 translation matrix.
 */
mat3 translate( in vec2 translate ) {
    return mat3( 1.0, 0.0, 0.0,
                 0.0, 1.0, 0.0,
                 translate.x,  translate.y, 1.0 );
}

/*
 * SHAPES
 * ---------------------------------------------------
 */

/*
 * Calculates the shape of a border with sharp edges.
 * This function needs uv coordinates in range [0, 1].
 *
 * @param {float} width - The width of the border.
 * @param {vec2} uv - The uv coordinates.
 *
 * @returns {float} Amount to mix per fragment.
 */
float border( in float width, in vec2 uv ) {

    vec2 border = step( vec2( width ), uv ) -
                  step( vec2( 1.0 - width ), uv );

    return 1.0 - ( border.x * border.y );
}

/*
 * Calculates the shape of a border with smooth edges.
 * This function needs uv coordinates in range [0, 1].
 *
 * @param {float} width - The width of the border.
 * @param {float} smoothness - The smoothness of edges.
 * @param {vec2} uv - The uv coordinates.
 *
 * @returns {float} Amount to mix per fragment.
 */
float borderSmooth( in float width, in float smoothness, in vec2 uv ) {

    vec2 border = smoothstep( vec2( width - smoothness ), vec2( width ), uv ) -
                  smoothstep( vec2( 1.0 - width ), vec2( 1.0 - width + smoothness ), uv );

    return 1.0 -  ( border.x * border.y );
}

/*
 * Calculates the shape of a straight line with sharp edges.
 *
 * @param {float} f - The y-value of the line to draw.
 * @param {float} y - The y-value of the uv coordinate.
 * @param {float} width - The width of the line.
 *
 * @returns {float} Amount to mix per fragment.
 */
float line( in float f, in float y, in float width ) {

   return step( f - width, y ) -
          step( f + width, y );
}

/*
 * Calculates the shape of a straight line with smooth edges.
 *
 * @param {float} f - The y-value of the line to draw.
 * @param {float} y - The y-value of the uv coordinate.
 * @param {float} width - The width of the line.
 *
 * @returns {float} Amount to mix per fragment.
 */
float lineSmooth( in float f, in float y, in float width ) {

   return smoothstep( f - width, f, y ) -
          smoothstep( f, f + width, y );
}

/*
 * Calculates the shape of a line segment with sharp edges.
 *
 * @param {vec2} start - The start point of the line segment.
 * @param {vec2} end - The end point of the line segment.
 * @param {float} width - The width of the line segment.
 * @param {vec2} uv - The uv coordinates.
 *
 * @returns {float} Amount to mix per fragment.
 */
float lineSegment( in vec2 start, in vec2 end, in float width, in vec2 uv ) {

    width *= 0.5;

    vec2 dir0 = end - start;
    vec2 dir1 = uv - start;

    float h = clamp( dot( dir1, dir0 ) / dot( dir0, dir0 ), 0.0, 1.0 );
    float d = length( dir1 - dir0 * h );

    return 1.0 - step( width, d );
}

/*
 * Calculates the shape of a line segment with smooth edges.
 *
 * @param {vec2} start - The start point of the line segment.
 * @param {vec2} end - The end point of the line segment.
 * @param {float} width - The width of the line segment.
 * @param {float} smoothness - The smoothness of the line segment.
 * @param {vec2} uv - The uv coordinates.
 *
 * @returns {float} Amount to mix per fragment.
 */
float lineSegmentSmooth( in vec2 start, in vec2 end, in float width, in float smoothness, in vec2 uv ) {

    width *= 0.5;

    vec2 dir0 = end - start;
    vec2 dir1 = uv - start;

    float h = clamp( dot( dir1, dir0 ) / dot( dir0, dir0 ), 0.0, 1.0 );
    float d = length( dir1 - dir0 * h );

    return 1.0 - smoothstep( width - smoothness, width + smoothness, d );
}

/*
 * Calculates the shape of a rectangle with sharp edges.
 *
 * @param {vec2} position - The position of the rectangle.
 * @param {float} width - The width of the rectangle.
 * @param {float} height - The height of the rectangle.
 * @param {vec2} uv - The uv coordinates.
 *
 * @returns {float} Amount to mix per fragment.
 */
float rectangle( in vec2 position, in float width, in float height, in vec2 uv ) {

    vec4 coord = vec4( position.x - width  * 0.5,
                       position.y - height * 0.5,
                       position.x + width  * 0.5,
                       position.y + height * 0.5 );


    vec2 rect = step( coord.xy, uv ) * step( uv, coord.zw );

    return rect.x * rect.y;
}

/*
 * Calculates the shape of a rectangle with smooth edges.
 *
 * @param {vec2} position - The position of the rectangle.
 * @param {float} width - The width of the rectangle.
 * @param {float} height - The height of the rectangle.
 * @param {float} smoothness - The smoothness of edges.
 * @param {vec2} uv - The uv coordinates.
 *
 * @returns {float} Amount to mix per fragment.
 */
float rectangleSmooth( in vec2 position, in float width, in float height, in float smoothness, in vec2 uv ) {

    vec4 coord = vec4( position.x - width  * 0.5,
                       position.y - height * 0.5,
                       position.x + width  * 0.5,
                       position.y + height * 0.5 );


    vec2 rect = smoothstep( coord.xy, coord.xy + smoothness,  uv ) *
                smoothstep( uv, uv + smoothness, coord.zw );

    return rect.x * rect.y;
}

/*
 * Calculates the shape of a circle with sharp edges.
 *
 * @param {vec2} center - The center of the circle.
 * @param {float} radius - The radius of the circle.
 * @param {vec2} uv - The uv coordinates.
 *
 * @returns {float} Amount to mix per fragment.
 */
float circle( in vec2 center, in float radius, in vec2 uv ) {

    return 1.0 - ( step( radius, length( uv - center ) ) );
}

/*
 * Calculates the shape of a circle with smooth edges.
 *
 * @param {vec2} center - The center of the circle.
 * @param {float} radius - The radius of the circle.
 * @param {float} smoothness - The smoothness of edges.
 * @param {vec2} uv - The uv coordinates.
 *
 * @returns {float} Amount to mix per fragment.
 */
float circleSmooth( in vec2 center, in float radius, in float smoothness, in vec2 uv ) {

    return 1.0 - ( smoothstep( radius, radius + smoothness, length( uv - center ) ) );
}

/*
 * Calculates the shape of a polygon with arbitrary sides and sharp edges.
 *
 * @param {float} size - The size of the polygon.
 * @param {int} sides - The number of sides.
 * @param {vec2} uv - The uv coordinates.
 *
 * @returns {float} Amount to mix per fragment.
 */
float polygon( in float size, in int sides, in vec2 uv ) {

    float angle = atan( uv.x, uv.y ) + PI;
    float radius = TWO_PI / float( sides );

    float distance = cos( floor( 0.5 + angle / radius ) * radius - angle ) * length( uv );

    return 1.0 - step( size, distance );
}

/*
 * Calculates the shape of a polygon with arbitrary sides and sharp edges.
 *
 * @param {float} size - The size of the polygon.
 * @param {int} sides - The number of sides.
 * @param {float} smoothness - The smoothness of edges.
 * @param {vec2} uv - The uv coordinates.
 *
 * @returns {float} Amount to mix per fragment.
 */
float polygonSmooth( in float size, in int sides, in float smoothness, in vec2 uv ) {

    float angle = atan( uv.x, uv.y ) + PI;
    float radius = TWO_PI / float( sides );

    float distance = cos( floor( 0.5 + angle / radius ) * radius - angle ) * length( uv );

    return 1.0 - smoothstep( size, size + smoothness, distance );
}

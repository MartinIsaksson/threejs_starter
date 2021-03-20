varying vec3 vPosition;
uniform float uTime;
varying vec2 vUv;

varying vec3 vLayer0;
varying vec3 vLayer1;
varying vec3 vEyeVector;

mat2 rotate(float a)  {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

void main() {
  float t = uTime * 0.007;
  mat2 rot = rotate(t);

  vec3 p0 = position;
  p0.yz = (rot * p0.yz) * 0.5;
  vLayer0 =p0;

  vec3 p1 =position;
  p1.xz = rot * p1.xz;
  vLayer1 = p1;

  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vEyeVector = normalize(modelPosition.xyz - cameraPosition);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;

  vPosition = position;
  vUv = uv;
}

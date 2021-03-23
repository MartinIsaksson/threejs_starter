uniform float uTime;
uniform samplerCube uPerlin;

varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vLayer0;
varying vec3 vLayer1;
varying vec3 vLayer2;
varying vec3 vEyeVector;

vec3 brightnessToColor(float b) {
  b *= 0.25;
  return (vec3(b, b*b, b*b*b*b) / 0.25) *0.6;
}
float Fresnel(vec3 eyeVector, vec3 worldNormal) {
  return pow(1.0 + dot(eyeVector, worldNormal), 3.0);
}
float supersun() {
  float sum = 0.;
  sum += textureCube(uPerlin, vLayer0).r;
  sum += textureCube(uPerlin, vLayer1).r;
  sum += textureCube(uPerlin, vLayer2).r * 0.3;
  sum *= 0.4;
  return sum;
}
void main() {
  float brightness = supersun();
  brightness = brightness*4. + 1.;
  float fres = Fresnel(vEyeVector, vPosition); //Makes the sides "pop"
  brightness += pow(fres, 0.8);
  vec3 color = brightnessToColor(brightness);
  // gl_FragColor = vec4(Fresnel(vEyeVector, vPosition));
  gl_FragColor = vec4(color, 1.0);
  // gl_FragColor = textureCube(uPerlin, vPosition);
  // gl_FragColor = vec4(vLayer0, 1.0);
  // gl_FragColor = vec4(vUv, 1.0,1.0);
}

uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uTexture;
varying vec2 vUv;




void main() {


  vec4 texture = texture2D(uTexture, vUv);
  gl_FragColor = texture;
  if(texture.r<0.1 && texture.g<0.1 && texture.b<0.1) discard;
  // gl_FragColor = vec4(vUv, 0.,1.0 );
}

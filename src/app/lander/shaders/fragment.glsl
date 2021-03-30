// uniform vec3 uPeakColor;
varying vec2 vUv;
varying float vElevation;
uniform float uTime;
uniform  vec2 uResolution;

float random (in vec2 _st) {
    return fract(sin(dot(_st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

float field(in vec3 p) {
  //4373.11
  float power = 5.6;
	float strength = power + .03 * log(1.e-6 + fract(sin(uTime) * 513.11));
	float accum = 0.;
	float prev = 0.;
	float tw = 0.;
	for (int i = 0; i < 32; ++i) {
		float mag = dot(p, p) * 0.3;
		p = abs(p) / mag + vec3(-.5, -.9, -1.2);
		float w = exp(-float(i) / power);
		accum += w * exp(-strength * pow(abs(mag - prev), 2.3));
		tw += clamp(w * 0.8, 0.1,0.5);
		prev = mag * sin(uTime * vElevation);
	}
	return max(0., 5. * accum / tw - .7);
}

void main() {
  float mixStrength = (vElevation + 0.5) * 2.0;
  vec3 bottomColor = vec3(0.5, 0.67, 0.2);
  vec3 surfaceColor = vec3(0.3, 1.0, 0.2);

  vec2 uvs = vUv * uResolution.xy / max(uResolution.x, uResolution.y);
  vec3 p = vec3(uvs / 4., 0) + vec3(1., -1.3, 0.);
	p += .2 * vec3(sin(uTime / 16.), sin(uTime / 12.),  sin(uTime / 128.));
  float t = field(p);
  float v = (1. - exp((abs(vUv.x) - 1.) * 6.)) * (1. - exp((abs(vUv.y) - 1.) * 6.));
  vec4 test = mix(surfaceColor.x, surfaceColor.y, v) * vec4(bottomColor.x * t * t * t, bottomColor.y * t * t, bottomColor.z * t, 1.0);
  vec3 color = mix(surfaceColor, bottomColor, mixStrength);

  gl_FragColor = test;
}

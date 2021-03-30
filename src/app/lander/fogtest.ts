import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  AmbientLight,
  BackSide,
  BoxBufferGeometry,
  Clock,
  DirectionalLight,
  FogExp2,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneBufferGeometry,
  PlaneGeometry,
  Scene,
  Shader,
  ShaderMaterial,
  SphereBufferGeometry,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import cloudVertex from "./shaders/cloudVertex.glsl";
import cloudFragment from "./shaders/cloudFragment.glsl";
import THREE = require("three");
import { _NOISE_GLSL } from "./noise_glsl";

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

export default class Lander {
  canvas: HTMLCanvasElement = document.getElementById(
    "main-canvas"
  ) as HTMLCanvasElement;
  renderer = new WebGLRenderer({
    canvas: this.canvas,
    antialias: true,
  });
  clock: Clock;
  scene: Scene;
  camera: PerspectiveCamera;
  geometry!: PlaneBufferGeometry;
  material!: ShaderMaterial;
  plane!: Mesh;
  controls: OrbitControls;
  cloudMaterial!: ShaderMaterial;
  cloud!: Mesh;
  light!: DirectionalLight;
  ModifyShader_ = (s: any) => {
    this.shaders_.push(s);
    s.uniforms.fogTime = { value: 0.0 };
  };
  shaders_: any[];
  constructor() {
    /**
     * Pointlight
     *  animate
     * Plane,
     *  Geometry
     *  ShaderMaterial
     *    Vertex
     *    Fragment
     *  Research Shadows for ShaderMaterial
     */
    this.shaders_ = [];
    this.renderer.shadowMap.enabled = true;
    this.renderer.setSize(sizes.width, sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene = new Scene();
    this.clock = new Clock();
    this.camera = new PerspectiveCamera(
      50,
      sizes.width / sizes.height,
      0.1,
      20000
    );

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.target.set(0, 20, 0);
    this.controls.enableDamping = true;
    // this.createCloud();
    this.modifiyShaders();
    this.setupLight();
    this.setupSkyBox();
    const groundMaterial = new MeshStandardMaterial({
      color: 0x808080,
    });
    const plane = new Mesh(
      new PlaneGeometry(20000, 20000, 300, 300),
      groundMaterial
    );
    groundMaterial.onBeforeCompile = this.ModifyShader_;
    plane.rotation.x = -Math.PI / 2;
    plane.position.y -= 0.1;
    this.scene.add(plane);
    this.camera.position.set(50, 50, 50);
    this.camera.lookAt(plane.position);
    this.scene.add(this.camera);

    const box = new Mesh(
      new BoxBufferGeometry(1, 1, 1),
      new MeshStandardMaterial()
    );


    this.scene.fog = new FogExp2(0xdfe9f3, 0.0000005);
    this.render();
    this.addListeners();
  }
  setupSkyBox() {
    const material = new MeshBasicMaterial({
      color: 0x8080ff,
      side: BackSide,
    });
    const sky = new Mesh(new SphereGeometry(10000, 32, 32), material);
    material.onBeforeCompile = this.ModifyShader_;
    // material.onBeforeCompile = (shader: Shader) => {
    //   console.log("shader", shader.vertexShader);
    //   console.log("fragmentShader", shader.fragmentShader);
    // };
    this.scene.add(sky);
  }
  private setupLight() {
    this.light = new DirectionalLight("#fffffb", 1);
    this.light.position.set(10, 10, 10);
    this.light.position.set(20, 100, 10);
    this.light.target.position.set(0, 0, 0);
    this.light.castShadow = true;
    this.light.shadow.bias = -0.001;
    this.light.shadow.mapSize.width = 2048;
    this.light.shadow.mapSize.height = 2048;
    this.light.shadow.camera.near = 0.1;
    this.light.shadow.camera.far = 500.0;
    this.light.shadow.camera.near = 0.5;
    this.light.shadow.camera.far = 500.0;
    this.light.shadow.camera.left = 100;
    this.light.shadow.camera.right = -100;
    this.light.shadow.camera.top = 100;
    this.light.shadow.camera.bottom = -100;
    this.light.lookAt(new Vector3());
    this.scene.add(this.light);
  }

  addListeners() {
    window.addEventListener("resize", () => {
      sizes.height = window.innerHeight;
      sizes.width = window.innerWidth;
      const aspectRatio = sizes.width / sizes.height;
      this.camera.aspect = aspectRatio;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(sizes.width, sizes.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }
  createCloud() {
    const geometry = new PlaneGeometry(3, 3, 64, 64);
    this.cloudMaterial = new ShaderMaterial({
      vertexShader: cloudVertex,
      fragmentShader: cloudFragment,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new Vector2(0, 0) },
        uResolution: { value: new Vector2(sizes.width, sizes.height) },
      },
    });
    this.cloud = new Mesh(geometry, this.cloudMaterial);
    this.cloud.position.set(0, 3, 0);
    this.camera.lookAt(this.cloud.position);
    // this.cloud.rotation.x = -Math.PI / 2;
    this.scene.add(this.cloud);
  }
  createPlane() {
    this.geometry = new PlaneBufferGeometry(2, 2, 128, 128);
    this.material = new ShaderMaterial({
      // transparent: true,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
      },
    });
    this.plane = new Mesh(this.geometry, this.material);
    this.plane.rotation.x = -Math.PI / 2;
    this.scene.add(this.plane);
  }
  private render() {
    const elapsedTime = this.clock.getElapsedTime();
    // this.material.uniforms.uTime.value = elapsedTime;
    this.controls.update();
    requestAnimationFrame(() => this.render());
    this.renderer.render(this.scene, this.camera);
  }
  modifiyShaders() {
    THREE.ShaderChunk.fog_fragment = `
    #ifdef USE_FOG
      vec3 fogOrigin = cameraPosition;
      vec3 fogDirection = normalize(vWorldPosition - fogOrigin);
      float fogDepth = distance(vWorldPosition, fogOrigin);
      // f(p) = fbm( p + fbm( p ) )
      vec3 noiseSampleCoord = vWorldPosition * 0.00025 + vec3(
          0.0, 0.0, fogTime * 0.025);
      float noiseSample = FBM(noiseSampleCoord + FBM(noiseSampleCoord)) * 0.5 + 0.5;
      fogDepth *= mix(noiseSample, 1.0, saturate((fogDepth - 500.0) / 500.0));
      fogDepth *= fogDepth;
      float heightFactor = 0.05;
      float fogFactor = heightFactor * exp(-fogOrigin.y * fogDensity) * (
          1.0 - exp(-fogDepth * fogDirection.y * fogDensity)) / fogDirection.y;
      fogFactor = saturate(fogFactor);
      gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
    #endif`;

    THREE.ShaderChunk.fog_pars_fragment =
      _NOISE_GLSL +
      `
    #ifdef USE_FOG
      uniform float fogTime;
      uniform vec3 fogColor;
      varying vec3 vWorldPosition;
      #ifdef FOG_EXP2
        uniform float fogDensity;
      #else
        uniform float fogNear;
        uniform float fogFar;
      #endif
    #endif`;

    THREE.ShaderChunk.fog_vertex = `
    #ifdef USE_FOG
      vWorldPosition = worldPosition.xyz;
    #endif`;

    THREE.ShaderChunk.fog_pars_vertex = `
    #ifdef USE_FOG
      varying vec3 vWorldPosition;
    #endif`;
  }
}

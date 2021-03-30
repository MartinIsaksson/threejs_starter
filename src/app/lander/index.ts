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
    this.controls.enableDamping = true;
    // this.createCloud();
    this.createPlane();
    this.setupLight();
    const groundMaterial = new MeshStandardMaterial({
      color: 0x808080,
    });
    const plane = new Mesh(new PlaneGeometry(5, 5, 300, 300), groundMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y -= 0.1;
    // this.scene.add(plane);
    this.camera.position.set(0, 3, 0);
    this.camera.lookAt(plane.position);
    this.scene.add(this.camera);
    this.scene.fog = new FogExp2(0xdfe9f3, 0.0000005);
    this.render();
    this.addListeners();
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
    // const geom = new SphereBufferGeometry(2, 128, 128);
    this.material = new ShaderMaterial({
      // transparent: true,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vector2(sizes.width, sizes.height) },
      },
    });
    this.plane = new Mesh(this.geometry, this.material);
    this.plane.rotation.x = -Math.PI / 2;
    this.scene.add(this.plane);
  }
  private render() {
    const elapsedTime = this.clock.getElapsedTime();
    this.material.uniforms.uTime.value = elapsedTime;

    this.controls.update();
    requestAnimationFrame(() => this.render());
    this.renderer.render(this.scene, this.camera);
  }
}

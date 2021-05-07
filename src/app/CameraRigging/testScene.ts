import {
  AmbientLight,
  AxesHelper,
  BoxGeometry,
  CatmullRomCurve3,
  Clock,
  CubeCamera,
  CubeTextureLoader,
  DoubleSide,
  LinearMipmapLinearFilter,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Path,
  PerspectiveCamera,
  Quaternion,
  RGBFormat,
  Scene,
  ShaderMaterial,
  SphereBufferGeometry,
  sRGBEncoding,
  Vector3,
  WebGLCubeRenderTarget,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import sunVertex from "../shaders/sun/vertex.glsl";
import sunFragment from "../shaders/sun/fragment.glsl";
import perlinFragment from "../shaders/perlin/fragment.glsl";
import perlinVertex from "../shaders/perlin/vertex.glsl";
import glowVertex from "../shaders/glow/vertex.glsl";
import glowFragment from "../shaders/glow/fragment.glsl";
import { CameraRig } from "./CameraRig";
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
export class TestScene {
  canvas: HTMLCanvasElement = document.getElementById(
    "main-canvas"
  ) as HTMLCanvasElement;
  renderer = new WebGLRenderer({
    canvas: this.canvas,
    antialias: true,
  });
  scene: Scene;
  camera: PerspectiveCamera;
  sun: Mesh;
  clock: Clock;
  materialPerlin!: ShaderMaterial;
  perlinBall!: Mesh;
  perlinScene: Scene;
  controls: OrbitControls;
  materialGlow!: ShaderMaterial;
  cubeLoader: CubeTextureLoader;
  cameraPath: Vector3[];
  pathIndex = 0;
  rig: CameraRig;

  constructor() {
    this.clock = new Clock();
    this.scene = new Scene();
    this.perlinScene = new Scene();
    this.camera = new PerspectiveCamera(75, sizes.width / sizes.height);
    this.camera.position.set(0, 2, 3);
    this.camera.lookAt(new Vector3(0, 0));
    this.cubeLoader = new CubeTextureLoader();
    const environmentMap = this.cubeLoader.load([
      "/static/terrain/space-posx.jpg",
      "/static/terrain/space-negx.jpg",
      "/static/terrain/space-posy.jpg",
      "/static/terrain/space-negy.jpg",
      "/static/terrain/space-posz.jpg",
      "/static/terrain/space-negz.jpg",
    ]);
    this.scene.background = environmentMap;
    this.scene.environment = environmentMap;
    const ambientLight = new AmbientLight(0xff00ff, 0.5);
    this.scene.add(ambientLight);
    this.cameraPath = this.createCameraPath();
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enabled = false;
    this.sun = new Mesh(
      new SphereBufferGeometry(1, 32, 64),
      new MeshBasicMaterial({ color: "orange" })
    );
    this.scene.add(this.sun);
    this.rig = new CameraRig(
      this.renderer,
      this.scene,
      this.camera,
      this.controls
    );
    this.rig.loadCurve(
      [
        new Vector3(5, 0, 5),
        new Vector3(5, 0, -5),
        new Vector3(-5, 0, -5),
        new Vector3(-5, 0, 5),
        new Vector3(5, -5, 5),
        new Vector3(10, 0, 10),
        new Vector3(3, 3, 3),
      ],
      {
        curve: "chordal",
        loop: false,
        playTime: 20,
        segments: 200,
        followPoint: this.sun.position,
      }
    );
    this.renderer.setSize(sizes.width, sizes.height);
    this.addListeners();

    this.render();
  }
  addListeners() {}
  createCameraPath(): Vector3[] {
    const spline = new CatmullRomCurve3([
      new Vector3(5, 0, 5),
      new Vector3(5, 0, -5),
      new Vector3(-5, 0, -5),
      new Vector3(-5, 0, 5),
      new Vector3(5, -5, 5),
      new Vector3(10, 0, 10),
      new Vector3(3, 3, 3),
    ]);
    const numberOfPoints = 10;
    return spline.getPoints(numberOfPoints);
  }

  displacement = new Vector3();
  desiredVelocity = new Vector3();
  private render() {
    const delta = this.clock.getDelta();
    this.rig.update(delta);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.render());
  }
}

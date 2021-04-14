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
import sunVertex from "./shaders/sun/vertex.glsl";
import sunFragment from "./shaders/sun/fragment.glsl";
import perlinFragment from "./shaders/perlin/fragment.glsl";
import perlinVertex from "./shaders/perlin/vertex.glsl";
import glowVertex from "./shaders/glow/vertex.glsl";
import glowFragment from "./shaders/glow/fragment.glsl";
import { gsap } from "gsap";
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
export class App {
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
  materialSun: ShaderMaterial;
  cubeRenderTarget!: WebGLCubeRenderTarget;
  cubeCamera!: CubeCamera;
  materialPerlin!: ShaderMaterial;
  perlinBall!: Mesh;
  perlinScene: Scene;
  controls: OrbitControls;
  materialGlow!: ShaderMaterial;
  cubeLoader: CubeTextureLoader;
  smallSun: Mesh;
  cameraPath: Vector3[];
  pathIndex = 0;
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
    // const ambientLight = new AmbientLight(0xff00ff, 0.5);
    // this.scene.add(ambientLight);
    this.cameraPath = this.createCameraPath();
    this.controls = new OrbitControls(this.camera, this.canvas);

    this.addTexture();
    this.materialSun = new ShaderMaterial({
      vertexShader: sunVertex,
      fragmentShader: sunFragment,
      uniforms: {
        uTime: { value: 0.0 },
        uPerlin: { value: null },
      },
    });
    this.sun = new Mesh(new SphereBufferGeometry(1, 32, 64), this.materialSun);
    // this.addGlow();
    this.scene.add(new AxesHelper(10));
    this.scene.add(this.sun);
    this.smallSun = new Mesh(
      new SphereBufferGeometry(0.2, 32, 64),
      this.materialSun
    );
    this.smallSun.position.set(-1, 0, 1);
    this.scene.add(this.smallSun);
    this.renderer.setSize(sizes.width, sizes.height);
    //Subtracts from the vector(camera position)

    this.render();
  }
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
  private addGlow() {
    this.materialGlow = new ShaderMaterial({
      vertexShader: glowVertex,
      fragmentShader: glowFragment,
      uniforms: {
        uTime: { value: 0.0 },
        uPerlin: { value: null },
      },
    });
    this.sun = new Mesh(new SphereBufferGeometry(1, 32, 64), this.materialGlow);
  }
  addTexture() {
    this.cubeRenderTarget = new WebGLCubeRenderTarget(256, {
      format: RGBFormat,
      generateMipmaps: true,
      minFilter: LinearMipmapLinearFilter,
      encoding: sRGBEncoding,
    });
    this.cubeCamera = new CubeCamera(0.1, 10, this.cubeRenderTarget);
    this.materialPerlin = new ShaderMaterial({
      vertexShader: perlinVertex,
      fragmentShader: perlinFragment,
      side: DoubleSide,
      uniforms: {
        uTime: { value: 0.0 },
      },
    });
    this.perlinBall = new Mesh(
      new SphereBufferGeometry(1, 32, 64),
      this.materialPerlin
    );
    this.perlinScene.add(this.perlinBall);
  }
  displacement = new Vector3();
  desiredVelocity = new Vector3();
  moveCamera(objectToMove: Object3D, maxSpeed = 0.05, tolerance = 0.1) {
    const pathVector = this.cameraPath[this.pathIndex];
    if (!pathVector) return;
    this.displacement.subVectors(pathVector, objectToMove.position);
    const distance = this.displacement.length();
    if (distance > tolerance) {
      let speed = distance / 3;
      speed = Math.min(speed, maxSpeed);
      this.desiredVelocity
        .copy(this.displacement)
        .multiplyScalar(speed / distance);
    } else {
      console.log("Changing path index!");
      this.desiredVelocity.set(0, 0, 0);
      this.pathIndex++;
    }
    objectToMove.position.addVectors(
      objectToMove.position,
      this.desiredVelocity
    );
  }
  private render() {
    const elapsedTime = this.clock.getElapsedTime();

    this.camera.lookAt(this.sun.position);
    this.moveCamera(this.camera);
    this.cubeCamera.update(this.renderer, this.perlinScene);
    this.materialSun.uniforms.uPerlin.value = this.cubeRenderTarget.texture;
    this.materialPerlin.uniforms.uTime.value = elapsedTime;
    this.materialSun.uniforms.uTime.value = elapsedTime;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.render());
  }
}

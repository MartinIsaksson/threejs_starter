import {
  AmbientLight,
  Clock,
  CubeCamera,
  CubeTextureLoader,
  DoubleSide,
  LinearMipmapLinearFilter,
  Mesh,
  PerspectiveCamera,
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
  constructor() {
    this.clock = new Clock();
    this.scene = new Scene();
    this.perlinScene = new Scene();
    this.camera = new PerspectiveCamera(75, sizes.width / sizes.height);
    this.camera.position.set(0, 2, 3);
    this.camera.lookAt(new Vector3(0, 0));
    // const ambientLight = new AmbientLight(0xff00ff, 0.5);
    // this.scene.add(ambientLight);
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
    this.scene.add(this.sun);
    this.renderer.setSize(sizes.width, sizes.height);
    this.render();
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
  private render() {
    const elapsedTime = this.clock.getElapsedTime();
    this.cubeCamera.update(this.renderer, this.perlinScene);
    this.materialSun.uniforms.uPerlin.value = this.cubeRenderTarget.texture;
    this.materialPerlin.uniforms.uTime.value = elapsedTime;
    this.materialSun.uniforms.uTime.value = elapsedTime;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.render());
  }
}

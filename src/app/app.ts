import {
  AmbientLight,
  Clock,
  CubeCamera,
  CubeTextureLoader,
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
import sunVertex from "./shaders/sun/vertex.glsl";
import sunFragment from "./shaders/sun/fragment.glsl";

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
  constructor() {
    this.clock = new Clock();
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, sizes.width / sizes.height);
    this.camera.position.set(0, 2, 3);
    this.camera.lookAt(new Vector3(0, 0));
    // const ambientLight = new AmbientLight(0xff00ff, 0.5);
    // this.scene.add(ambientLight);

    this.materialSun = new ShaderMaterial({
      vertexShader: sunVertex,
      fragmentShader: sunFragment,
      uniforms: {
        uTime: { value: 0.0 },
      },
    });
    this.sun = new Mesh(new SphereBufferGeometry(1, 32, 64), this.materialSun);
    this.scene.add(this.sun);
    this.addTexture();
    this.renderer.setSize(sizes.width, sizes.height);
    this.render();
  }
  addTexture() {
    this.cubeRenderTarget = new WebGLCubeRenderTarget(256, {
      format: RGBFormat,
      generateMipmaps: true,
      minFilter: LinearMipmapLinearFilter,
      encoding: sRGBEncoding,
    });
    this.cubeCamera = new CubeCamera(0.1, 10, this.cubeRenderTarget);
  }
  private render() {
    const elapsedTime = this.clock.getElapsedTime();
    this.cubeCamera.update(this.renderer, this.scene);
    this.materialSun.uniforms.uTime.value = elapsedTime;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.render());
  }
}

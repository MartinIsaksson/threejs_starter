import {
  AmbientLight,
  AxesHelper,
  Clock,
  CubeCamera,
  CubeTextureLoader,
  DoubleSide,
  LinearMipmapLinearFilter,
  Matrix4,
  Mesh,
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
  rotationMatrix: Matrix4;
  smallSun: Mesh;
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
    //this.camera.position.sub(new Vector3(1,1,1));

    console.log("distance", this.camera.position.distanceTo(this.sun.position));
    console.log("dot", this.camera.position.dot(this.sun.position));
    const cameraPositionTimeLine = gsap.timeline();
    const targetVector = new Vector3(-2, 5, 4);
    console.log("target vector", targetVector);
    const startPosition = this.camera.position.clone();
    // cameraTimeLine.fromTo();
    this.rotationMatrix = new Matrix4();
    const qm = new Quaternion();
    // this.rotationMatrix.lookAt(
    //   this.sun.position,
    //   this.camera.position,
    //   this.camera.up
    // );
    // targetQuaternion.setFromRotationMatrix(this.rotationMatrix);
    cameraPositionTimeLine.to(
      this.camera.position,
      {
        x: targetVector.x,
        y: targetVector.y,
        z: targetVector.z,
        duration: 2,
        onUpdate: () => {
          this.camera.lookAt(this.sun.position);
        },
        ease: "Sine.easeOut",
      },
      0
    );
    cameraPositionTimeLine.to(
      this.camera.position,
      {
        x: 0,
        y: 5,
        z: 0,
        duration: 4,
        onUpdate: () => {
          this.camera.lookAt(this.sun.position);
        },
        ease: "Sine.easeOut",
      },
      1
    );
    cameraPositionTimeLine.to(
      this.camera.position,
      {
        x: -0.4,
        y: 0.9,
        z: 0.8,
        duration: 5,
        delay: 2,
        onUpdate: () => {
          this.camera.quaternion.slerp(this.smallSun.quaternion, 0.07);
        },
        ease: "Sine.easeOut",
      },
      2
    );
    // cameraPositionTimeLine.pause();
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

    // this.camera.lookAt(this.sun.position);
    this.cubeCamera.update(this.renderer, this.perlinScene);
    this.materialSun.uniforms.uPerlin.value = this.cubeRenderTarget.texture;
    this.materialPerlin.uniforms.uTime.value = elapsedTime;
    this.materialSun.uniforms.uTime.value = elapsedTime;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.render());
  }
}

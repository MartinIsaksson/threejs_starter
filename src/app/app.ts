import { Plane } from "cannon";
import dat = require("dat.gui");

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Mesh,
  BoxGeometry,
  MeshStandardMaterial,
  Vector3,
  AxesHelper,
  AmbientLight,
  Clock,
  TextureLoader,
  PlaneGeometry,
  DoubleSide,
  DirectionalLight,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

export class App {
  private canvas: HTMLCanvasElement = document.getElementById(
    "main-canvas"
  ) as HTMLCanvasElement;
  private readonly renderer = new WebGLRenderer({
    canvas: this.canvas,
  });
  scene: Scene;
  camera: PerspectiveCamera;
  controls: OrbitControls;
  box: Mesh;
  clock: Clock;
  textureLoader: TextureLoader;
  material: MeshStandardMaterial;
  boxGeom: BoxGeometry;
  gui: dat.GUI;
  doorGeometry!: PlaneGeometry;
  door!: Mesh;
  gltfLoader: GLTFLoader;
  duckObj: any;
  directionalLight: DirectionalLight;

  constructor() {
    this.gui = new dat.GUI();
    this.textureLoader = new TextureLoader();
    this.gltfLoader = new GLTFLoader();
    this.clock = new Clock();
    this.scene = new Scene();
    const axisHelper = new AxesHelper(5);
    this.scene.add(axisHelper);
    this.camera = new PerspectiveCamera(75, sizes.width / sizes.height);
    this.camera.position.z = 3;
    this.camera.lookAt(new Vector3(0, 0, 0));
    this.camera.position.set(3, 3, 3);
    this.scene.add(this.camera);

    const gnuTexture = this.textureLoader.load("/static/gnu.png");

    const ambientLight = new AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    this.directionalLight = new DirectionalLight(0xffffff, 0.6);
    this.directionalLight.castShadow = true;
    this.directionalLight.position.set(5, 5, 5);
    this.scene.add(this.directionalLight);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.boxGeom = new BoxGeometry(1, 1, 1);
    this.material = new MeshStandardMaterial({ map: gnuTexture });
    this.box = new Mesh(this.boxGeom, this.material);
    this.box.position.x = 2;
    this.gui.add(this.box.position, "x", -1, 4, 0.001);
    const floorMaterial = new MeshStandardMaterial();
    const floor = new Mesh(new PlaneGeometry(2, 2, 16, 16), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // this.generateDoor();
    this.scene.add(this.box);

    this.renderer.setSize(sizes.width, sizes.height);
    this.loadDuck();
    this.render();
  }

  async loadDuck() {
    const gltf = await this.gltfLoader.loadAsync("/static/duck/Duck.gltf");
    this.duckObj = gltf.scene.children[0];
    this.scene.add(this.duckObj);
    console.log("gltf after load", gltf);
  }

  generateDoor() {
    const colorTexture = this.textureLoader.load("/static/door/color.jpg");
    const alphaTexture = this.textureLoader.load("/static/door/alpha.jpg");
    const ambientOcclusionTexture = this.textureLoader.load(
      "/static/door/ambientOcclusion.jpg"
    );
    const heightTexture = this.textureLoader.load("/static/door/height.jpg");
    const metalnessTexture = this.textureLoader.load(
      "/static/door/metalness.jpg"
    );
    const normalTexture = this.textureLoader.load("/static/door/normal.jpg");
    const roughnessTexture = this.textureLoader.load(
      "/static/door/roughness.jpg"
    );

    this.doorGeometry = new PlaneGeometry(1.5, 2, 32, 64);
    this.door = new Mesh(
      this.doorGeometry,
      new MeshStandardMaterial({
        map: colorTexture,
        normalMap: normalTexture,
        displacementMap: heightTexture,
        displacementScale: 0.1,
        transparent: true,
        alphaMap: alphaTexture,
        side: DoubleSide,
        aoMap: ambientOcclusionTexture,
        metalnessMap: metalnessTexture,
        roughnessMap: roughnessTexture,
      })
    );
    this.scene.add(this.door);
  }
  private render() {
    const elapsedTime = this.clock.getElapsedTime();

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.render());
  }
}

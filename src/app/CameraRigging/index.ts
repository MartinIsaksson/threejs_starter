import { Flow } from "three/examples/jsm/modifiers/CurveModifier.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Clock,
  Color,
  GridHelper,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  ShadowMaterial,
  SpotLight,
  Vector3,
  WebGLRenderer,
} from "three";
import { Material } from "cannon";

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const ARG_SEGMENTS = 200;
export class CameraRigging {
  canvas: HTMLCanvasElement = document.getElementById(
    "main-canvas"
  ) as HTMLCanvasElement;
  renderer = new WebGLRenderer({
    canvas: this.canvas,
    antialias: true,
  });
  scene: Scene;
  camera: PerspectiveCamera;
  clock: Clock;
  orbitControls!: OrbitControls;
  transformControls!: TransformControls;
  raycaster = new Raycaster();
  boxGeometry = new BoxGeometry(20, 20, 20);
  constructor() {
    this.clock = new Clock();
    this.scene = new Scene();
    this.scene.background = new Color(0xf0f0f0);

    this.camera = new PerspectiveCamera(
      75,
      sizes.width / sizes.height,
      0.1,
      10000
    );
    this.camera.position.set(0, 250, 1000);
    this.camera.lookAt(new Vector3());
    this.scene.add(this.camera);
    this.addPoints();
    this.addLights();
    this.addControls();
    this.addGrid();
    const box = new Mesh(
      new BoxGeometry(10, 10, 10),
      new MeshBasicMaterial({ color: "red" })
    );
    this.scene.add(box);
    // new Flow();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setSize(sizes.width, sizes.height);
    this.render();
  }
  addPoints() {
    const bufferGeometry = new BufferGeometry();
    bufferGeometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(ARG_SEGMENTS * 3), 3)
    );
    const curve = new CatmullRomCurve3([
      new Vector3(289.76843686945404, 452.51481137238443, 56.10018915737797),
      new Vector3(-53.56300074753207, 171.49711742836848, -14.495472686253045),
      new Vector3(-91.40118730204415, 176.4306956436485, -6.958271935582161),
      new Vector3(-383.785318791128, 491.1365363371675, 47.869296953772746),
    ]);
    const points = curve.getPoints(ARG_SEGMENTS);
    const line = new Line()
  }
  addControls() {
    // Controls
    this.orbitControls = new OrbitControls(this.camera, this.canvas);
    this.orbitControls.enableDamping = true;
    this.transformControls = new TransformControls(this.camera, this.canvas);
  }
  adjustCanvasSize() {}
  addLights() {
    this.scene.add(new AmbientLight(0xf0f0f0, 0.5));
    const light = new SpotLight(0xffffff, 1.5);
    light.position.set(0, 1500, 200);
    light.angle = Math.PI * 0.2;
    light.castShadow = true;
    light.shadow.camera.near = 200;
    light.shadow.camera.far = 2000;
    light.shadow.bias = -0.000222;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    this.scene.add(light);
  }
  render() {
    this.orbitControls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.render());
  }
  addGrid() {
    const planeGeometry = new PlaneGeometry(2000, 2000);
    planeGeometry.rotateX(-Math.PI / 2);
    const planeMaterial = new ShadowMaterial({ opacity: 0.2 });

    const plane = new Mesh(planeGeometry, planeMaterial);
    plane.position.y = -200;
    plane.receiveShadow = true;
    this.scene.add(plane);

    const helper = new GridHelper(2000, 100);
    helper.position.y = -199;
    (helper.material as LineBasicMaterial).opacity = 0.25;
    (helper.material as LineBasicMaterial).transparent = true;
    this.scene.add(helper);
  }
}

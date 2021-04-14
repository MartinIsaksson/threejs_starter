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
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  ShadowMaterial,
  SpotLight,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { Material } from "cannon";

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const ARC_SEGMENTS = 200;
type curveType = "centripetal" | "chordal" | "catmullrom";
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
  positions: Vector3[] = [];
  curve: curveType = "chordal";
  curveHandles: Mesh[] = [];
  pointer = new Vector2();
  onDownPosition = new Vector2();
  onUpPosition = new Vector2();
  spline: {
    curve: CatmullRomCurve3;
    line: Line;
  };
  point = new Vector3();

  constructor() {
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setSize(sizes.width, sizes.height);

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
    this.addLights();
    this.addControls();
    this.addGrid();

    this.initialLoad([
      new Vector3(289.76843686945404, 452.51481137238443, 56.10018915737797),
      new Vector3(-53.56300074753207, 171.49711742836848, -14.495472686253045),
      new Vector3(-91.40118730204415, 176.4306956436485, -6.958271935582161),
      new Vector3(-383.785318791128, 491.1365363371675, 47.869296953772746),
    ]);
    this.spline = this.setupCurveAndPath(this.positions);
    this.updateCurveLine();

    // new Flow();

    this.addListeners();
    this.render();
    setTimeout(() => {
      this.addCurvePoint(new Vector3(100, 150, 20));
      this.addCurvePoint();
      (this.curveHandles[0].material as MeshBasicMaterial).color = new Color(
        0x000000
      );
      setTimeout(() => {
        this.addCurvePoint(new Vector3(150, 100, -20));
      }, 1000);
      console.log("FIRST CURVE HANDLE", this.curveHandles[0]);
    }, 2000);
  }

  addListeners() {
    document.addEventListener("pointermove", (event) => {
      this.onPointerMove(event);
    });
    document.addEventListener("pointerdown", (event) =>
      this.onPointerDown(event)
    );
    document.addEventListener("pointerup", (event) => this.onPointerUp(event));
  }

  setupCurveAndPath(positions: Vector3[]) {
    const bufferGeometry = new BufferGeometry();
    bufferGeometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(ARC_SEGMENTS * 3), 3)
    );
    const curve = new CatmullRomCurve3(positions, false, this.curve);
    // const points = curve.getPoints(ARC_SEGMENTS); //* Doesnt work, gets the last position as
    // const geometry = new BufferGeometry().setFromPoints(points);
    const line = new Line(
      bufferGeometry.clone(),
      new LineBasicMaterial({ color: 0x00ff00, opacity: 0.35 })
    );
    line.castShadow = true;
    this.scene.add(line);
    return { curve, line };
  }
  addCurvePoint(position?: Vector3) {
    this.positions.push(this.addCurveObject(position).position);
    this.updateCurveLine();
    return;
  }
  initialLoad(newPositions: Vector3[]) {
    let index = this.positions.length ? this.positions.length - 1 : 0;
    while (newPositions.length > this.positions.length) {
      this.addCurvePoint(newPositions[index]);
      index++;
    }
  }
  addCurveObject(position?: Vector3): Mesh {
    const boxMaterial = new MeshBasicMaterial({
      color: Math.random() * 0xffffff,
    });
    const handle = new Mesh(this.boxGeometry, boxMaterial);
    if (position) {
      handle.position.copy(position);
    } else {
      handle.position.copy(new Vector3());
    }
    handle.castShadow = true;
    handle.receiveShadow = true;
    this.curveHandles.push(handle);
    this.scene.add(handle);
    return handle;
  }
  updateCurveLine() {
    if (!this.spline || !this.spline.curve.points.length) return;
    const position = this.spline.line.geometry.attributes.position;
    for (let i = 0; i < ARC_SEGMENTS; i++) {
      const t = i / (ARC_SEGMENTS - 3);

      this.spline.curve.getPoint(t, this.point);

      position.setXYZ(i, this.point.x, this.point.y, this.point.z);
    }
    position.needsUpdate = true;
    this.spline.line.matrixWorldNeedsUpdate = true;
  }
  addControls() {
    // Controls
    this.orbitControls = new OrbitControls(this.camera, this.canvas);
    this.orbitControls.enableDamping = true;

    this.transformControls = new TransformControls(this.camera, this.canvas);
    this.transformControls.addEventListener("dragging-changed", (event) => {
      console.log("event", event);
      this.orbitControls.enabled = !event.value;
    });

    this.transformControls.addEventListener("objectChange", () => {
      this.updateCurveLine();
    });
    this.scene.add(this.transformControls);
  }

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
  onPointerDown(event: PointerEvent) {
    this.onDownPosition.x = event.clientX;
    this.onDownPosition.y = event.clientY;
    console.log("pointerDown", this.onDownPosition);
  }

  onPointerUp(event: PointerEvent) {
    this.onUpPosition.x = event.clientX;
    this.onUpPosition.y = event.clientY;
    console.log("pointerUp", this.onDownPosition);
    if (this.onDownPosition.distanceTo(this.onUpPosition) === 0)
      console.log("detaching transformControls", this.onDownPosition);
    this.transformControls.detach();
  }
  onPointerMove(event: PointerEvent) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    const intersects = this.raycaster.intersectObjects(this.curveHandles);
    if (intersects.length) {
      const object = intersects[0].object;
      if (object !== this.transformControls.object) {
        this.transformControls.attach(object);
      }
    }
  }
  render() {
    this.orbitControls.update();
    requestAnimationFrame(() => this.render());
    this.renderer.render(this.scene, this.camera);
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

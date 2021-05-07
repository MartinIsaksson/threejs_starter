import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  BufferAttribute,
  BufferGeometry,
  Camera,
  CameraHelper,
  CatmullRomCurve3,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SphereBufferGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import { GUI } from "dat.gui";

const randomColor = () => Math.random() * 0xffffff;
interface Spline {
  curve: CatmullRomCurve3;
  line: Line;
}
type CurveType = "centripetal" | "chordal" | "catmullrom";
interface CameraRigCurve {
  segments: number;
  curve: CurveType;
  loop: boolean;
  playTime: number;
  followPoint?: Vector3;
}
interface CameraRigSettings {
  pause: boolean;
  follow: boolean;
  onScroll: boolean;
}
export class CameraRig {
  //TODO PLAY PAUSE BOOLEAN THAT MAKES IT POSSIBLE TO ADJUST THE POINTS
  //TODO make component out of the camera rig functionality
  //Transform handling variables
  onPointerMoveFunc = (event: PointerEvent) => this.onPointerMove(event);
  onPointerDownFunc = (event: PointerEvent) => this.onPointerDown(event);
  onPointerUpFunc = (event: PointerEvent) => this.onPointerUp(event);
  onWheelFunc = (event: WheelEvent) => this.onWheel(event);
  pointer = new Vector2();
  onDownPosition = new Vector2();
  onUpPosition = new Vector2();
  controls!: TransformControls;
  orbitControls: OrbitControls;
  editPoints: Mesh[] = [];

  positions: Vector3[] = [];
  raycaster = new Raycaster();
  spline?: Spline;
  rigCurve?: CameraRigCurve;
  boxGeometry?: BufferGeometry;
  point?: Vector3;
  rigCameraHelper!: CameraHelper;
  enableShadow: boolean;
  rigCameraEye: Mesh;
  settings: CameraRigSettings;
  gui: GUI;
  time = 0;
  timeScale = 0.0001;
  deltaMultiplier = 0.0005;
  maxSpeed = 0.1;
  minSpeed = 0.0001;
  constructor(
    private renderer: WebGLRenderer,
    private scene: Scene,
    private rigCamera: PerspectiveCamera,
    orbitControls?: OrbitControls
  ) {
    //TODO add GUI to add points
    this.enableShadow = this.renderer.shadowMap.enabled;
    this.settings = {
      pause: false,
      follow: true,
      onScroll: false,
    };
    this.gui = new GUI({
      closed: false,
    });
    if (!orbitControls)
      this.orbitControls = new OrbitControls(
        this.rigCamera,
        this.renderer.domElement
      );
    else this.orbitControls = orbitControls;
    this.controls = new TransformControls(
      this.rigCamera,
      this.renderer.domElement
    );
    this.scene.add(this.controls);
    this.controls.visible = false;
    this.rigCameraHelper = new CameraHelper(this.rigCamera);
    this.scene.add(this.rigCameraHelper);
    this.rigCameraHelper.visible = false;
    this.rigCameraEye = new Mesh(
      new SphereBufferGeometry(1, 32, 32),
      new MeshLambertMaterial({ color: randomColor() })
    );
    this.scene.add(this.rigCameraEye);
    this.rigCameraEye.visible = false;
    this.init();
  }
  private init() {
    this.addListeners();
    this.addGui();
  }
  addGui() {
    const folder = this.gui.addFolder("Camera Rig");
    folder.add(this.settings, "pause").onFinishChange(() => {
      if (this.settings.pause) {
        document.removeEventListener("wheel", this.onWheelFunc);
        this.orbitControls.enabled = true;
      } else {
        this.orbitControls.enabled = !this.settings.follow;
        this.settings.follow
          ? document.addEventListener("wheel", this.onWheelFunc)
          : "";
      }
    });
    folder.add(this.settings, "follow").onFinishChange(() => {
      if (this.settings.follow) {
        this.orbitControls.enabled = false;
      } else {
        this.orbitControls.enabled = true;
      }
    });
    folder.add(this.settings, "onScroll").onFinishChange(() => {
      if (this.settings.onScroll) {
        document.addEventListener("wheel", this.onWheelFunc);
        this.orbitControls.enableZoom = false;
      } else {
        document.removeEventListener("wheel", this.onWheelFunc);
        this.orbitControls.enableZoom = this.settings.follow;
      }
    });
  }
  togglePause() {
    this.settings.pause = !this.settings.pause;
  }
  public update(delta: number) {
    if (!this.rigCurve || !this.spline || this.settings.pause) {
      this.orbitControls.enabled = true;
      return;
    } else if (!this.settings.onScroll) {
      this.time += delta;
    }

    const t = (this.time % this.rigCurve.playTime) / this.rigCurve.playTime;
    const next =
      ((this.time + 0.5) % this.rigCurve.playTime) / this.rigCurve.playTime;
    const position = this.spline.curve.getPointAt(t);
    if (this.rigCurve.followPoint && this.settings.follow) {
      this.rigCamera.lookAt(this.rigCurve.followPoint);
      //Set cameraHelper and Camera to look
    } else {
      const lookAtPos = this.spline.curve.getPointAt(next);
      this.rigCamera.lookAt(lookAtPos);
    }
    if (this.settings.follow) {
      this.rigCamera.position.copy(position);
    }
    this.rigCameraEye.position.copy(position);
    this.rigCameraHelper.update();
    this.orbitControls.update();
  }
  private addCurvePoint(position?: Vector3) {
    this.positions.push(this.addCurveObject(position).position);
    this.updateCurveLine();
    return;
  }
  private addCurveObject(position?: Vector3): Mesh {
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
    this.editPoints.push(handle);
    this.scene.add(handle);
    return handle;
  }
  updateCurveLine() {
    if (!this.spline || !this.spline.curve.points.length) return;
    const position = this.spline.line.geometry.attributes.position;
    for (let i = 0; i < this.rigCurve!.segments; i++) {
      const t = i / (this.rigCurve!.segments - 1);

      this.point = this.spline.curve.getPoint(t);

      position.setXYZ(i, this.point.x, this.point.y, this.point.z);
    }
    position.needsUpdate = true;
    this.spline.line.matrixWorldNeedsUpdate = true;
  }
  setupCurveAndPath(positions: Vector3[]) {
    const bufferGeometry = new BufferGeometry();
    bufferGeometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(this.rigCurve!.segments * 3), 3)
    );
    const curve = new CatmullRomCurve3(positions, true, this.rigCurve!.curve);
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
  public loadCurve(positions: Vector3[], rigCurve: CameraRigCurve) {
    this.rigCurve = rigCurve;
    //TODO RESET Things if load again?
    let index = this.positions.length ? this.positions.length - 1 : 0;
    while (positions.length > this.positions.length) {
      this.addCurvePoint(positions[index]);
      index++;
    }
    this.spline = this.setupCurveAndPath(this.positions);
    this.updateCurveLine();
    this.rigCameraHelper.visible = true;
    this.rigCameraEye.visible = true;
    this.controls.visible = true;
  }
  public destroy() {
    //TODO unregister all that can hold a state and REMOVE all the meshes boxes,lines,camera helper etc
    //Add a disposal helper method
    this.scene.remove(this.controls);
    this.scene.remove(this.rigCameraHelper);
    this.controls.dispose();
    this.editPoints.forEach((x) => {
      this.scene.remove(x);
      x.geometry.dispose(), (x.material as MeshBasicMaterial).dispose();
    });
    this.editPoints = [];
    this.positions = [];
    document.removeEventListener("pointermove", this.onPointerMoveFunc);
    document.removeEventListener("pointerdown", this.onPointerDownFunc);
    document.removeEventListener("pointerup", this.onPointerUpFunc);
  }

  private addListeners() {
    document.addEventListener("pointermove", this.onPointerMoveFunc);
    document.addEventListener("pointerdown", this.onPointerDownFunc);
    document.addEventListener("pointerup", this.onPointerUpFunc);
    this.controls.addEventListener("dragging-changed", (event) => {
      this.orbitControls.enabled = !event.value;
    });
    this.controls.addEventListener("objectChange", () => {
      this.updateCurveLine();
    });
    document.addEventListener("wheel", this.onWheelFunc);
  }
  onWheel(event: WheelEvent) {
    if (!this.settings.onScroll) return;
    if (event.deltaY < 0) {
      this.timeScale -= event.deltaY * this.deltaMultiplier;
      console.log(
        "this.timeScale * event.deltaY",
        this.timeScale * event.deltaY
      );
      this.time =
        Math.max(
          this.minSpeed,
          Math.min(this.maxSpeed, this.timeScale * event.deltaY)
        ) + this.time;
      console.log("Reverse", event.deltaY, this.time, this.timeScale);
      //dollyIn(getZoomScale());
    } else if (event.deltaY > 0) {
      this.timeScale += event.deltaY * this.deltaMultiplier;
      console.log("timeScale", this.timeScale);
      this.time =
        Math.max(
          this.minSpeed,
          Math.min(this.maxSpeed, this.timeScale / event.deltaY)
        ) + this.time;

      console.log("Forward", event.deltaY, this.time, this.timeScale);
    }
  }

  //#region  PointerEvents
  private onPointerDown(event: PointerEvent) {
    this.onDownPosition.x = event.clientX;
    this.onDownPosition.y = event.clientY;
    console.log("pointerDown", this.onDownPosition);
  }

  private onPointerUp(event: PointerEvent) {
    this.onUpPosition.x = event.clientX;
    this.onUpPosition.y = event.clientY;
    console.log("pointerUp", this.onDownPosition);
    if (this.onDownPosition.distanceTo(this.onUpPosition) === 0)
      console.log("detaching transformControls", this.onDownPosition);
    this.controls.detach();
  }
  private onPointerMove(event: PointerEvent) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.rigCamera);

    const intersects = this.raycaster.intersectObjects(this.editPoints);
    if (intersects.length) {
      const object = intersects[0].object;
      if (object !== this.controls.object) {
        this.controls.attach(object);
      }
    }
  }
}

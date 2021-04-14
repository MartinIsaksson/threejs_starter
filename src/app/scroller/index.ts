import { GUI } from "dat.gui";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  AdditiveBlending,
  AxesHelper,
  BoxGeometry,
  Clock,
  Color,
  DirectionalLight,
  FontLoader,
  Group,
  Layers,
  LoadingManager,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneBufferGeometry,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Quaternion,
  Raycaster,
  Scene,
  ShaderMaterial,
  SphereBufferGeometry,
  SphereGeometry,
  TextGeometry,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import particleFragment from "./shaders/particles/fragment.glsl";
import particleVertex from "./shaders/particles/vertex.glsl";
import bloomFragment from "./shaders/bloom/fragment.glsl";
import bloomVertex from "./shaders/bloom/vertex.glsl";
import { Material } from "cannon";
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const params = {
  exposure: 1,
  bloomStrength: 1.5,
  bloomThreshold: 0,
  bloomRadius: 0,
};
const BLOOM_SCENE = 1,
  ENTIRE_SCENE = 0;
export class SmoothScroll {
  canvas: HTMLCanvasElement = document.getElementById(
    "main-canvas"
  ) as HTMLCanvasElement;
  renderer = new WebGLRenderer({
    canvas: this.canvas,
    antialias: true,
  });
  light!: DirectionalLight;
  scene: Scene;
  camera: PerspectiveCamera;
  textureLoader: TextureLoader;
  controls?: OrbitControls;
  gui: GUI;
  scrollY: number = 0;
  position = 0;
  raycaster: Raycaster;
  mouse: Vector2;
  imageMeshes: Mesh[] = [];
  imageGroups: Group[] = [];
  fontLoader: FontLoader;
  loadingManager: LoadingManager;
  font: any;
  points?: Points;
  clock = new Clock();
  aspectRatio: number = sizes.width / sizes.height;
  bloomComposer!: EffectComposer;
  bloomPass!: UnrealBloomPass;
  bloomLayer: Layers;
  finalPass!: ShaderPass;
  renderScene!: RenderPass;
  finalComposer!: EffectComposer;
  darkMaterial = new MeshBasicMaterial({ color: "black" });
  materials: { [k: string]: any } = {};

  constructor() {
    gsap.registerPlugin(ScrollTrigger);
    this.bloomLayer = new Layers();
    this.bloomLayer.set(BLOOM_SCENE);
    // this.renderer.setClearColor(0xffffff);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setSize(sizes.width, sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.gui = new GUI();
    this.loadingManager = new LoadingManager();
    this.textureLoader = new TextureLoader(this.loadingManager);
    this.fontLoader = new FontLoader(this.loadingManager);
    this.scene = new Scene();
    this.scene.add(new AxesHelper(5));

    this.camera = new PerspectiveCamera(
      75,
      sizes.width / sizes.height,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(new Vector3());
    this.gui.add(this.camera.position, "y", -5, 5, 0.01);
    this.scene.add(this.camera);
    console.log("sizes", sizes);
    this.renderer.setSize(sizes.width, sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.setupBloomPass();
    this.setupFinalPass();
    this.setupLight();
    this.setupImagePlanes();
    this.setupParticles();
    this.raycaster = new Raycaster();
    this.mouse = new Vector2();
    this.addListeners();
    this.render();
  }
  setupFinalPass() {
    this.finalPass = new ShaderPass(
      new ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: this.bloomComposer.renderTarget2.texture },
        },
        vertexShader: bloomVertex,
        fragmentShader: bloomFragment,
        defines: {},
      }),
      "baseTexture"
    );
    this.finalPass.needsSwap = true;

    this.finalComposer = new EffectComposer(this.renderer);
    this.finalComposer.addPass(this.renderScene);
    this.finalComposer.addPass(this.finalPass);
  }
  private setupBloomPass() {
    this.bloomComposer = new EffectComposer(this.renderer);
    this.renderScene = new RenderPass(this.scene, this.camera);
    this.bloomComposer.addPass(this.renderScene);
    this.bloomComposer.renderToScreen = false;
    this.bloomPass = new UnrealBloomPass(
      new Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    this.bloomPass.threshold = params.bloomThreshold;
    this.bloomPass.strength = params.bloomStrength;
    this.bloomPass.radius = params.bloomRadius;
    this.gui.add(params, "exposure", 0.1, 2).onChange((value) => {
      this.renderer.toneMappingExposure = Math.pow(value, 4.0);
    });

    this.gui.add(params, "bloomThreshold", 0.0, 1.0).onChange((value) => {
      this.bloomPass.threshold = Number(value);
    });

    this.gui.add(params, "bloomStrength", 0.0, 3.0).onChange((value) => {
      this.bloomPass.strength = Number(value);
    });

    this.gui
      .add(params, "bloomRadius", 0.0, 1.0)
      .step(0.01)
      .onChange((value) => {
        this.bloomPass.radius = Number(value);
      });

    this.bloomComposer.addPass(this.bloomPass);
  }

  async setupParticles() {
    const texture = await this.textureLoader.loadAsync(
      "/static/images/volvo/c40FrontCropped.jpg"
    );
    const image = texture.image as HTMLImageElement;
    const particlesMaterial = new ShaderMaterial({
      fragmentShader: particleFragment,
      vertexShader: particleVertex,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vector2(sizes.width, sizes.height) },
        uDistortion: {
          value: 2,
        },
        uTexture: {
          value: texture,
        },
      },
    });
    const particlesGeometry = new PlaneBufferGeometry(
      10 * this.aspectRatio,
      10,
      image.width / 3,
      image.height / 3
    );
    this.points = new Points(particlesGeometry, particlesMaterial);
    this.points.position.set(0, this.camera.position.y, -2);
    this.points.layers.enable(BLOOM_SCENE);
    // this.scene.add(this.points);
  }
  async setupImagePlanes() {
    this.font = await this.fontLoader.loadAsync(
      "/static/fonts/helvetiker_regular.typeface.json"
    );

    const textMaterial = new MeshBasicMaterial();
    for (let i = 1; i < 5; i++) {
      const spacing = 3 + i * -1.8 * 3;
      console.log("loading first image");
      const texture = await this.textureLoader.loadAsync(
        `/static/images/image_${i}.jpg`
      );
      const image = texture.image as HTMLImageElement;
      const ratio = image.width / image.height;
      const heightRatio = image.height / image.width;
      console.log("ratios", ratio, "heighRatio:", heightRatio);
      const geom = new PlaneGeometry(ratio * 3, 3, 4, 4);
      geom.computeBoundingBox();
      const material = new MeshBasicMaterial({
        map: texture,
      });
      const imagePlane = new Mesh(geom, material);
      const randomX = Math.random();
      imagePlane.position.set(randomX, spacing, 0);
      const textGeometry = new TextGeometry(getText(i), {
        font: this.font,
        size: 0.2,
        height: 0.05,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.01,
        bevelOffset: 0,
        bevelSegments: 5,
      });
      const textMesh = new Mesh(textGeometry, textMaterial);
      textMesh.layers.toggle(ENTIRE_SCENE);
      textGeometry.center();
      console.log(textGeometry.boundingBox?.max.x);
      console.log(textGeometry.boundingBox);
      textMesh.position.set(geom.boundingBox!.min.x, spacing, 0);
      const group = new Group();
      group.add(imagePlane);
      group.add(textMesh);
      this.imageGroups.push(group);
      this.imageMeshes.push(imagePlane);
    }
    this.scene.add(...this.imageGroups);
  }

  addListeners() {
    window.addEventListener("resize", () => {
      sizes.height = window.innerHeight;
      sizes.width = window.innerWidth;
      this.aspectRatio = sizes.width / sizes.height;
      this.camera.aspect = this.aspectRatio;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(sizes.width, sizes.height);
      this.bloomComposer.setSize(sizes.width, sizes.height);
      this.finalComposer.setSize(sizes.width, sizes.height);
      (this.points
        ?.material as ShaderMaterial).uniforms.uResolution.value = new Vector2(
        sizes.width,
        sizes.height
      );
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      console.log("resize sizes", sizes);
      this.render();
    });
    window.addEventListener("wheel", (event: WheelEvent) => {
      this.scrollY = -event.deltaY * 0.005;
    });
    window.addEventListener("mousemove", (event: MouseEvent) => {
      //Normalize the vector
      const x = (event.clientX / sizes.width) * 2 - 1;
      const y = -((event.clientY / sizes.height) * 2 - 1);
      this.mouse.set(x, y);
    });
  }
  objectsActive: Map<number, boolean> = new Map<number, boolean>();
  render() {
    const elapsed = this.clock.getElapsedTime();
    this.position += this.scrollY;
    this.scrollY *= 0.9;
    this.camera.position.y = this.position;
    if (this.points) {
      console.log("updating points", elapsed);
      this.points.position.y = this.position;
      (this.points.material as ShaderMaterial).uniforms.uTime.value = elapsed;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.imageMeshes);
    const intersectedObjects = intersects.map((x) => x.object.id);
    for (let group of this.imageGroups) {
      const image = group.children[0] as Mesh;
      const imageGeom = image.geometry as PlaneGeometry;
      const rotationMatrix = new Matrix4();
      const targetQuaternion = new Quaternion();

      const text = group.children[1];
      const isActive = this.objectsActive.get(group.children[0].id);
      if (intersectedObjects.includes(group.children[0].id)) {
        if (!isActive) {
          this.objectsActive.set(group.children[0].id, true);
          gsap.to(image.scale, { x: 1.7, y: 1.7, duration: 1.5 });
          gsap.to(image.rotation, { y: -Math.PI / 6, duration: 1.5 });

          gsap.to(text.position, { z: 1.5, x: -0.5, duration: 1 });
        } else {
          gsap.to(text.quaternion, {
            onUpdate: () => {
              // const cameraNormalPos = this.camera.position.normalize();
              // const dVec3 = text.position.clone().sub(this.camera.position);
              rotationMatrix.lookAt(
                this.camera.position,
                text.position,
                text.up
              );
              targetQuaternion.setFromRotationMatrix(rotationMatrix);
              // const testAngle = Math.atan2(dVec3.y, dVec3.x) * (180 / Math.PI);
              text.quaternion.rotateTowards(targetQuaternion, 0.5);
              // text.rotation.x = -testAngle;
              // text.rotateOnAxis(new Vector3(1, 0, 0), testAngle);
              // text.quaternion.setFromAxisAngle(this.camera.position, 0.5);
            },
          });
        }
      } else {
        this.objectsActive.set(group.children[0].id, false);
        gsap.to(image.scale, { x: 1, y: 1, duration: 1.5 });
        gsap.to(image.rotation, { y: 0, duration: 0.5 });
        gsap.to(text.quaternion, {
          onStart: () => {
            const dVec3 = text.position.clone().sub(new Vector3(0, 0, 5));
            rotationMatrix.lookAt(dVec3, text.position, text.up);
            text.quaternion.rotateTowards(targetQuaternion, 180);
          },
        });
        gsap.to(text.rotation, { y: 0, duration: 1 });
        gsap.to(text.position, {
          z: 0,
          x: imageGeom.boundingBox!.min.x,
          duration: 1,
        });
      }
    }

    this.renderBloom(true);
    this.finalComposer.render();
    // this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.render());
  }
  private renderBloom(mask: boolean) {
    // this.bloomComposer.render(true);
    if (mask === true) {
      this.scene.traverse((object) => this.darkenNonBloomed(object));
      this.bloomComposer.render();
      this.scene.traverse((object) => this.restoreMaterial(object));
    } else {
      this.camera.layers.set(BLOOM_SCENE);
      this.bloomComposer.render();
      this.camera.layers.set(ENTIRE_SCENE);
    }
  }
  darkenNonBloomed(obj: any) {
    console.log("object", obj);
    if (obj.isMesh && this.bloomLayer.test(obj.layers) === false) {
      this.materials[obj.uuid] = obj.material;
      obj.material = this.darkMaterial;
    }
  }

  restoreMaterial(obj: any) {
    console.log("object", obj);
    if (this.materials[obj.uuid]) {
      obj.material = this.materials[obj.uuid];
      delete this.materials[obj.uuid];
    }
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
}

const getText = (index: number): string => {
  switch (index) {
    case 1:
      return "Volvo. For Life";
    case 2:
      return "Environmental Impact";
    case 3:
      return "Green target";
    case 4:
      return "Perfection";
    default:
      return "Undefined";
  }
};

import { WebGLRenderer } from "three";
import { AmmoPhysics } from "three/examples/jsm/physics/AmmoPhysics.js";
export class Game {
  canvas: HTMLCanvasElement = document.getElementById(
    "container"
  ) as HTMLCanvasElement;
  renderer = new WebGLRenderer({
    canvas: this.canvas,
  });
  constructor() {
    // this
    //CAMERA
    //SCENE
    //DirectionalLight?
  }
  private render() {
    requestAnimationFrame(() => this.render());
  }
}

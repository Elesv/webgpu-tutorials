import { Camera } from "./camera.js";
import { Quaternion } from "./math/quaternion.js";
import { Vector3 } from "./math/vector3.js";

export class CameraController {
    sensitivity = 0.002;

    constructor(
        private canvas: HTMLCanvasElement,
        private camera: Camera
    ) {
        this.init();
    }

    private init() {
        this.canvas.addEventListener("mousedown", () => {
            this.canvas.requestPointerLock();
            window.addEventListener("keydown", (e) => {
                switch (e.key) {
                    case "w": {
                        this.camera.move(1.5);
                        break;
                    }
                    case "s": {
                        this.camera.move(-1.5);
                        break;
                    }
                    case "f": {
                        this.canvas.requestFullscreen().catch(err => {
                            console.error(`Failed to switch to fullscreen mode: ${err.message}`);
                        });
                        break;
                    }
                }
            });
        });

        document.addEventListener("mousemove", (e) => this.onMouseMove(e));
    }

    private onMouseMove(e: MouseEvent) {
        if (document.pointerLockElement !== this.canvas) {
            return;
        }

        const dx = e.movementX * this.sensitivity;
        const dy = e.movementY * this.sensitivity;

        this.camera.pitch(dy);
        this.camera.yaw(dx);
        this.camera.correctRoll();
    }
}

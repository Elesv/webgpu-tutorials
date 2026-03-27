import { AssetLoader } from "./asset-loader.js";
import { Mesh } from "./mesh.js";
import { Renderer } from "./renderer.js";

export class App {
    private frameRequestId!: number;;
    private renderer!: Renderer;
    private mesh!: Mesh;

    async Run() {
        this.mesh = await AssetLoader.loadMesh("vertices.json");
        const canvas = <HTMLCanvasElement>document.querySelector("canvas");

        try {
            this.renderer = await Renderer.create(
                canvas,
                () => this.start(),
                (info) => this.onDeviceLost(info)
            );
        } catch (error) {
            console.error("Failed to create renderer:", error);
        }
    }

    private onDeviceLost(info: GPUDeviceLostInfo) {
        console.warn(`Device Lost: ${info.message}`);
        this.stop();
        this.mesh.isUploaded = false;
    }

    private frame = (time: number) => {
        this.renderer.renderMesh(this.mesh);
        this.frameRequestId = requestAnimationFrame(this.frame);
    };

    private start() {
        this.frameRequestId = requestAnimationFrame(this.frame);
    }

    private stop() {
        cancelAnimationFrame(this.frameRequestId);
    }
}

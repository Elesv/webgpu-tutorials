import { AssetLoader } from "./asset-loader.js";
import { Geometry } from "./geometry.js";
import { Renderer } from "./renderer.js";

export class App {
    private frameRequestId!: number;;
    private renderer!: Renderer;
    private geometry!: Geometry;

    async Run(canvas: HTMLCanvasElement) {
        this.geometry = await AssetLoader.loadGeometry("assets/models/points.json");

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
        this.geometry.vertexBuffer = null;
    }

    private frame = (time: number) => {
        try {
            this.renderer.renderGeometry(this.geometry);
        } catch (error) {
            console.error("Failed to render geometry:", error);
        }
        this.frameRequestId = requestAnimationFrame(this.frame);
    };

    private start() {
        this.frameRequestId = requestAnimationFrame(this.frame);
    }

    private stop() {
        cancelAnimationFrame(this.frameRequestId);
    }
}

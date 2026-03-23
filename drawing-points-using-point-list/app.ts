import { AssetLoader } from "./asset-loader.js";
import { Geometry } from "./geometry.js";
import { Renderer } from "./renderer.js";

export class App {
    private frameRequestId!: number;;
    private renderer!: Renderer;
    private geometry!: Geometry;

    async Run() {
        this.geometry = await AssetLoader.loadGeometry("points.json");
        const canvas = <HTMLCanvasElement>document.querySelector("canvas");
        this.renderer = await Renderer.create(
            canvas, () => {
            this.start();
        }, (info) => {
            console.warn(`Device Lost: ${info.message}`);
            this.stop();
            this.geometry.vertexBuffer = null;
        });
    }

    frame = (time: number) => {
        this.renderer.renderGeometry(this.geometry);
        this.frameRequestId = requestAnimationFrame(this.frame);
    };

    start() {
        this.frameRequestId = requestAnimationFrame(this.frame);
    }

    stop() {
        cancelAnimationFrame(this.frameRequestId);
    }
}

import { AssetLibrary } from "./assets/asset-library.js";
import { AssetLoader } from "./assets/asset-loader.js";
import { CameraController } from "./camera-controller.js";
import { Camera } from "./camera.js";
import { Quaternion } from "./math/quaternion.js";
import { Vector3 } from "./math/vector3.js";
import { Mesh } from "./mesh.js";
import { Renderer } from "./renderer.js";
import { Skybox } from "./skybox.js";

export class App {
    private frameRequestId!: number;;
    private renderer!: Renderer;
    private skybox!: Skybox;
    private mesh!: Mesh;
    private camera: Camera = new Camera(new Vector3(0, 0, -10), Quaternion.identity());
    private cameraController!: CameraController;
    private assetLibrary!: AssetLibrary;

    private async loadAssets() {
        await this.assetLibrary.loadShader(
            "shaders/mesh.wgsl",
            "mesh-shader",
            "vs_main",
            "fs_main",
            [{
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.FRAGMENT,
                        sampler: { type: "filtering" },
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.FRAGMENT,
                        texture: { sampleType: "float" },
                    },
                    {
                        binding: 2,
                        visibility: GPUShaderStage.VERTEX,
                        buffer: { type: "uniform" },
                    }
                ],
            }], [{
                arrayStride: 20,
                stepMode: "vertex",
                attributes: [
                    { shaderLocation: 0, offset: 0, format: "float32x3" },
                    { shaderLocation: 1, offset: 12, format: "float32x2" },
                ]
            }]);

        await this.assetLibrary.loadShader(
            "shaders/mesh.wgsl",
            "mesh-shader",
            "vs_main",
            "fs_main",
            [{
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.FRAGMENT,
                        sampler: {
                            type: "filtering",
                        }
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.FRAGMENT,
                        texture: {
                            sampleType: "float",
                            viewDimension: "cube",
                        }
                    },
                    {
                        binding: 2,
                        visibility: GPUShaderStage.VERTEX,
                        buffer: { type: "uniform" },
                    },
                ]
            }], [{
                arrayStride: 12,
                stepMode: "vertex",
                attributes: [
                    { shaderLocation: 0, offset: 0, format: "float32x3" },
                ],
            }]);
    }

    async Run(canvas: HTMLCanvasElement) {
        this.assetLibrary = new AssetLibrary();
        this.loadAssets();

        this.skybox = await AssetLoader.loadSkybox(
            "assets/models/skybox.json",
            "assets/textures/cubemap.png");

        this.mesh = await AssetLoader.loadMesh(
            "assets/models/mesh.json",
            "assets/textures/texture.png");

        this.cameraController = new CameraController(canvas, this.camera);

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
        try {
            this.renderer.render(this.skybox, this.mesh, this.camera);
        } catch (error) {
            console.error("Failed to render mesh:", error);
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

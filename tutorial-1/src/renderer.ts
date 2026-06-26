import { AssetLoader } from './asset-loader.js';
import { Geometry } from './geometry.js';
import { Vertex } from './vertex.js';

export class Renderer {
    private static NUMBER_OF_COORDINATES_PER_VERTEX = 3;
    private static SIZE_OF_VERTEX = Renderer.NUMBER_OF_COORDINATES_PER_VERTEX * Float32Array.BYTES_PER_ELEMENT;

    private shaderCode: string;
    private canvas: HTMLCanvasElement;
    private context!: GPUCanvasContext;
    private device!: GPUDevice;
    private textureFormat!: GPUTextureFormat;
    private pipeline!: GPURenderPipeline;

    private onInitSuccessful: () => void;
    private onDeviceLost: (info: GPUDeviceLostInfo) => void;

    static async create(
        canvas: HTMLCanvasElement,
        onInitSuccessful: () => void,
        onDeviceLost: (info: GPUDeviceLostInfo) => void) {

        const shaderCode = await AssetLoader.loadShader("shaders/shaders.wgsl");
        const renderer = new Renderer(canvas, shaderCode, onInitSuccessful, onDeviceLost);

        await renderer.init();
        return renderer;
    }

    private async init() {
        if (!navigator.gpu) {
            throw new Error("WebGPU is not supported.");
        }

        const context = this.canvas.getContext('webgpu');
        if (!context) {
            throw new Error("Failed to acquire WebGPU context.");
        }
        this.context = context;

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error("Failed to request GPU adapter.")
        }

        this.device = await adapter.requestDevice();
        this.device.lost.then(async (info) => {
            this.onDeviceLost(info);
            try {
                await this.init();
            } catch (error) {
                console.error("Failed to reinitialize the renderer after device loss:", error);
            }
        });

        const observer = new ResizeObserver(() => this.resize());
        observer.observe(this.canvas);

        this.textureFormat = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure({
            device: this.device,
            format: this.textureFormat
        });

        const shaderModule = this.createShaderModule(this.shaderCode);
        this.pipeline = this.createPipeline(shaderModule, this.textureFormat);

        this.onInitSuccessful();
    }

    private constructor(
        canvas: HTMLCanvasElement,
        shaderCode: string,
        onInitSuccessful: () => void,
        onDeviceLost: (info: GPUDeviceLostInfo) => void) {

        this.canvas = canvas;
        this.shaderCode = shaderCode;

        this.onInitSuccessful = onInitSuccessful;
        this.onDeviceLost = onDeviceLost;
    }

    private resize() {
        const dpr = window.devicePixelRatio || 1;
        const width = Math.floor(this.canvas.clientWidth * dpr);
        const height = Math.floor(this.canvas.clientHeight * dpr);

        if (this.canvas.width === width && this.canvas.height === height) {
            return;
        }

        this.canvas.width = width;
        this.canvas.height = height;

        this.context.configure({
            device: this.device,
            format: this.textureFormat
        });
    }

    private createVertexBuffer(vertices: Vertex[]): GPUBuffer {
        const vertexBuffer = this.device.createBuffer({
            size: vertices.length * Renderer.SIZE_OF_VERTEX,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        });

        const vertexBufferPtr = new Float32Array(vertexBuffer.getMappedRange());
        for (let i = 0; i < vertices.length; ++i) {
            vertexBufferPtr[i * Renderer.NUMBER_OF_COORDINATES_PER_VERTEX + 0] = vertices[i].x;
            vertexBufferPtr[i * Renderer.NUMBER_OF_COORDINATES_PER_VERTEX + 1] = vertices[i].y;
            vertexBufferPtr[i * Renderer.NUMBER_OF_COORDINATES_PER_VERTEX + 2] = vertices[i].z;
        }

        vertexBuffer.unmap();
        return vertexBuffer;
    }

    private createShaderModule(code: string): GPUShaderModule {
        return this.device.createShaderModule({ code: code });
    }

    private createPipeline(shaderModule: GPUShaderModule, textureFormat: GPUTextureFormat): GPURenderPipeline {
        const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [] });
        const vertexBufferLayout: GPUVertexBufferLayout = {
            arrayStride: Renderer.SIZE_OF_VERTEX,
            stepMode: "vertex",
            attributes: [
                {
                    shaderLocation: 0,
                    offset: 0,
                    format: "float32x3"
                }
            ]
        };

        return this.device.createRenderPipeline({
            vertex: {
                module: shaderModule,
                entryPoint: "vs_main",
                buffers: [vertexBufferLayout]
            },
            fragment: {
                module: shaderModule,
                entryPoint: "fs_main",
                targets: [{ format: textureFormat }],
            },
            primitive: { topology: "point-list" },
            layout: pipelineLayout,
        });
    }

    private createCommandBuffer(vertexBuffer: GPUBuffer): GPUCommandBuffer {
        const commandEncoder = this.device.createCommandEncoder();
        const texture = this.context.getCurrentTexture();
        const view = texture.createView();
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: view,
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: "clear",
                    storeOp: "store"
                }
            ]
        });

        renderPass.setVertexBuffer(0, vertexBuffer);
        renderPass.setPipeline(this.pipeline);
        renderPass.draw(vertexBuffer.size / Renderer.SIZE_OF_VERTEX);
        renderPass.end();

        return commandEncoder.finish();
    }

    uploadGeometry(geometry: Geometry) {
        geometry.vertexBuffer = this.createVertexBuffer(geometry.vertices);
    }

    renderGeometry(geometry: Geometry) {
        if(geometry.vertexBuffer === null) {
            this.uploadGeometry(geometry);
        }
        this.device.queue.submit([this.createCommandBuffer(geometry.vertexBuffer!)]);
    }
}

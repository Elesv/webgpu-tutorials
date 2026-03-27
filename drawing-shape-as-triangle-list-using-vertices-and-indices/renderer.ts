import { AssetLoader } from "./asset-loader.js";
import { Face } from "./face.js";
import { Mesh } from "./mesh.js";
import { Vertex } from "./vertex.js";

export class Renderer {
    private static NUMBER_OF_COORDINATES_PER_VERTEX = 3;
    private static SIZE_OF_VERTEX = Renderer.NUMBER_OF_COORDINATES_PER_VERTEX * Float32Array.BYTES_PER_ELEMENT;

    static async create(
        canvas: HTMLCanvasElement,
        onInitSuccessful: () => void,
        onDeviceLost: (info: GPUDeviceLostInfo) => void) {

        const shaderCode = await AssetLoader.loadShader("shaders.wgsl");
        const renderer = new Renderer(canvas, shaderCode, onInitSuccessful, onDeviceLost);

        await renderer.init();
        return renderer;
    }

    async init() {
        if (!navigator.gpu) {
            throw new Error("WebGPU is not supported.");
        }

        this.context = this.canvas.getContext('webgpu');
        if (!this.context) {
            throw new Error("Failed to acquire WebGPU context.");
        }

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

        const shaderModule = await this.createShaderModule(this.shaderCode);
        this.pipeline = this.createPipeline(shaderModule, this.textureFormat);

        this.onInitSuccessful();
    }

    private onInitSuccessful: () => void;
    private onDeviceLost: (info: GPUDeviceLostInfo) => void;

    private shaderCode: string;
    private canvas!: HTMLCanvasElement;
    private context!: GPUCanvasContext;
    private device!: GPUDevice;
    private textureFormat!: GPUTextureFormat;
    private pipeline!: GPURenderPipeline;

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

    resize() {
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
            size: vertices.length * 3 * 4,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });

        const vertexBufferPtr = new Float32Array(vertexBuffer.getMappedRange());
        for (let i = 0; i < vertices.length; ++i) {
            vertexBufferPtr[i * 3 + 0] = vertices[i].x;
            vertexBufferPtr[i * 3 + 1] = vertices[i].y;
            vertexBufferPtr[i * 3 + 2] = vertices[i].z;
        }

        vertexBuffer.unmap();
        return vertexBuffer;
    }

    private createIndexBuffer(faces: Face[]): GPUBuffer {
        const indexBuffer = this.device.createBuffer({
            size: faces.length * 3 * 2,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });

        const indexBufferPtr = new Int16Array(indexBuffer.getMappedRange());
        for (let i = 0; i < faces.length; ++i) {
            const face = faces[i];
            indexBufferPtr[i * 3 + 0] = face.a;
            indexBufferPtr[i * 3 + 1] = face.b;
            indexBufferPtr[i * 3 + 2] = face.c;
        }

        indexBuffer.unmap();
        return indexBuffer;
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
                entryPoint: "vertexMain",
                buffers: [vertexBufferLayout]
            },
            fragment: {
                module: shaderModule,
                entryPoint: "fragmentMain",
                targets: [{ format: textureFormat }],
            },
            primitive: { topology: "triangle-list" },
            layout: pipelineLayout,
        });
    }

    private createCommandBuffer(vertexBuffer: GPUBuffer, indexBuffer: GPUBuffer): GPUCommandBuffer {
        const commandEncoder = this.device.createCommandEncoder();
        const texture = this.context.getCurrentTexture();
        const view = texture.createView();
        const pass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: view,
                    clearValue: { r: 0.0, g: 0.0, b: 1.0, a: 1.0 },
                    loadOp: "clear",
                    storeOp: "store"
                }
            ]
        });

        pass.setVertexBuffer(0, vertexBuffer);
        pass.setIndexBuffer(indexBuffer, "uint16");
        pass.setPipeline(this.pipeline);
        pass.drawIndexed(indexBuffer.size / 2);
        pass.end();

        return commandEncoder.finish();
    }

    uploadMesh(mesh: Mesh) {
        mesh.vertexBuffer = this.createVertexBuffer(mesh.vertices);
        mesh.indexBuffer = this.createIndexBuffer(mesh.faces);
        mesh.isUploaded = true;
    }

    renderMesh(mesh: Mesh) {
        if (!mesh.isUploaded) {
            this.uploadMesh(mesh);
        }
        this.device.queue.submit([this.createCommandBuffer(mesh.vertexBuffer, mesh.indexBuffer)]);
    }
}

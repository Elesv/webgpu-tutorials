import { AssetLoader } from "./asset-loader.js";
import { Camera } from "./camera.js";
import { Face } from "./face.js";
import { Matrix4 } from "./math/matrix4.js";
import { Quaternion } from "./math/quaternion.js";
import { Vector3 } from "./math/vector3.js";
import { Mesh } from "./mesh.js";
import { Texture } from "./texture.js";
import { Vertex } from "./vertex.js";

export class Renderer {
    private static NUMBER_OF_COORDINATES_PER_VERTEX = 5;
    private static SIZE_OF_VERTEX = Renderer.NUMBER_OF_COORDINATES_PER_VERTEX * Float32Array.BYTES_PER_ELEMENT;

    private static NUMBER_OF_INDICES_PER_FACE = 3;
    private static SIZE_OF_FACE = Renderer.NUMBER_OF_INDICES_PER_FACE * Int16Array.BYTES_PER_ELEMENT;

    static async create(
        canvas: HTMLCanvasElement,
        onInitSuccessful: () => void,
        onDeviceLost: (info: GPUDeviceLostInfo) => void
    ) {
        const shaderCode = await AssetLoader.loadShader("shaders/shaders.wgsl");
        const renderer = new Renderer(canvas, shaderCode, onInitSuccessful, onDeviceLost);
        await renderer.init();
        return renderer;
    }

    async init() {
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
        shaderModule.getCompilationInfo().then((info) => {
            if (info.messages.length > 0) {
                console.warn("Shader compilation info:");
                info.messages.forEach((msg) => console.warn(`${msg.lineNum}:${msg.linePos} - ${msg.message}`));
            }
        });

        this.pipeline = this.createPipeline(shaderModule, this.textureFormat);
        this.uniformBuffer = this.createUniformBuffer();

        this.onInitSuccessful();
    }

    private onInitSuccessful: () => void;
    private onDeviceLost: (info: GPUDeviceLostInfo) => void;

    private shaderCode: string;
    private canvas: HTMLCanvasElement;
    private context!: GPUCanvasContext;
    private device!: GPUDevice;
    private textureFormat!: GPUTextureFormat;
    private pipeline!: GPURenderPipeline;
    private uniformBuffer!: GPUBuffer;
    private bindGroup!: GPUBindGroup;

    private constructor(
        canvas: HTMLCanvasElement,
        shaderCode: string,
        onInitSuccessful: () => void,
        onDeviceLost: (info: GPUDeviceLostInfo) => void
    ) {
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

    private createUniformBuffer(): GPUBuffer {
        const uniformBufferSize = Matrix4.BYTE_SIZE * 3;
        const uniformBuffer = this.device.createBuffer({
            size: uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        const world = new Matrix4().toFloat32Array();
        this.device.queue.writeBuffer(
            uniformBuffer,
            0,
            world.buffer,
            world.byteOffset,
            world.byteLength
        );

        const camera = new Camera(new Vector3(0,0,-10), Quaternion.identity());
        const view = camera.view().toFloat32Array();

        this.device.queue.writeBuffer(
            uniformBuffer,
            64,
            view.buffer,
            view.byteOffset,
            view.byteLength
        );

        const projection = Matrix4.perspectiveLH(
            Math.PI / 4,   // 45° FOV
            800 / 600,
            0.1,           // near plane
            1000.0         // far plane
        ).toFloat32Array();

        this.device.queue.writeBuffer(
            uniformBuffer,
            128,
            projection.buffer,
            projection.byteOffset,
            projection.byteLength
        );

        return uniformBuffer;
    }

    private createVertexBuffer(vertices: Vertex[]): GPUBuffer {
        const vertexBuffer = this.device.createBuffer({
            size: vertices.length * Renderer.SIZE_OF_VERTEX,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });

        const vertexBufferPtr = new Float32Array(vertexBuffer.getMappedRange());
        for (let i = 0; i < vertices.length; ++i) {
            vertexBufferPtr[i * Renderer.NUMBER_OF_COORDINATES_PER_VERTEX + 0] = vertices[i].x;
            vertexBufferPtr[i * Renderer.NUMBER_OF_COORDINATES_PER_VERTEX + 1] = vertices[i].y;
            vertexBufferPtr[i * Renderer.NUMBER_OF_COORDINATES_PER_VERTEX + 2] = vertices[i].z;
            vertexBufferPtr[i * Renderer.NUMBER_OF_COORDINATES_PER_VERTEX + 3] = vertices[i].u;
            vertexBufferPtr[i * Renderer.NUMBER_OF_COORDINATES_PER_VERTEX + 4] = vertices[i].v;
        }

        vertexBuffer.unmap();
        return vertexBuffer;
    }

    private createIndexBuffer(faces: Face[]): GPUBuffer {
        const indexBuffer = this.device.createBuffer({
            size: faces.length * Renderer.SIZE_OF_FACE,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });

        const indexBufferPtr = new Int16Array(indexBuffer.getMappedRange());
        for (let i = 0; i < faces.length; ++i) {
            const face = faces[i];
            indexBufferPtr[i * Renderer.NUMBER_OF_INDICES_PER_FACE + 0] = face.a;
            indexBufferPtr[i * Renderer.NUMBER_OF_INDICES_PER_FACE + 1] = face.b;
            indexBufferPtr[i * Renderer.NUMBER_OF_INDICES_PER_FACE + 2] = face.c;
        }

        indexBuffer.unmap();
        return indexBuffer;
    }

    private createTexture(bitmap: ImageBitmap): GPUTexture {
        const lTexture = this.device.createTexture({
            size: [bitmap.width, bitmap.height, 1],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        });
        this.device.queue.copyExternalImageToTexture(
            { source: bitmap },
            { texture: lTexture },
            [bitmap.width, bitmap.height]
        );
        return lTexture;
    }

    private createShaderModule(code: string): GPUShaderModule {
        return this.device.createShaderModule({ code: code });
    }

    private createPipeline(
        shaderModule: GPUShaderModule,
        textureFormat: GPUTextureFormat
    ): GPURenderPipeline {
        const bindGroupLayout = this.device.createBindGroupLayout({
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
                    buffer: { type: "uniform" }
                }
            ],
        });

        const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
        const vertexBufferLayout: GPUVertexBufferLayout = {
            arrayStride: Renderer.SIZE_OF_VERTEX,
            stepMode: "vertex",
            attributes: [
                { shaderLocation: 0, offset: 0, format: "float32x3" },
                { shaderLocation: 1, offset: 3 * 4, format: "float32x2" },
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
            primitive: {
                topology: "triangle-list",
                cullMode: "back"
            },
            layout: pipelineLayout,
        });
    }

    private createBindGroup(texture: Texture): GPUBindGroup {
        const sampler = this.device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
        });
        return this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: sampler },
                { binding: 1, resource: texture.texture.createView() },
                { binding: 2, resource: this.uniformBuffer },
            ],
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

        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.setVertexBuffer(0, vertexBuffer);
        pass.setIndexBuffer(indexBuffer, "uint16");
        pass.drawIndexed(indexBuffer.size / Int16Array.BYTES_PER_ELEMENT);
        pass.end();

        return commandEncoder.finish();
    }

    uploadMesh(mesh: Mesh) {
        mesh.vertexBuffer = this.createVertexBuffer(mesh.vertices);
        mesh.indexBuffer = this.createIndexBuffer(mesh.faces);
        mesh.texture.texture = this.createTexture(mesh.texture.imageBitmap);
        this.bindGroup = this.createBindGroup(mesh.texture);
        mesh.isUploaded = true;
    }

    renderMesh(mesh: Mesh, camera: Camera) {
        if (!mesh.isUploaded) {
            this.uploadMesh(mesh);
        }

        const world = mesh.world.toFloat32Array();
        this.device.queue.writeBuffer(
            this.uniformBuffer,
            0,
            world.buffer,
            world.byteOffset,
            world.byteLength
        );

        const view = camera.view().toFloat32Array();
        this.device.queue.writeBuffer(
            this.uniformBuffer,
            64,
            view.buffer,
            view.byteOffset,
            view.byteLength
        );

        this.device.queue.submit(
            [this.createCommandBuffer(mesh.vertexBuffer, mesh.indexBuffer)]
        );
    }
}

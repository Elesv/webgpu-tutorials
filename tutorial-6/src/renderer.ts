import { Camera } from "./camera.js";
import { Face } from "./face.js";
import { Matrix4 } from "./math/matrix4.js";
import { toRadians } from "./math/utils.js";
import { Mesh } from "./mesh.js";
import { Texture } from "./texture.js";
import { MeshVertex } from "./mesh-vertex.js";
import { MeshPipeline } from "./pipelines/mesh-pipeline.js";
import { SkyboxPipeline } from "./pipelines/skybox-pipeline.js";
import { Skybox } from "./skybox.js";
import { SkyboxVertex } from "./skybox-vertex.js";

export class Renderer {
    private static NUMBER_OF_COORDINATES_PER_VERTEX = 5;
    private static VERTEX_SIZE = Renderer.NUMBER_OF_COORDINATES_PER_VERTEX * Float32Array.BYTES_PER_ELEMENT;

    private static NUMBER_OF_INDICES_PER_FACE = 3;
    private static FACE_SIZE = Renderer.NUMBER_OF_INDICES_PER_FACE * Uint32Array.BYTES_PER_ELEMENT;

    private canvas: HTMLCanvasElement;
    private context!: GPUCanvasContext;
    private device!: GPUDevice;
    private textureFormat!: GPUTextureFormat;
    private depthTexture!: GPUTexture;
    private meshUniformBuffer!: GPUBuffer;
    private skyboxUniformBuffer!: GPUBuffer;

    private skyboxPipeline!: SkyboxPipeline;
    private meshPipeline!: MeshPipeline;

    private onInitSuccessful: () => void;
    private onDeviceLost: (info: GPUDeviceLostInfo) => void;

    static async create(
        canvas: HTMLCanvasElement,
        onInitSuccessful: () => void,
        onDeviceLost: (info: GPUDeviceLostInfo) => void
    ) {
        const renderer = new Renderer(canvas, onInitSuccessful, onDeviceLost);
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

        this.textureFormat = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure({
            device: this.device,
            format: this.textureFormat
        });

        this.depthTexture = this.createDepthTexture();

        this.skyboxPipeline = await SkyboxPipeline.create();
        this.skyboxPipeline.init(this.textureFormat, this.device);

        this.meshPipeline = await MeshPipeline.create();
        this.meshPipeline.init(this.textureFormat, this.device);

        const projection = this.createPerspectiveProjection();
        this.meshUniformBuffer = this.createMeshUniformBuffer(projection);
        this.skyboxUniformBuffer = this.createSkyboxUniformBuffer(projection);

        const observer = new ResizeObserver(() => this.resize());
        observer.observe(this.canvas);

        this.onInitSuccessful();
    }

    private constructor(
        canvas: HTMLCanvasElement,
        onInitSuccessful: () => void,
        onDeviceLost: (info: GPUDeviceLostInfo) => void
    ) {
        this.canvas = canvas;
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

        this.depthTexture?.destroy();
        this.depthTexture = this.createDepthTexture();

        const projection = this.createPerspectiveProjection();

        this.device.queue.writeBuffer(
            this.meshUniformBuffer,
            Matrix4.BYTE_SIZE * 2,
            projection.buffer,
            projection.byteOffset,
            projection.byteLength
        );

        this.device.queue.writeBuffer(
            this.skyboxUniformBuffer,
            Matrix4.BYTE_SIZE * 1,
            projection.buffer,
            projection.byteOffset,
            projection.byteLength
        );
    }

    private createDepthTexture(): GPUTexture {
        return this.device.createTexture({
            size: {
                width: this.canvas.width,
                height: this.canvas.height,
                depthOrArrayLayers: 1
            },
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    private createPerspectiveProjection(): Float32Array {
        return Matrix4.perspectiveLH(
            toRadians(90),
            this.canvas.width / this.canvas.height,
            0.1,
            1000.0
        ).toFloat32Array();
    }

    private createMeshUniformBuffer(projection: Float32Array): GPUBuffer {
        const uniformBufferSize = Matrix4.BYTE_SIZE * 3;
        const uniformBuffer = this.device.createBuffer({
            size: uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.device.queue.writeBuffer(
            uniformBuffer,
            Matrix4.BYTE_SIZE * 2,
            projection.buffer,
            projection.byteOffset,
            projection.byteLength
        );

        return uniformBuffer;
    }

    private createSkyboxUniformBuffer(projection: Float32Array): GPUBuffer {
        const uniformBufferSize = Matrix4.BYTE_SIZE * 2;
        const uniformBuffer = this.device.createBuffer({
            size: uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.device.queue.writeBuffer(
            uniformBuffer,
            Matrix4.BYTE_SIZE * 1,
            projection.buffer,
            projection.byteOffset,
            projection.byteLength
        );

        return uniformBuffer;
    }

    private createMeshVertexBuffer(vertices: Float32Array): GPUBuffer {
        const vertexBuffer = this.device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        });

        const vertexBufferPtr = new Float32Array(vertexBuffer.getMappedRange());
        vertexBufferPtr.set(vertices);

        vertexBuffer.unmap();
        return vertexBuffer;
    }

    private createSkyboxVertexBuffer(vertices: Float32Array): GPUBuffer {
        const vertexBuffer = this.device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        });

        const vertexBufferPtr = new Float32Array(vertexBuffer.getMappedRange());
        vertexBufferPtr.set(vertices);

        vertexBuffer.unmap();
        return vertexBuffer;
    }

    private createIndexBuffer(faces: Uint32Array): GPUBuffer {
        const indexBuffer = this.device.createBuffer({
            size: faces.byteLength,
            usage: GPUBufferUsage.INDEX,
            mappedAtCreation: true
        });

        const indexBufferPtr = new Uint32Array(indexBuffer.getMappedRange());
        indexBufferPtr.set(faces);

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

    private createCubemapTexture(bitmap: ImageBitmap): GPUTexture {
        const faceSize = 1024;
        const cubeTexture = this.device.createTexture({
            size: {
                width: faceSize,
                height: faceSize,
                depthOrArrayLayers: 6,
            },
            format: "rgba8unorm",
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
            dimension: "2d",
            mipLevelCount: 1,
        });

        const faces = [
            { x: 2, y: 1 },
            { x: 0, y: 1 },
            { x: 1, y: 0 },
            { x: 1, y: 2 },
            { x: 1, y: 1 },
            { x: 3, y: 1 },
        ];

        for (let i = 0; i < 6; ++i) {
            const face = faces[i];
            this.device.queue.copyExternalImageToTexture({
                source: bitmap,
                origin: {
                    x: face.x * faceSize,
                    y: face.y * faceSize,
                },
            }, {
                texture: cubeTexture,
                origin: {
                    x: 0,
                    y: 0,
                    z: i,
                },
            }, {
                width: faceSize,
                height: faceSize,
            });
        }

        return cubeTexture;
    }

    private createMeshBindGroup(texture: Texture): GPUBindGroup {
        const sampler = this.device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
            mipmapFilter: "linear"
        });
        return this.device.createBindGroup({
            layout: this.meshPipeline.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: sampler },
                { binding: 1, resource: texture.texture.createView() },
                { binding: 2, resource: this.meshUniformBuffer },
            ],
        });
    }

    private createSkyboxBindGroup(texture: Texture): GPUBindGroup {
        const sampler = this.device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
            mipmapFilter: "linear",
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge",
            addressModeW: "clamp-to-edge"
        });
        return this.device.createBindGroup({
            layout: this.skyboxPipeline.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: sampler },
                {
                    binding: 1, resource: texture.texture.createView({
                        dimension: "cube"
                    })
                },
                { binding: 2, resource: this.skyboxUniformBuffer },
            ],
        });
    }

    private createCommandBuffer(skybox: Skybox, mesh: Mesh): GPUCommandBuffer {
        const commandEncoder = this.device.createCommandEncoder();
        const texture = this.context.getCurrentTexture();
        const view = texture.createView();
        const pass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: view,
                    clearValue: { r: 0, g: 0, b: 0, a: 0 },
                    loadOp: "clear",
                    storeOp: "store"
                }
            ],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        });

        this.renderSkybox(pass, skybox);
        this.renderMesh(pass, mesh);
        pass.end();

        return commandEncoder.finish();
    }

    uploadMesh(mesh: Mesh) {
        mesh.vertexBuffer = this.createMeshVertexBuffer(mesh.vertices);
        mesh.indexBuffer = this.createIndexBuffer(mesh.faces);
        mesh.texture.texture = this.createTexture(mesh.texture.imageBitmap);
        mesh.bindGroup = this.createMeshBindGroup(mesh.texture);
        mesh.isUploaded = true;
    }

    uploadSkybox(skybox: Skybox) {
        skybox.vertexBuffer = this.createSkyboxVertexBuffer(skybox.vertices);
        skybox.indexBuffer = this.createIndexBuffer(skybox.faces);
        skybox.texture.texture = this.createCubemapTexture(skybox.texture.imageBitmap);
        skybox.bindGroup = this.createSkyboxBindGroup(skybox.texture);
        skybox.isUploaded = true;
    }

    render(skybox: Skybox, mesh: Mesh, camera: Camera) {
        if (!skybox.isUploaded) {
            this.uploadSkybox(skybox);
        }

        if (!mesh.isUploaded) {
            this.uploadMesh(mesh);
        }

        const viewMatrix = camera.view();
        const worldArray = mesh.world.toFloat32Array();
        const viewArray = viewMatrix.toFloat32Array();

        const combined = new Float32Array(Matrix4.NUM_ENTRIES * 2);
        combined.set(worldArray, 0);
        combined.set(viewArray, Matrix4.NUM_ENTRIES);

        this.device.queue.writeBuffer(
            this.meshUniformBuffer,
            0,
            combined.buffer,
            combined.byteOffset,
            combined.byteLength
        );

        const viewMatrixWithoutTranslation = viewMatrix.clone();
        viewMatrixWithoutTranslation.m41 = 0;
        viewMatrixWithoutTranslation.m42 = 0;
        viewMatrixWithoutTranslation.m43 = 0;

        const viewWithoutTranslationArray = viewMatrixWithoutTranslation.toFloat32Array();

        this.device.queue.writeBuffer(
            this.skyboxUniformBuffer,
            0,
            viewWithoutTranslationArray.buffer,
            viewWithoutTranslationArray.byteOffset,
            viewWithoutTranslationArray.byteLength
        );

        this.device.queue.submit([this.createCommandBuffer(skybox, mesh)]);
    }

    renderMesh(pass: GPURenderPassEncoder, mesh: Mesh) {
        pass.setPipeline(this.meshPipeline.pipeline);
        pass.setVertexBuffer(0, mesh.vertexBuffer);
        pass.setIndexBuffer(mesh.indexBuffer, "uint32");
        pass.setBindGroup(0, mesh.bindGroup);
        pass.drawIndexed(mesh.indexBuffer.size / Uint32Array.BYTES_PER_ELEMENT);
    }

    renderSkybox(pass: GPURenderPassEncoder, skybox: Skybox) {
        pass.setPipeline(this.skyboxPipeline.pipeline);
        pass.setVertexBuffer(0, skybox.vertexBuffer);
        pass.setIndexBuffer(skybox.indexBuffer, "uint32");
        pass.setBindGroup(0, skybox.bindGroup);
        pass.drawIndexed(skybox.indexBuffer.size / Uint32Array.BYTES_PER_ELEMENT);
    }
}

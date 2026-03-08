interface Vertex {
    x: number;
    y: number;
    z: number;
}

class Renderer {
    private static NUMBER_OF_COORDINATES_PER_VERTEX = 3;
    private static SIZE_OF_VERTEX = Renderer.NUMBER_OF_COORDINATES_PER_VERTEX * Float32Array.BYTES_PER_ELEMENT;

    static async create() {
        const canvas = <HTMLCanvasElement | null>document.querySelector("canvas");
        if (!canvas) {
            throw new Error("The canvas hasn't been found.");
        }

        if (!navigator.gpu) {
            throw new Error("WebGPU is not supported.");
        }

        const context = canvas.getContext('webgpu');
        if (!context) {
            throw new Error("Failed to acquire WebGPU context.");
        }

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error("Failed to request GPU adapter.")
        }

        const device = await adapter.requestDevice();
        const textureFormat = navigator.gpu.getPreferredCanvasFormat();

        context.configure({
            device: device,
            format: textureFormat
        });

        const vertexBuffer = await Renderer.loadVertices("points.json", device);
        const shaderModule = await Renderer.createShaderModule("shaders.wgsl", device);
        const pipeline = Renderer.createPipeline(shaderModule, textureFormat, device);

        return new Renderer(context, device, vertexBuffer, pipeline);
    }

    private static async loadVertices(filename: string, device: GPUDevice): Promise<GPUBuffer> {
        const response = await fetch(filename);
        const vertices: Vertex[] = await response.json();
        const vertexBuffer = device.createBuffer({
            size: vertices.length * Renderer.SIZE_OF_VERTEX,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
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

    private static async createShaderModule(filename: string, device: GPUDevice): Promise<GPUShaderModule> {
        const file = await fetch(filename);
        const code = await file.text();
        return device.createShaderModule({ code: code });
    }

    private static createPipeline(
        shaderModule: GPUShaderModule,
        textureFormat: GPUTextureFormat,
        device: GPUDevice): GPURenderPipeline {

        const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [] });
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
        
        return device.createRenderPipeline({
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
            primitive: { topology: "point-list" },
            layout: pipelineLayout,
        });
    }

    private context: GPUCanvasContext;
    private device: GPUDevice;
    private vertexBuffer: GPUBuffer;
    private pipeline: GPURenderPipeline;

    private constructor(
        context: GPUCanvasContext,
        device: GPUDevice,
        vertexBuffer: GPUBuffer,
        pipeline: GPURenderPipeline) {

        this.context = context;
        this.device = device;
        this.vertexBuffer = vertexBuffer;
        this.pipeline = pipeline;
    }

    private createCommandBuffer(): GPUCommandBuffer {
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

        renderPass.setVertexBuffer(0, this.vertexBuffer);
        renderPass.setPipeline(this.pipeline);
        renderPass.draw(this.vertexBuffer.size / Renderer.SIZE_OF_VERTEX);
        renderPass.end();

        return commandEncoder.finish();
    }

    render() {
        this.device.queue.submit([this.createCommandBuffer()]);
        requestAnimationFrame(() => this.render());
    }
}

(await Renderer.create()).render();

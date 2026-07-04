import { AssetLoader } from "../assets/asset-loader.js";

export class MeshPipeline {
    private static NUM_COORDS_PER_VERTEX = 5;
    private static VERTEX_SIZE = MeshPipeline.NUM_COORDS_PER_VERTEX * Float32Array.BYTES_PER_ELEMENT;

    private shaderCode: string;
    pipeline!: GPURenderPipeline;

    static async create() {
        const shaderCode = await AssetLoader.loadText("shaders/mesh.wgsl");
        return new MeshPipeline(shaderCode);
    }

    private constructor(shaderCode: string) {
        this.shaderCode = shaderCode;
    }

    init(
        textureFormat: GPUTextureFormat,
        device: GPUDevice
    ) {
        const shaderModule = device.createShaderModule({ code: this.shaderCode });
        shaderModule.getCompilationInfo().then((info) => {
            if (info.messages.length > 0) {
                console.warn("Shader compilation info:");
                info.messages.forEach((msg) => console.warn(`${msg.lineNum}:${msg.linePos} - ${msg.message}`));
            }
        });

        const bindGroupLayout = device.createBindGroupLayout({
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

        const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
        const vertexBufferLayout: GPUVertexBufferLayout = {
            arrayStride: MeshPipeline.VERTEX_SIZE,
            stepMode: "vertex",
            attributes: [
                { shaderLocation: 0, offset: 0, format: "float32x3" },
                { shaderLocation: 1, offset: 12, format: "float32x2" },
            ]
        };

        this.pipeline = device.createRenderPipeline({
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
            primitive: {
                topology: "triangle-list",
                frontFace: 'cw',
                cullMode: "back"
            },
            depthStencil: {
                format: "depth24plus",
                depthWriteEnabled: true,
                depthCompare: "less"
            },
            layout: pipelineLayout,
        });
    }
}

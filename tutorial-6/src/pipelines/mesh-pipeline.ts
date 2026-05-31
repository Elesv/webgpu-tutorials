import { AssetLoader } from "../asset-loader.js";
import { Mesh } from "../mesh.js";

export class MeshPipeline {
    private static NUMBER_OF_COORDINATES_PER_VERTEX = 5;
    private static SIZE_OF_VERTEX = MeshPipeline.NUMBER_OF_COORDINATES_PER_VERTEX * Float32Array.BYTES_PER_ELEMENT;

    private shaderCode: string;
    pipeline!: GPURenderPipeline;

    static async create() {
        const shaderCode = await AssetLoader.loadShader("shaders/mesh.wgsl");
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
            arrayStride: MeshPipeline.SIZE_OF_VERTEX,
            stepMode: "vertex",
            attributes: [
                { shaderLocation: 0, offset: 0, format: "float32x3" },
                { shaderLocation: 1, offset: 3 * 4, format: "float32x2" },
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

    render(
        pass: GPURenderPassEncoder,
        mesh: Mesh
    ) {
        pass.setPipeline(this.pipeline);
        pass.setVertexBuffer(0, mesh.vertexBuffer);
        pass.setIndexBuffer(mesh.indexBuffer, "uint32");
        pass.setBindGroup(0, mesh.bindGroup);
        //pass.drawIndexed(mesh.faces.length * 3);
        pass.drawIndexed(mesh.indexBuffer.size / Uint32Array.BYTES_PER_ELEMENT);
    }
}

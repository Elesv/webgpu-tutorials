import { Shader } from "../shader.js";
import { Pipeline } from "./pipeline.js";

export class PipelineFactory {
    public static createGraphicsPipeline(
        device: GPUDevice, 
        shader: Shader,
        primitive: GPUPrimitiveState,
        depthStencil?: GPUDepthStencilState
    ): Pipeline {
        const pipeline = device.createRenderPipeline({
            layout: shader.pipelineLayout,
            vertex: {
                module: shader.module,
                entryPoint: "vs_main"
            },
            fragment: {
                module: shader.module,
                entryPoint: "fs_main",
                targets: [{ format: "bgra8unorm" }]
            },
            primitive,
            depthStencil
        });

        return new Pipeline(pipeline, shader);
    }
}
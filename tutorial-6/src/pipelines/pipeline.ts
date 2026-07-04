import { Shader } from "../shader.js";

export class Pipeline {
    readonly pipeline: GPURenderPipeline;
    readonly shader: Shader;

    constructor(
        pipeline: GPURenderPipeline,
        shader: Shader
    ) {
        this.pipeline = pipeline;
        this.shader = shader;
    }
}
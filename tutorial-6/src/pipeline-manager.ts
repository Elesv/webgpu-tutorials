import { Pipeline } from "./pipelines/pipeline.js";

export class PipelineManager {
    private cache = new Map<string, Pipeline>();

    constructor() {

    }

    public get(name: string): Pipeline {
        return this.cache.get(name)!;
    }
}
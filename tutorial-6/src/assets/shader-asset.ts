export class ShaderAsset {
    public readonly id: string;
    public readonly code: string;
    public readonly vertexEntryPoint: string;
    public readonly fragmentEntryPoint: string;
    public readonly bindGroups: GPUBindGroupLayoutDescriptor[];
    public readonly vertexBuffers: GPUVertexBufferLayout[];

    constructor(
        id: string,
        code: string,
        vertexEntryPoint: string,
        fragmentEntryPoint: string,
        bindGroups: GPUBindGroupLayoutDescriptor[],
        vertexBuffers: GPUVertexBufferLayout[],
    ) {
        this.id = id;
        this.code = code;
        this.vertexEntryPoint = vertexEntryPoint;
        this.fragmentEntryPoint = fragmentEntryPoint;
        this.bindGroups = bindGroups;
        this.vertexBuffers = vertexBuffers;
    }
}

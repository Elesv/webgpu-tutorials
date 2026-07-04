import { Texture } from "./texture.js";

export class Skybox {
    vertices: Float32Array;
    faces: Uint32Array;
    texture: Texture;

    vertexBuffer!: GPUBuffer;
    indexBuffer!: GPUBuffer;
    bindGroup!: GPUBindGroup;
    isUploaded: boolean = false;

    constructor(
        vertices: Float32Array,
        faces: Uint32Array,
        texture: Texture
    ) {
        this.vertices = vertices;
        this.faces = faces;
        this.texture = texture;
    }
}

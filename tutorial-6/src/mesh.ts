import { Matrix4 } from "./math/matrix4.js";
import { Texture } from "./texture.js";

export class Mesh {
    vertices: Float32Array;
    faces: Uint32Array;
    texture: Texture;
    world: Matrix4 = Matrix4.identity();

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
import { Face } from "./face.js";
import { SkyboxVertex } from "./skybox-vertex.js";
import { Texture } from "./texture.js";

export class Skybox {
    vertices: SkyboxVertex[]
    faces: Face[];
    texture: Texture;

    vertexBuffer!: GPUBuffer;
    indexBuffer!: GPUBuffer;
    bindGroup!: GPUBindGroup;
    isUploaded: boolean = false;

    constructor(
        vertices: SkyboxVertex[],
        faces: Face[],
        texture: Texture
    ) {
        this.vertices = vertices;
        this.faces = faces;
        this.texture = texture;
    }
}

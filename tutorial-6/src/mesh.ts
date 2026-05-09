import { Face } from "./face.js";
import { Matrix4 } from "./math/matrix4.js";
import { Texture } from "./texture.js";
import { Vertex } from "./vertex.js";

export class Mesh {
    vertices: Vertex[];
    faces: Face[];
    texture: Texture;
    world: Matrix4 = Matrix4.identity();

    vertexBuffer!: GPUBuffer;
    indexBuffer!: GPUBuffer;
    isUploaded: boolean = false;

    constructor(
        vertices: Vertex[],
        faces: Face[],
        texture: Texture
    ) {
        this.vertices = vertices;
        this.faces = faces;
        this.texture = texture;
    }
}

import { Matrix4 } from "./math/matrix4.js";
import { Mesh } from "./mesh.js";
import { Texture } from "./texture.js";

export class SceneObject {
    mesh: Mesh;
    texture: Texture;
    world: Matrix4 = Matrix4.identity();

    vertexBuffer!: GPUBuffer;
    indexBuffer!: GPUBuffer;
    isUploaded: boolean = false;

    constructor(
        mesh: Mesh,
        texture: Texture
    ) {
        this.mesh = mesh;
        this.texture = texture;
    }
}
import { Face } from "./face.js";
import { Vertex } from "./vertex.js";

export class Mesh {
    vertices: Vertex[];
    faces: Face[];

    vertexBuffer!: GPUBuffer;
    indexBuffer!: GPUBuffer;
    isUploaded: boolean = false;

    constructor(vertices: Vertex[], faces: Face[]) {
        this.vertices = vertices;
        this.faces = faces;
    }
}

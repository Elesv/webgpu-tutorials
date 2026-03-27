import { Vertex } from "./vertex.js";

export class Mesh {
    vertices: Vertex[];
    vertexBuffer!: GPUBuffer;
    isUploaded: boolean = false;

    constructor(vertices: Vertex[]) {
        this.vertices = vertices;
    }
}

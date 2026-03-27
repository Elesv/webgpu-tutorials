import { Vertex } from "./vertex.js";

export class Geometry {
    vertices: Vertex[];
    vertexBuffer: GPUBuffer | null = null;

    constructor(vertices: Vertex[]) {
        this.vertices = vertices;
    }
}

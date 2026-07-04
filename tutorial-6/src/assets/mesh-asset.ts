export class MeshAsset {
    vertices: Float32Array;
    faces: Uint32Array;

    constructor(vertices: Float32Array, faces: Uint32Array) {
        this.vertices = vertices;
        this.faces = faces
    }
}

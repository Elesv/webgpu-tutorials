import { Face } from "./face.js";
import { MeshVertex } from "./mesh-vertex.js";

export interface MeshModel {
    vertices: MeshVertex[];
    faces: Face[];
}
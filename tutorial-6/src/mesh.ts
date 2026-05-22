import { Face } from "./face.js";
import { Vertex } from "./vertex.js";

export interface Mesh {
    vertices: Vertex[];
    faces: Face[];
}
import { Face } from "./face.js";
import { SkyboxVertex } from "./skybox-vertex.js";

export interface SkyboxModel {
    vertices: SkyboxVertex[];
    faces: Face[];
}
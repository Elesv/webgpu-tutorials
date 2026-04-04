import { Face } from "./face.js";
import { Mesh } from "./mesh.js";
import { Vertex } from "./vertex.js";

export class AssetLoader {
        static async loadMesh(verticesFilename: string, facesFilename: string): Promise<Mesh> {
            const vertices: Vertex[] = await this.loadVertices(verticesFilename);
            const faces: Face[] = await this.loadFaces(facesFilename);
            return new Mesh(vertices, faces);
        }

        private static async loadVertices(filename: string): Promise<Vertex[]> {
            const response = await fetch(filename);
            const vertices: Vertex[] = await response.json();
            return vertices;
        }

        private static async loadFaces(filename: string): Promise<Face[]> {
            const response = await fetch(filename);
            const faces: Face[] = await response.json();
            return faces;
        }
    
        static async loadShader(filename: string): Promise<string> {
            const file = await fetch(filename);
            const text = await file.text();
            return text;
        }
}

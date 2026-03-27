import { Mesh } from "./mesh.js";
import { Vertex } from "./vertex.js";

export class AssetLoader {
        static async loadMesh(verticesFilename: string): Promise<Mesh> {
            const vertices: Vertex[] = await this.loadVertices(verticesFilename);
            return new Mesh(vertices);
        }

        private static async loadVertices(filename: string): Promise<Vertex[]> {
            const response = await fetch(filename);
            const vertices: Vertex[] = await response.json();
            return vertices;
        }
    
        static async loadShader(filename: string): Promise<string> {
            const file = await fetch(filename);
            const text = await file.text();
            return text;
        }
}

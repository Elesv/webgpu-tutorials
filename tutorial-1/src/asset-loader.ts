import { Geometry } from "./geometry.js";
import { Vertex } from "./vertex.js";

export class AssetLoader {
        static async loadGeometry(filename: string): Promise<Geometry> {
            const response = await fetch(filename);
            const vertices: Vertex[] = await response.json();
            return new Geometry(vertices);
        }
    
        static async loadShader(filename: string): Promise<string> {
            const file = await fetch(filename);
            const text = await file.text();
            return text;
        }
}

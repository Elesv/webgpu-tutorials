import { Mesh } from "./mesh.js";
import { Vertex } from "./vertex.js";

export class AssetLoader {
    static async loadMesh(url: string): Promise<Mesh> {
        const vertices: Vertex[] = await this.loadVertices(url);
        return new Mesh(vertices);
    }

    private static async loadVertices(url: string): Promise<Vertex[]> {
        const response = await fetch(AssetLoader.resolvePath(url));
        const vertices: Vertex[] = await response.json();
        return vertices;
    }

    static async loadShader(url: string): Promise<string> {
        const file = await fetch(AssetLoader.resolvePath(url));
        const text = await file.text();
        return text;
    }

    private static resolvePath(url: string) {
        const result = new URL(url, import.meta.url).href;
        return result;
    }
}

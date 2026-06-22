import { Geometry } from "./geometry.js";
import { Vertex } from "./vertex.js";

export class AssetLoader {
    static async loadGeometry(url: string): Promise<Geometry> {
        const response = await fetch(AssetLoader.resolvePath(url));
        const vertices: Vertex[] = await response.json();
        return new Geometry(vertices);
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

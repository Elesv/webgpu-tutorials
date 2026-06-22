import { Face } from "./face.js";
import { Mesh } from "./mesh.js";
import { Vertex } from "./vertex.js";

export class AssetLoader {
    static async loadMesh(verticesUrl: string, facesUrl: string): Promise<Mesh> {
        const vertices: Vertex[] = await this.loadVertices(verticesUrl);
        const faces: Face[] = await this.loadFaces(facesUrl);
        return new Mesh(vertices, faces);
    }

    private static async loadVertices(url: string): Promise<Vertex[]> {
        const response = await fetch(AssetLoader.resolvePath(url));
        const vertices: Vertex[] = await response.json();
        return vertices;
    }

    private static async loadFaces(url: string): Promise<Face[]> {
        const response = await fetch(AssetLoader.resolvePath(url));
        const faces: Face[] = await response.json();
        return faces;
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

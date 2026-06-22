import { Face } from "./face.js";
import { Mesh } from "./mesh.js";
import { Texture } from "./texture.js";
import { Vertex } from "./vertex.js";

export class AssetLoader {
    static async loadMesh(
        verticesUrl: string,
        facesUrl: string,
        textureUrl: string): Promise<Mesh> {

        const vertices: Vertex[] = await this.loadVertices(verticesUrl);
        const faces: Face[] = await this.loadFaces(facesUrl);
        const texture: Texture = await this.loadTexture(textureUrl);
        return new Mesh(vertices, faces, texture);
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
        const response = await fetch(AssetLoader.resolvePath(url));
        const text = await response.text();
        return text;
    }

    static async loadTexture(url: string): Promise<Texture> {
        const response = await fetch(AssetLoader.resolvePath(url));
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);
        return new Texture(imageBitmap);
    }

    private static resolvePath(url: string) {
        const result = new URL(url, import.meta.url).href;
        return result;
    }
}

import { Face } from "./face.js";
import { Mesh } from "./mesh.js";
import { Texture } from "./texture.js";
import { Vertex } from "./vertex.js";

export class AssetLoader {
    static async loadMesh(
        verticesFilename: string,
        facesFilename: string,
        textureFilename: string): Promise<Mesh> {

        const vertices: Vertex[] = await this.loadVertices(verticesFilename);
        const faces: Face[] = await this.loadFaces(facesFilename);
        const texture: Texture = await this.loadTexture(textureFilename);
        return new Mesh(vertices, faces, texture);
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
        const response = await fetch(filename);
        const text = await response.text();
        return text;
    }

    static async loadTexture(filename: string): Promise<Texture> {
        const response = await fetch(filename);
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);
        return new Texture(imageBitmap);
    }
}

import { Mesh } from "./mesh.js";
import { SceneObject } from "./scene-object.js";
import { Texture } from "./texture.js";

export class AssetLoader {
    static async loadMesh(
        meshFilename: string,
        textureFilename: string
    ): Promise<SceneObject> {
        const response = await fetch(meshFilename);
        const mesh: Mesh = await response.json();
        const texture: Texture = await this.loadTexture(textureFilename);
        return new SceneObject(mesh, texture);
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
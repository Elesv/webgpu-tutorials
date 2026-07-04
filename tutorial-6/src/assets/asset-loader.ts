import { MeshAsset } from "./mesh-asset.js";
import { Mesh } from "../mesh.js";
import { SkyboxModel } from "../skybox-model.js";
import { Skybox } from "../skybox.js";
import { Texture } from "../texture.js";

export class AssetLoader {
    static async loadMesh(
        modelFilename: string,
        textureFilename: string
    ): Promise<Mesh> {
        const response = await fetch(modelFilename);
        const model = await response.json();
        const asset = new MeshAsset(new Float32Array(model.vertices), new Uint32Array(model.faces));
        const texture: Texture = await this.loadTexture(textureFilename);
        return new Mesh(asset.vertices, asset.faces, texture);
    }

    static async loadSkybox(
        modelFilename: string,
        textureFilename: string
    ): Promise<Skybox> {
        const response = await fetch(modelFilename);
        const model = await response.json();
        const texture: Texture = await this.loadTexture(textureFilename);
        return new Skybox(new Float32Array(model.vertices), new Uint32Array(model.faces), texture);
    }

    static async loadText(url: string): Promise<string> {
        const response = await fetch(url);
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
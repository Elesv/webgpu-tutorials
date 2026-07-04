import { AssetLoader } from "./asset-loader.js";
import { MaterialAsset } from "./material-asset.js";
import { MeshAsset } from "./mesh-asset.js";
import { ShaderAsset } from "./shader-asset.js";
import { TextureAsset } from "./texture-asset.js";

export class AssetLibrary {
    private shaders = new Map<string, ShaderAsset>();
    private textures = new Map<string, TextureAsset>();
    private materials = new Map<string, MaterialAsset>();
    private meshes = new Map<string, MeshAsset>();

    async loadShader(
        url: string,
        id: string,
        vertexEntryPoint: string,
        fragmentEntryPoint: string,
        bindGroups: GPUBindGroupLayoutDescriptor[],
        vertexBuffers: GPUVertexBufferLayout[],
    ) {
        const code = await AssetLoader.loadText(url);
        this.shaders.set(
            id,
            new ShaderAsset(
                id,
                code,
                vertexEntryPoint,
                fragmentEntryPoint,
                bindGroups,
                vertexBuffers,
            )
        );
    }

    getShader(id: string): ShaderAsset {
        return this.shaders.get(id)!;
    }

    getTexture(name: string): TextureAsset {
        return this.textures.get(name)!;
    }

    getMaterial(name: string): MaterialAsset {
        return this.materials.get(name)!;
    }

    getMesh(name: string): MeshAsset {
        return this.meshes.get(name)!;
    }
}

import { ShaderAsset } from "./assets/shader-asset.js";

export class Shader {
    public readonly id: string;
    public readonly module: GPUShaderModule;
    public readonly bindGroupLayouts: GPUBindGroupLayout[];
    public readonly pipelineLayout: GPUPipelineLayout;

    constructor(device: GPUDevice, asset: ShaderAsset) {
        this.id = asset.id;
        this.module = device.createShaderModule({
            label: `${asset.id}_module`,
            code: asset.code
        });

        this.bindGroupLayouts = [];
        for (const bindGroup of asset.bindGroups) {
            this.bindGroupLayouts.push(device.createBindGroupLayout(bindGroup));
        }

        this.pipelineLayout = device.createPipelineLayout({
            label: `${asset.id}_layout`,
            bindGroupLayouts: this.bindGroupLayouts
        });
    }
}

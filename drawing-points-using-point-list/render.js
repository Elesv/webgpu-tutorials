"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Renderer {
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const canvas = document.querySelector("canvas");
            if (!canvas) {
                throw new Error("The canvas hasn't been found.");
            }
            if (!navigator.gpu) {
                throw new Error("WebGPU is not supported.");
            }
            const context = canvas.getContext('webgpu');
            if (!context) {
                throw new Error("Failed to acquire WebGPU context.");
            }
            this.context = context;
            const adapter = yield navigator.gpu.requestAdapter();
            if (!adapter) {
                throw new Error("Failed to request GPU adapter.");
            }
            this.device = yield adapter.requestDevice();
            const textureFormat = navigator.gpu.getPreferredCanvasFormat();
            this.context.configure({
                device: this.device,
                format: textureFormat
            });
            yield this.loadVertices("points.json");
            const shaderModule = yield this.createShaderModule("shaders.wgsl");
            this.pipeline = this.device.createRenderPipeline({
                vertex: {
                    module: shaderModule,
                    entryPoint: "vertexMain",
                    buffers: [{
                            arrayStride: 12,
                            stepMode: "vertex",
                            attributes: [
                                {
                                    shaderLocation: 0,
                                    offset: 0,
                                    format: "float32x3"
                                }
                            ]
                        }]
                },
                fragment: {
                    module: shaderModule,
                    entryPoint: "fragmentMain",
                    targets: [{ format: textureFormat }],
                },
                primitive: { topology: "point-list" },
                layout: "auto",
            });
            this.createCommandBuffer();
            this.render();
        });
    }
    loadVertices(filename) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(filename);
            const vertices = yield response.json();
            this.vertexBuffer = this.device.createBuffer({
                size: vertices.length * 3 * Float32Array.BYTES_PER_ELEMENT,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            });
            const vertexBufferPtr = new Float32Array(this.vertexBuffer.getMappedRange());
            for (let i = 0; i < vertices.length; ++i) {
                vertexBufferPtr[i * 3 + 0] = vertices[i].x;
                vertexBufferPtr[i * 3 + 1] = vertices[i].y;
                vertexBufferPtr[i * 3 + 2] = vertices[i].z;
            }
            this.vertexBuffer.unmap();
        });
    }
    createShaderModule(filename) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = yield fetch(filename);
            const code = yield file.text();
            return this.device.createShaderModule({ code: code });
        });
    }
    createCommandBuffer() {
        const commandEncoder = this.device.createCommandEncoder();
        const texture = this.context.getCurrentTexture();
        const view = texture.createView();
        const pass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: view,
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: "clear",
                    storeOp: "store"
                }
            ]
        });
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setPipeline(this.pipeline);
        pass.draw(this.vertexBuffer.size / 12);
        pass.end();
        return commandEncoder.finish();
    }
    render() {
        this.device.queue.submit([this.createCommandBuffer()]);
        requestAnimationFrame(() => this.render());
    }
}
const renderer = new Renderer();
renderer.init();

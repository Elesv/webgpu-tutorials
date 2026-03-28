export class Texture {
    imageBitmap: ImageBitmap;
    texture!: GPUTexture;

    constructor(imageBitmap: ImageBitmap) {
        this.imageBitmap = imageBitmap;
    }
}

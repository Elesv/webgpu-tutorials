import { Renderer } from './renderer.js';

let animationFrameRequestId: number | null = null;

async function bootstrap() {
    const canvas = <HTMLCanvasElement | null>document.querySelector("canvas");
    if (!canvas) {
        throw new Error("The canvas hasn't been found.");
    }

    if (animationFrameRequestId !== null) {
        cancelAnimationFrame(animationFrameRequestId);
    }
    try {
        const renderer = await Renderer.create(canvas, (info) => {
            console.warn(`Device Lost: ${info.message}`);
            handleDeviceLost();
        });

        const frame = (time: number) => {
            renderer.render();
            animationFrameRequestId = requestAnimationFrame(frame);
        };
        animationFrameRequestId = requestAnimationFrame(frame);
    } catch (error) {
        handleDeviceLost();
    }
}

function handleDeviceLost() {
    setTimeout(bootstrap, 1000);
}

bootstrap();

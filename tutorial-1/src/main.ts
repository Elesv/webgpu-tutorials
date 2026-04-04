import { App } from './app.js';

async function main() {
    const canvas = document.querySelector("canvas")!;
    const app = new App();
    await app.Run(canvas);
}

await main();

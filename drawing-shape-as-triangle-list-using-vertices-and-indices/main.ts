import { App } from './app.js';

async function main() {
    const app = new App();
    await app.Run();
}

await main();

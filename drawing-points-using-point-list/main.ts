import { App } from './app.js';

async function bootstrap() {
    const app = new App();
    await app.Run();
}

bootstrap();

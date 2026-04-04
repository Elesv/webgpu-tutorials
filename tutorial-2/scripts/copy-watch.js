import cpy from "cpy";
import chokidar from "chokidar";
import fs from "fs";
import path from "path";

async function copyAll() {
    try {
        fs.mkdirSync("dist", { recursive: true });
        await fs.promises.copyFile("public/index.html", "dist/index.html");
        await cpy("public/assets/**/*", "dist/assets", { parents: true });
        await cpy("public/styles/**/*", "dist/styles", { parents: true });
        await cpy("src/shaders/**/*", "dist/shaders", { parents: false });
        console.log("✅ Static files and shaders copied safely");
    } catch (err) {
        console.error("Error copying files:", err);
    }
}

copyAll();

const watcher = chokidar.watch([path.resolve("public")], { ignoreInitial: true });
watcher.on("all", async (event, path) => {
    console.log(`[${event}] ${path}`);
    await copyAll();
});

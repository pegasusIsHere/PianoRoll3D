import { PianoRoll3D } from './PianoRoll3D.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.8, 0.8, 0.8);

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2, 20, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

    // Create the sequencer grid
    const sequencer = new PianoRoll3D(scene, 5, 16, 60); // rows, cols, tempo

    engine.runRenderLoop(() => {
        sequencer.update();
        scene.render();
    });

    window.addEventListener("resize", () => {
        engine.resize();
    });
});

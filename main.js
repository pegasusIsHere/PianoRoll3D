import { PianoRoll3D } from './PianoRoll3D.js';
import { WebPianoRollManager } from './WebPianoRollManager.js';

let pianoRoll3D, webPianoRoll;
let currentBpm = 60;

const audioContext = new AudioContext();

window.addEventListener('DOMContentLoaded', async () => {

    
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.8, 0.8, 0.8);

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2, 20, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);
    
    
    // Set up WebAudio piano roll + synth
    webPianoRoll = new WebPianoRollManager(audioContext);
    await webPianoRoll.setup();
    console.log(webPianoRoll);

    // set timeout to wait for the WAM to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    pianoRoll3D = new PianoRoll3D(scene, 12, 16, 60, audioContext,webPianoRoll );
    const btnStart = document.querySelector("#btn-start");

    btnStart.onclick = () => {

        if (audioContext.state !== "running") {
          audioContext.resume();
        }
    
        if (btnStart.textContent === "Start") {
          pianoRoll3D.start();
          webPianoRoll.play(currentBpm);
          btnStart.textContent = "Stop";
        } else {
          pianoRoll3D.stop();
          webPianoRoll.stop();
          audioContext.suspend();
          btnStart.textContent = "Start";
        }
      };

      document.querySelector("#bpm").oninput = (e) => {
        currentBpm = parseInt(e.target.value);
        pianoRoll3D.setTempo(currentBpm);
        webPianoRoll.play(currentBpm);
      };


      
    engine.runRenderLoop(() => {
        if (pianoRoll3D) 
        pianoRoll3D.update();
        
        scene.render();
    });

    window.addEventListener("resize", () => {
        engine.resize();
    });
});

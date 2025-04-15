
// init the pianoRoll instance 
async function setup() {

const hostGroupId = await setupWamHost();
// First WAM: a piano roll for generating notes, sort of step sequencer
const wamURIPianoRoll = "https://www.webaudiomodules.com/community/plugins/burns-audio/pianoroll/index.js";
const pianoRollInstance = await loadDynamicComponent(wamURIPianoRoll, hostGroupId);
const pianoRollDiv = await pianoRollInstance.createGui();
showWam(pianoRollDiv, 10, 1000, 0.7, 500, 540);

// Second WAM: a synth to play the notes
// Example with a web assembly instrument (Pro24 synth) WAM compiled from C-Major code)
const wamURISynth = 'https://wam-4tt.pages.dev/Pro54/index.js';
synthInstance = await loadDynamicComponent(wamURISynth, hostGroupId);

// Display the WAM GUI (optionnal, WAMs can be used without GUI)
const synthDiv = await synthInstance.createGui();
showWam(synthDiv, 370, 1000, 0.7);

// Build the audio graph
// a WAM is always handled like a single Web Audio node, even if
// its made internally of many nodes
synthInstance.audioNode.connect(audioContext.destination);

// build the "MIDI graph" (connect the pianoRoll to the synth)
pianoRollInstance.audioNode.connectEvents(synthInstance.instanceId);

// Create the pianoRoll custom GUI
// parameters: number of rows, number of bars, time signature numerator, time signature denominator
pianoRollCustomGUI = new PianoRollCustomGUI(12, 1, 4, 4, currentBpm);

const startButton = document.querySelector("#btn-start");
startButton.onclick = () => {
  console.log(audioContext.state)
  if (audioContext.state !== "running") {
    audioContext.resume();
  }

  if (startButton.textContent === "Start") {
    pianoRollInstance.audioNode.scheduleEvents({
      type: 'wam-transport', data: {
        playing: true,
        timeSigDenominator: 4,
        timeSigNumerator: 4,
        currentBar: 0,
        currentBarStarted: audioContext.currentTime,
        tempo: currentBpm
      }
    });
    // start custom GUI
    pianoRollCustomGUI.start();

    startButton.textContent = "Stop";
  } else {

    pianoRollInstance.audioNode.scheduleEvents({
      type: 'wam-transport', data: {
        playing: false,
        timeSigDenominator: 4,
        timeSigNumerator: 4,
        currentBar: 0,
        currentBarStarted: audioContext.currentTime,
        tempo: currentBpm
      }
    });

    // stop custom GUI
    pianoRollCustomGUI.stop();

    startButton.textContent = "Start";
    // not mandatory. If present, allows a "play/pause" behavior.
    // if not, presing start will start from beginning each time.
    audioContext.suspend();
  }
}

// Listener for bpm change
const bpmInput = document.querySelector("#bpm");
bpmInput.oninput = (e) => {
  const bpm = parseInt(e.target.value);
  console.log(bpm);
  currentBpm = bpm;

  // adjust pianoRoll tempo
  pianoRollInstance.audioNode.scheduleEvents({
    type: 'wam-transport', data: {
      playing: true,
      timeSigDenominator: 4,
      timeSigNumerator: 4,
      currentBar: 0,
      currentBarStarted: audioContext.currentTime,
      tempo: bpm
    }
  });

  // adjust tempo of the pianoRoll custom GUI
  pianoRollCustomGUI.setTempo(bpm);
}
}
        // Initialize Babylon.js engine and create a scene
        var canvas = document.getElementById("renderCanvas");
        var engine = new BABYLON.Engine(canvas, true);
        var scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3(0.8, 0.8, 0.8);

        // Create a camera and light
        var camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2, 20, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvas, true);
        var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);


        // create grid buttons on the base mesh
        var rows = 5;
        var cols = 16;
        var buttonWidth = 2;
        var buttonHeight = 0.2;
        var buttonDepth = 2;
        var buttonSpacing = 0.5;
        var buttonColor = new BABYLON.Color3(0.2, 0.6, 0.8);
        
        // Calculate playhead X movement range
        var startX = -(cols - 1) / 2 * (buttonWidth + buttonSpacing);
        var endX = (cols - 1) / 2 * (buttonWidth + buttonSpacing);

        var buttonMaterial = new BABYLON.StandardMaterial("buttonMaterial", scene);
        buttonMaterial.diffuseColor = buttonColor;
        for (var i = 0; i < rows; i++) {
            for (var j = 0; j < cols; j++) {
                var buttonMesh = BABYLON.MeshBuilder.CreateBox("button" + i + "_" + j, { width: buttonWidth, height: buttonHeight, depth: buttonDepth }, scene);
                buttonMesh.position.x = (j - (cols - 1) / 2) * (buttonWidth + buttonSpacing);
                buttonMesh.position.z = (i - (rows - 1) / 2) * (buttonDepth + buttonSpacing);
                buttonMesh.position.y = buttonHeight / 2;
                buttonMesh.material = buttonMaterial;
            }
        }
        
        // create box height 2, width 2, depth 2
        var baseMesh = BABYLON.MeshBuilder.CreateBox("baseMesh", { width:endX-startX+buttonWidth,height:0.2,depth:15 }, scene);
        // baseMesh.position.y = 1; 
        

        // create play head move from the first button column to the last button column 
        var playhead = BABYLON.MeshBuilder.CreateBox("playhead", { width:0.1,height:0.2,depth:15 }, scene);
        var playheadMaterial = new BABYLON.StandardMaterial("playheadMaterial", scene);
        playheadMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
        playhead.material = playheadMaterial;
        playhead.position.y = 2;


        // Tempo setup
        var tempo = 60; // Beats per minute
        var timeSignatureNumerator = 4;
        var timeSignatureDenominator = 4; // 4 subdivisions per beat
      var subdivisionsPerBeat = timeSignatureDenominator;
      var beatDuration = 60 / tempo; // seconds
      var cellDuration = beatDuration / subdivisionsPerBeat; // seconds per cell
      var totalCells = cols; // one cell per column
      var gridWidth = (cols - 1) * (buttonWidth + buttonSpacing);
      var startTime = performance.now() / 1000; // in seconds



          // Render loop
          engine.runRenderLoop(function () {
          var now = performance.now() / 1000; // seconds
          var elapsed = now - startTime;
          // var currentCellFloat = (elapsed / cellDuration) % totalCells;
          var currentCellFloat = ((elapsed / cellDuration) % (cols - 0.0001));

          // work but not animated
          // var x = Math.floor(currentCellFloat) * (buttonWidth + buttonSpacing) 
          // - (cols - 1) / 2 * (buttonWidth + buttonSpacing);
          
          var rawCell = elapsed / cellDuration;
          var currentCellFloat = rawCell % cols;

          if (currentCellFloat > cols - 1) {
          currentCellFloat = cols - 1;
          }

          var x = (currentCellFloat * (buttonWidth + buttonSpacing)) 
          - ((cols - 1) / 2 * (buttonWidth + buttonSpacing));


          playhead.position.x = x;

          scene.render();
          });


      // Resize event
      window.addEventListener("resize", function () {
          engine.resize();
      });
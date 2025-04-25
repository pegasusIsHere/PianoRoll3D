export class PianoRoll3D {
    constructor(scene, rows, cols, tempo = 60,audioContext,webPianoRoll) {
        this.scene = scene;
        this.audioContext = audioContext;
        this.webPianoRoll = webPianoRoll;

        this.rows = rows;
        this.cols = cols;

        this.buttonWidth = 2;
        this.buttonHeight = 0.2;
        this.buttonDepth = 2;
        this.buttonSpacing = 0.5;

        this.startX = -(this.cols - 1) / 2 * (this.buttonWidth + this.buttonSpacing);
        this.endX = (this.cols - 1) / 2 * (this.buttonWidth + this.buttonSpacing);
        this.startZ = -(this.rows - 1) / 2 * (this.buttonWidth + this.buttonSpacing);
        this.endZ = (this.rows - 1) / 2 * (this.buttonWidth + this.buttonSpacing);

        this.tempo = tempo;
        this.timeSignatureNumerator = 4;
        this.timeSignatureDenominator = 4;
        this.beatDuration = 60 / this.tempo;
        this.cellDuration = this.beatDuration / this.timeSignatureDenominator;

        this.started = false;
        this.startTime = 0;

        this.notes = ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4"];

        this.createGrid();
        this.createPlayhead();
        this.initActions();

        this.pattern = { length: 96, notes: [] };
        this.isAKeyPressed = false;
        window.addEventListener("keydown", (e) => {
          if (e.key.toLowerCase() === "a") {
              this.isAKeyPressed = true;
          }
      });
      
      window.addEventListener("keyup", (e) => {
          if (e.key.toLowerCase() === "a") {
              this.isAKeyPressed = false;
          }
      });
      

    }
    convertNoteToMidi(note) {
        const noteMap = {
          C3: 48,
          D3: 50,
          E3: 52,
          F3: 53,
          G3: 55,
          A3: 57,
          B3: 59,
          C4: 60,
          D4: 62,
          E4: 64,
          F4: 65,
          G4: 67,
          A4: 69,
          B4: 71,
        };
        return noteMap[note];
    }

    // triggerNotePlayback(row, col,button) {
    //   console.log("triggerNotePlayback", row, col);
    //     const note = this.notes[row];
    //     const midiNumber = this.convertNoteToMidi(note);
      
    //     // Play now
    //     const currentTime = this.audioContext.currentTime;

    //     setTimeout(() => {
    //       button.isPlaying = false;
    //     },this.cellDuration * 1000);
      
    //     // Note On
    //     this.webPianoRoll.synthInstance.audioNode.scheduleEvents({
    //       type: 'wam-midi',
    //       time: currentTime,
    //       data: { bytes: [0x90, midiNumber, 100] }
    //     });
    //     this.webPianoRoll.synthInstance.audioNode.scheduleEvents({
    //       type: 'wam-midi',
    //       time: currentTime + this.cellDuration,
    //       data: { bytes: [0x80, midiNumber, 100] }
    //     });
    // }

    sendPatternToPianoRoll() {
        const delegate = window?.WAMExtensions?.patterns?.getPatternViewDelegate(
            this.webPianoRoll.pianoRollInstance.instanceId
        );

        

        if (!delegate) return;
        delegate.setPatternState("default", this.pattern);
        console.log("sendPatternToPianoRoll", this.pattern);
    }

    updatePattern(row, col, isActive) {
        const note = this.notes[row];
        const midi = this.convertNoteToMidi(note);
        const tick = col * 6;
        const index = this.pattern.notes.findIndex(n => n.number === midi && n.tick === tick);

        if (isActive && index === -1) {
            this.pattern.notes.push({ tick, number: midi, duration: 6, velocity: 100 });
        } else if (!isActive && index !== -1) {
            this.pattern.notes.splice(index, 1);
        }

        this.sendPatternToPianoRoll();
    }

    createGrid() {
      this.buttonMaterial = new BABYLON.StandardMaterial("buttonMaterial", this.scene);
      this.buttonMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.8);
      this.buttons = Array.from({ length: this.rows }, () => []);
  
      for (let i = 0; i < this.rows; i++) {
          // Create label button (not interactive, only for display)
          const labelButton = BABYLON.MeshBuilder.CreateBox(`label_button_${i}`, {
              width: this.buttonWidth,
              height: this.buttonHeight,
              depth: this.buttonDepth
          }, this.scene);
  
          labelButton.position.x = this.startX - (this.buttonWidth + this.buttonSpacing);
          labelButton.position.z = (i - (this.rows - 1) / 2) * (this.buttonDepth + this.buttonSpacing);
          labelButton.position.y = this.buttonHeight / 2;
  
          const labelMaterial = new BABYLON.StandardMaterial(`labelMaterial_${i}`, this.scene);
          labelMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
          labelButton.material = labelMaterial;
  
          // Add label using your method
          this.addLabelToButton(labelButton, this.notes[i]);
  
          for (let j = 0; j < this.cols; j++) {
              const button = BABYLON.MeshBuilder.CreateBox(`button${i}_${j}`, {
                  width: this.buttonWidth,
                  height: this.buttonHeight,
                  depth: this.buttonDepth
              }, this.scene);
  
              button.position.x = (j - (this.cols - 1) / 2) * (this.buttonWidth + this.buttonSpacing);
              button.position.z = labelButton.position.z;
              button.position.y = this.buttonHeight / 2;
              button.mode = "normal";
  
              const material = new BABYLON.StandardMaterial(`buttonMaterial_${i}_${j}`, this.scene);
              material.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.8);
              button.material = material;
  
              this.buttons[i].push(button);
          }
      }
  
      // Create base mesh
      const baseMesh = BABYLON.MeshBuilder.CreateBox("baseMesh", {
          width: this.endX - this.startX + this.buttonWidth * 2 + this.buttonSpacing,
          height: 0.2,
          depth: this.endZ - this.startZ + this.buttonWidth
      }, this.scene);
  
      const baseMeshMaterial = new BABYLON.StandardMaterial("baseMeshMaterial", this.scene);
      baseMeshMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.2, 0.2);
      baseMesh.material = baseMeshMaterial;
  }
  
  addLabelToButton(buttonMesh, text) {
    const textPlane = BABYLON.MeshBuilder.CreatePlane(
        `${buttonMesh.name}_textPlane`,
        { width: 2, height: 2 },
        this.scene
    );

    textPlane.parent = buttonMesh;
    textPlane.position.y = 0.11;
    textPlane.rotation.x = Math.PI / 2;
    textPlane.isPickable = false;

    const textMaterial = new BABYLON.StandardMaterial(`${buttonMesh.name}_textMaterial`, this.scene);
    textMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    textMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    textPlane.material = textMaterial;

    const textTexture = new BABYLON.DynamicTexture(
        `${buttonMesh.name}_texture`,
        { width: 128, height: 128 },
        this.scene,
        true
    );
    textMaterial.diffuseTexture = textTexture;
    textMaterial.useAlphaFromDiffuseTexture = true;

    const ctx = textTexture.getContext();
    ctx.clearRect(0, 0, 128, 128);
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.fillText(text, 64, 64);
    textTexture.update();

    buttonMesh.labelPlane = textPlane;
    buttonMesh.textTexture = textTexture;
}

    createPlayhead() {

        this.playhead = BABYLON.MeshBuilder.CreateBox("playhead", {
            width: 0.1,
            height: 0.2,
            depth:this.endZ-this.startZ+this.buttonWidth
        }, this.scene);

        let playheadMaterial = new BABYLON.StandardMaterial("playheadMaterial", this.scene);
        playheadMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
        this.playhead.material = playheadMaterial;
        this.playhead.position.x = this.getStartX();
        this.playhead.position.y = 0.2;
    }

    update() {
        if (!this.started || !this.cellDuration) return;

        
        const elapsed = this.audioContext.currentTime - this.startTime;
        const currentCell = elapsed / this.cellDuration;
        // const currentCellFloat = currentCell % (this.cols - 0.0001);



        var currentCellFloat = currentCell% this.cols;
        // var currentCellFloat = ((elapsed / this.cellDuration) % (this.cols - 0.0001));

        // // work but not animated
        // // var x = Math.floor(currentCellFloat) * (buttonWidth + buttonSpacing) 
        // // - (cols - 1) / 2 * (buttonWidth + buttonSpacing);
        
        // if (currentCellFloat > this.cols - 0.6) {
        //     currentCellFloat = this.cols - 0.6;
        //     }

        var x = (currentCellFloat * (this.buttonWidth + this.buttonSpacing)) 
         - ((this.cols - 1) / 2 * (this.buttonWidth + this.buttonSpacing))-this.buttonWidth/2;

        this.playhead.position.x = x;

        // highlight the current column
        // Get the current column the playhead is crossing
        const currentCol = Math.floor(currentCell % this.cols);

        this.highlightActiveButtons(currentCol);
    }

    highlightActiveButtons(currentCol) {
      for (let row = 0; row < this.rows; row++) {
          const button = this.getButton(row, currentCol);
          if (button && button.isActive) {
              button.isPlaying = true;
  
              // Flash green
              button.material.diffuseColor = new BABYLON.Color3(0, 1, 0);
  
              setTimeout(() => {
                  if (button.isActive) {
                      if (button.mode === "control") {
                          button.material.diffuseColor = new BABYLON.Color3(0.6588, 0.2, 0.8); // Purple
                      } else {
                          button.material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
                      }
                  }
              }, this.cellDuration * 1000);
          }
      }
  }
  
    start() {
        this.started = true;
        this.playhead.position.x = this.getStartX();
        this.startTime = this.audioContext.currentTime; 
    }

    stop() {
        this.started = false;
        this.playhead.position.x = this.getStartX();
    }
    
    setTempo(bpm) {
        this.tempo = bpm;
        this.beatDuration = 60 / this.tempo;
        this.cellDuration = this.beatDuration / this.timeSignatureDenominator;
    }
    
    getStartX() {
        return -((this.cols - 1) / 2) * (this.buttonWidth + this.buttonSpacing)-this.buttonWidth/2;
    }

    getButton(row, col) {
        if (this.buttons[row] && this.buttons[row][col]) {
          return this.buttons[row][col];
        }
        return null;
      }
      
    
    // function init action if button is pressed change color to red
    initActions() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const button = this.buttons[row][col];
    
                button.isActive = false;
    
                if (!button.actionManager) {
                    button.actionManager = new BABYLON.ActionManager(this.scene);
                }
    
                button.actionManager.registerAction(
                  new BABYLON.ExecuteCodeAction(
                      BABYLON.ActionManager.OnPickTrigger,
                      () => {
                          if (this.isAKeyPressed) {
                              this.toggleNoteColorwithControl(row, col);
                          } else {
                              this.toggleNoteColor(row, col);
                          }
                      }
                  )
              );
              
              

            }
        }
    }
    
    toggleNoteColor(row, col) {
        const button = this.getButton(row, col);
        if (!button) return;
        button.isActive = !button.isActive;
        button.mode = button.isActive ? "normal" : "none";        
        button.material.diffuseColor = button.isActive
            ? new BABYLON.Color3(1, 0, 0)
            : new BABYLON.Color3(0.2, 0.6, 0.8);
        this.updatePattern(row, col, button.isActive);
    }
 toggleNoteColorwithControl(row, col) {
    const button = this.getButton(row, col);
    if (!button) return;

    // Find the last control-mode active button on the same row before current
    let targetCol = -1;
    for (let i = col - 1; i >= 0; i--) {
        const prev = this.getButton(row, i);
        if (prev?.isActive && prev.mode === "control") {
            targetCol = i;
            break;
        }
    }

    if (targetCol !== -1) {
        // Extend duration of previous control note
        const note = this.notes[row];
        const midi = this.convertNoteToMidi(note);
        const tick = targetCol * 6;
        const noteObj = this.pattern.notes.find(n => n.number === midi && n.tick === tick);
        if (noteObj) {
            noteObj.duration = (col - targetCol + 1) * 6;
        }
    } else {
        // Toggle current button with control mode
        button.isActive = !button.isActive;
        button.mode = button.isActive ? "control" : "normal";
        button.material.diffuseColor = button.isActive
            ? new BABYLON.Color3(0.6588, 0.2, 0.8)
            : new BABYLON.Color3(0.2, 0.6, 0.8);
        this.updatePattern(row, col, button.isActive);
    }

    this.sendPatternToPianoRoll();
}

  
  
    }
    

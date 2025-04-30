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
        
        this.rowControlBorders = {}; // { rowIndex: { mesh: borderMesh, startCol: number } }
        this.currentControlSequence = null;

        window.addEventListener("keyup", (e) => {
            if (e.key.toLowerCase() === "a") {
                this.isAKeyPressed = false;
                this.currentControlSequence = null;  // <<<<<<<<<< RESET SEQUENCE on A release
            }
        });
        
        this.notes = ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4"];

        this.createGrid();
        this.createPlayhead();
        this.initActions();

        this.ticksPerColumn = 6;
        this.pattern = { length: this.cols * this.ticksPerColumn, notes: [] };
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
        const tick = col * this.ticksPerColumn;
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
          // Label button (non-interactive)
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
              button.controlId = "";
  
              const material = new BABYLON.StandardMaterial(`buttonMaterial_${i}_${j}`, this.scene);
              material.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.8);
              button.material = material;
  
              this.buttons[i].push(button);
          }
      }
  
      // Base mesh under grid
      const baseMesh = BABYLON.MeshBuilder.CreateBox("baseMesh", {
          width: this.endX - this.startX + this.buttonWidth * 2 + this.buttonSpacing,
          height: 0.2,
          depth: this.endZ - this.startZ + this.buttonWidth
      }, this.scene);
  
      const baseMeshMaterial = new BABYLON.StandardMaterial("baseMeshMaterial", this.scene);
      baseMeshMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.2, 0.2);
      baseMesh.material = baseMeshMaterial;
  
      // === ADD BEAT & BAR DIVIDER LINES ===
      for (let col = 0; col <= this.cols; col++) {
          const isBar = col % (this.timeSignatureNumerator * this.timeSignatureDenominator) === 0;
          const isBeat = col % this.timeSignatureDenominator === 0;
  
          if (isBar || isBeat) {
              const line = BABYLON.MeshBuilder.CreateBox(`divider_${col}`, {
                  width: 0.1,
                  height: 0.2,
                  depth:this.endZ-this.startZ+this.buttonWidth
                }, this.scene);
  
              line.position.x = (col - (this.cols - 1) / 2) * (this.buttonWidth + this.buttonSpacing) - (this.buttonWidth + this.buttonSpacing)/2;
              line.position.y = 0.2;
              line.position.z = 0;
  
              const lineMaterial = new BABYLON.StandardMaterial(`lineMaterial_${col}`, this.scene);
              lineMaterial.diffuseColor = isBar
                  ? new BABYLON.Color3(0, 0, 1)   // Blue for bars
                  : new BABYLON.Color3(1, 1, 1); // Black for beats
              line.material = lineMaterial;
          }
      }
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
  
      if (!this.isAKeyPressed) return;
  
      if (!this.currentControlSequence) {
          // Start a new sequence
          this.startNewControlSequence(row, col);
      } else {
          // Expand current sequence
          const seq = this.currentControlSequence;
          if (seq.row === row) {
              this.expandControlSequence(row, seq.startCol, col);
          } else {
              // Different row => start new
              this.startNewControlSequence(row, col);
          }
      }
  }
  startNewControlSequence(row, col) {
    const button = this.getButton(row, col);
    button.isActive = true;
    button.mode = "control";
    button.material.diffuseColor = new BABYLON.Color3(0.6588, 0.2, 0.8); // purple

    // Create only one note for the starting button
    const midiNumber = this.convertNoteToMidi(this.notes[row]);
    const tick = col * this.ticksPerColumn;

    this.pattern.notes.push({
        tick,
        number: midiNumber,
        duration: this.ticksPerColumn, // Start with 1 cell duration
        velocity: 100,
    });

    // Immediately send update to delegate
    this.sendPatternToPianoRoll();

    // Create visual border
    const startX = (col - (this.cols - 1) / 2) * (this.buttonWidth + this.buttonSpacing);
    const borderWidth = this.buttonWidth * 1.1;
    const borderDepth = this.buttonDepth * 1.2;

    const border = BABYLON.MeshBuilder.CreateBox(`groupBorder_${row}_${col}`, {
        width: borderWidth,
        height: 0.3,
        depth: borderDepth,
    }, this.scene);
    border.isPickable = true; // Make the border clickable

    const borderMaterial = new BABYLON.StandardMaterial(`groupBorderMat_${row}_${col}`, this.scene);
    borderMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0); // Yellow
    borderMaterial.alpha = 0.4;
    border.material = borderMaterial;

    border.position.x = startX;
    border.position.y = 0.25;
    border.position.z = (row - (this.rows - 1) / 2) * (this.buttonDepth + this.buttonSpacing);

    this.currentControlSequence = {
        row,
        startCol: col,
        startTick: tick,
        midiNumber,
        borderMesh: border,
    };

    // Add action on clicking the border to delete the sequence
    border.actionManager = new BABYLON.ActionManager(this.scene);
    border.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            () => {
                this.deleteControlSequence(row, col);
            }
        )
    );
}

deleteControlSequence(row, startCol) {
  if (!this.pattern || !this.pattern.notes) return;

  // Find the note to delete
  const midiNumber = this.convertNoteToMidi(this.notes[row]);
  const tick = startCol * this.ticksPerColumn;
  const noteIndex = this.pattern.notes.findIndex(n => n.number === midiNumber && n.tick === tick);

  if (noteIndex !== -1) {
      this.pattern.notes.splice(noteIndex, 1);
  }

  // Disable all buttons that were active in the sequence
  const borderName = `groupBorder_${row}_${startCol}`;
  const borderMesh = this.scene.getMeshByName(borderName);

  if (borderMesh) {
      // Calculate how many columns the border covers
      const widthCols = Math.round(borderMesh.scaling.x);

      for (let col = startCol; col < startCol + widthCols; col++) {
          const button = this.getButton(row, col);
          if (button) {
              button.isActive = false;
              button.mode = "none";
              button.material.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.8); // back to blue
          }
      }

      borderMesh.dispose();
  }

  // After deleting update the delegate
  this.sendPatternToPianoRoll();
}


expandControlSequence(row, startCol, currentCol) {
  const button = this.getButton(row, currentCol);
  button.isActive = true;
  button.mode = "control";
  button.material.diffuseColor = new BABYLON.Color3(0.6588, 0.2, 0.8); // purple

  const seq = this.currentControlSequence;

  // Update only the first note's duration
  const noteObj = this.pattern.notes.find(n => n.number === seq.midiNumber && n.tick === seq.startTick);
  if (noteObj) {
      noteObj.duration = (currentCol - startCol + 1) * this.ticksPerColumn;
      
      // Immediately send updated pattern to delegate
      this.sendPatternToPianoRoll();
  }

  // Update the visual border
  const centerCol = (startCol + currentCol) / 2;
  const widthCols = (currentCol - startCol + 1);

  seq.borderMesh.scaling.x = widthCols;
  seq.borderMesh.position.x = (centerCol - (this.cols - 1) / 2) * (this.buttonWidth + this.buttonSpacing);
}




  
  
    }
    

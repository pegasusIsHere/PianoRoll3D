export class PianoRoll3D {
    constructor(scene, rows, cols, tempo = 60,audioContext) {
        this.scene = scene;
        this.audioContext = audioContext;
        this.rows = rows;
        this.cols = cols;

        // Grid properties
        this.buttonWidth = 2;
        this.buttonHeight = 0.2;
        this.buttonDepth = 2;
        this.buttonSpacing = 0.02;

        this.tempo = tempo;
        this.timeSignatureNumerator = 4;
        this.timeSignatureDenominator = 4;
        this.beatDuration = 60 / this.tempo;
        this.cellDuration = this.beatDuration / this.timeSignatureDenominator;

        this.started = false;
        this.startTime = 0;

        this.createGrid();
        this.createPlayhead();
        this.initActions();
    }

    createGrid() {
        this.buttonMaterial = new BABYLON.StandardMaterial("buttonMaterial", this.scene);
        this.buttonMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.8);

        this.buttons = [];

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                let button = BABYLON.MeshBuilder.CreateBox(`button${i}_${j}`, {
                    width: this.buttonWidth,
                    height: this.buttonHeight,
                    depth: this.buttonDepth
                }, this.scene);

                button.position.x = (j - (this.cols - 1) / 2) * (this.buttonWidth + this.buttonSpacing);
                button.position.z = (i - (this.rows - 1) / 2) * (this.buttonDepth + this.buttonSpacing);
                button.position.y = this.buttonHeight / 2;
                button.material = this.buttonMaterial;

                this.buttons.push(button);
            }
        }
    }

    createPlayhead() {
        this.playhead = BABYLON.MeshBuilder.CreateBox("playhead", {
            width: 0.1,
            height: 0.2,
            depth: 15
        }, this.scene);

        let playheadMaterial = new BABYLON.StandardMaterial("playheadMaterial", this.scene);
        playheadMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
        this.playhead.material = playheadMaterial;
        this.playhead.position.y = 2;
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
        
        if (currentCellFloat > this.cols - 1) {
            currentCellFloat = this.cols - 1;
            }

        var x = (currentCellFloat * (this.buttonWidth + this.buttonSpacing)) 
        - ((this.cols - 1) / 2 * (this.buttonWidth + this.buttonSpacing));

        this.playhead.position.x = x;
    }

    start() {
        this.started = true;
        this.playhead.position.x = this.getStartX();
        this.startTime = this.audioContext.currentTime; // ⏱️
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
        return -((this.cols - 1) / 2) * (this.buttonWidth + this.buttonSpacing);
    }
    
    // function init action if button is pressed change color to red
    initActions(){
        // this.buttons.forEach((button) => {
    // Attach an action to handle note activation
    // if (!button.actionManager) {
    //     button.actionManager = new BABYLON.ActionManager(this.scene);
    //   }
  
    //   button.actionManager.registerAction(
    //     new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
    //         this.buttons[i].material.diffuseColor = new BABYLON.Color3(1, 0, 0);
            
    //     })
    //   );
        // });
        for (let i = 0; i < this.buttons.length; i++) {
            if (!this.buttons[i].actionManager) {
                this.buttons[i].actionManager = new BABYLON.ActionManager(this.scene);
              }
            this.buttons[i].actionManager = new BABYLON.ActionManager(this.scene);
            this.buttons[i].actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                updateNoteColor(row, column);
            }));
        }
    }


}

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
        this.buttonSpacing = 0.52;

        //base mesh properties
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

        this.createGrid();
        this.createPlayhead();
        this.initActions();
    }

    createGrid() {
        this.buttonMaterial = new BABYLON.StandardMaterial("buttonMaterial", this.scene);
        this.buttonMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.8);

        this.buttons = Array.from({ length: this.rows }, () => []);

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const button = BABYLON.MeshBuilder.CreateBox(`button${i}_${j}`, {
                    width: this.buttonWidth,
                    height: this.buttonHeight,
                    depth: this.buttonDepth
                }, this.scene);
        
                button.position.x = (j - (this.cols - 1) / 2) * (this.buttonWidth + this.buttonSpacing);
                button.position.z = (i - (this.rows - 1) / 2) * (this.buttonDepth + this.buttonSpacing);
                button.position.y = this.buttonHeight / 2;
        
                // Create separate material for each button
                const material = new BABYLON.StandardMaterial(`buttonMaterial_${i}_${j}`, this.scene);
                material.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.8);
                button.material = material;
        
                this.buttons[i].push(button);
            }
        }
                // Calculate playhead X movement range

        

        var baseMesh = BABYLON.MeshBuilder.CreateBox("baseMesh", { width:this.endX-this.startX+this.buttonWidth,height:0.2,depth:this.endZ-this.startZ+this.buttonWidth }, this.scene);
        let baseMeshMaterial = new BABYLON.StandardMaterial("baseMeshMaterial", this.scene);

        baseMeshMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.2, 0.2);
        baseMesh.material = baseMeshMaterial;
        
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
        
        if (currentCellFloat > this.cols - 0.6) {
            currentCellFloat = this.cols - 0.6;
            }

        var x = (currentCellFloat * (this.buttonWidth + this.buttonSpacing)) 
        - ((this.cols - 1) / 2 * (this.buttonWidth + this.buttonSpacing));

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
                button.material.diffuseColor = new BABYLON.Color3(0, 1, 0); // Green
    
                setTimeout(() => {
                    if (button.isActive) {
                        button.material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
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
        return -((this.cols - 1) / 2) * (this.buttonWidth + this.buttonSpacing);
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
                            this.toggleNoteColor(row, col);
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
    
        button.material.diffuseColor = button.isActive
            ? new BABYLON.Color3(1, 0, 0)  // red
            : new BABYLON.Color3(0.2, 0.6, 0.8);  // original blue
    }
    
    
    

}

export class PianoRoll3D {
    constructor(scene, rows, cols, tempo = 60) {
        this.scene = scene;
        this.rows = rows;
        this.cols = cols;
        this.tempo = tempo;

        this.buttonWidth = 2;
        this.buttonHeight = 0.2;
        this.buttonDepth = 2;
        this.buttonSpacing = 0.02;

        this.beatDuration = 60 / this.tempo;
        this.cellDuration = this.beatDuration / 4;
        this.startTime = performance.now() / 1000;

        this.createGrid();
        this.createPlayhead();
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
        var now = performance.now() / 1000; // seconds
        var elapsed = now - this.startTime;
        // var currentCellFloat = (elapsed / cellDuration) % totalCells;
        var currentCellFloat = ((elapsed / this.cellDuration) % (this.cols - 0.0001));

        // work but not animated
        // var x = Math.floor(currentCellFloat) * (buttonWidth + buttonSpacing) 
        // - (cols - 1) / 2 * (buttonWidth + buttonSpacing);
        
        var rawCell = elapsed / this.cellDuration;
        var currentCellFloat = rawCell % this.cols;

        if (currentCellFloat > this.cols - 1) {
        currentCellFloat = this.cols - 1;
        }

        var x = (currentCellFloat * (this.buttonWidth + this.buttonSpacing)) 
        - ((this.cols - 1) / 2 * (this.buttonWidth + this.buttonSpacing));


        this.playhead.position.x = x;
    }
}

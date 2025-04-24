import { initExtensions } from './extensions.js';

export class WebPianoRollManager {
    constructor(audioContext) {
      this.audioContext = audioContext;
      this.currentBpm = 60;
      this.pianoRollInstance = null;
      this.synthInstance = null;
    }
  
    async setup() {

        await initExtensions(); // Ensure extensions initialized first

      const hostGroupId = await this.setupWamHost();
  
      const pianoRollURI = "https://www.webaudiomodules.com/community/plugins/burns-audio/pianoroll/index.js";
      this.pianoRollInstance = await this.loadDynamicComponent(pianoRollURI, hostGroupId);
      const pianoRollDiv = await this.pianoRollInstance.createGui();
      this.showWam(pianoRollDiv, 10, 1000, 0.7, 500, 540);
  
      const synthURI = 'https://wam-4tt.pages.dev/Pro54/index.js';
      this.synthInstance = await this.loadDynamicComponent(synthURI, hostGroupId);
      const synthDiv = await this.synthInstance.createGui();
      this.showWam(synthDiv, 370, 1000, 0.7);
  
      this.synthInstance.audioNode.connect(this.audioContext.destination);
      this.pianoRollInstance.audioNode.connectEvents(this.synthInstance.instanceId);
    }
  
    play(tempo) {
      this.currentBpm = tempo;
      this.pianoRollInstance.audioNode.scheduleEvents({
        type: 'wam-transport',
        data: {
          playing: true,
          timeSigDenominator: 4,
          timeSigNumerator: 4,
          currentBar: 0,
          currentBarStarted: this.audioContext.currentTime,
          tempo: tempo
        }
      });
    }
  
    stop() {
      this.pianoRollInstance.audioNode.scheduleEvents({
        type: 'wam-transport',
        data: {
          playing: false,
          timeSigDenominator: 4,
          timeSigNumerator: 4,
          currentBar: 0,
          currentBarStarted: this.audioContext.currentTime,
          tempo: this.currentBpm
        }
      });
    }


//-------------------
// Utility functions 
//-------------------
async  setupWamHost() {
    // Init WamEnv, load SDK etc.
    const { default: initializeWamHost } = await import("https://www.webaudiomodules.com/sdk/2.0.0-alpha.6/src/initializeWamHost.js");
    const [hostGroupId] = await initializeWamHost(this.audioContext);
  
    // hostGroupId is useful to group several WAM plugins together....
    return hostGroupId;
  }
  
  async  loadDynamicComponent(wamURI, hostGroupId) {
    try {
  
      // Import WAM
      const { default: WAM } = await import(wamURI);
      // Create a new instance of the plugin, pass groupId
      const wamInstance = await WAM.createInstance(hostGroupId, this.audioContext);
  
      return wamInstance;
    } catch (error) {
      console.error('Erreur lors du chargement du Web Component :', error);
    }
  }
  
   showWam(wamGUI, x, y, scale, width, height) {
    // Create a container around the wam, so that we can rescale/position it easily
    // this is where you can add a menu bar, close button, etc.
    const container = document.createElement('div');
    container.style.position = 'absolute';
  
    container.style.overflow = 'auto';
    container.style.zIndex = '10';  // above canvas
  
    // Put the wam in the div
    container.appendChild(wamGUI);
  
    this.adjustPositionAndSize(container, x, y, scale);
    if (height !== undefined)
      container.style.height = height + "px";
    if (width !== undefined)
      container.style.width = width + "px";
  
    document.body.appendChild(container);
  }
  
   adjustPositionAndSize(wamContainer, x, y, scale) {
    // rescale without changing the top left coordinates
    wamContainer.style.transformOrigin = '0 0';
    wamContainer.style.top = y + "px";
    wamContainer.style.left = x + "px";
    wamContainer.style.transform += ` scale(${scale})`;
  }
  
   windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    const container = document.querySelector('div');
    if (container) {
      container.style.width = windowWidth + "px";
      container.style.height = windowHeight + "px";
    }
  }

  }
  
  // Cette classe devrait aller dans le sdk/extensions
  export class NoteExtension {
    constructor() {
        this.noteDefinitions = new Map()
        this.listeners = new Map()
        this.pluginMapping = new Map()
    }

    setNoteList(pluginId, notes) {
      console.log("setNoteList pluginId = " + pluginId + " notes =" + notes)
        if (notes) {
            this.noteDefinitions.set(pluginId, notes)
        } else {
            this.noteDefinitions.delete(pluginId)
        }
        this.sendNoteLists()
    }

    addListener(pluginId, callback) {
      console.log("pluginId = " + pluginId);
        if (callback) {
            this.listeners.set(pluginId, callback)
        } else {
            this.listeners.delete(pluginId)
        }
        this.sendNoteLists()
    }

    addMapping(destinationId, sourceIds) {
        if (sourceIds) {
            this.pluginMapping.set(destinationId, sourceIds)
        } else {
            this.pluginMapping.delete(destinationId)
        }
        this.sendNoteLists()
    }

    clearMapping() {
        this.pluginMapping.clear()
    }

    sendNoteLists() {
      console.log("sendNoteList")
        this.pluginMapping.forEach((sourceIds, destinationId) => {
          console.log("sourceId = " + sourceIds + " destinationId = " + destinationId)
            let callback = this.listeners.get(destinationId)
            if (callback) {
                let noteListId = sourceIds.find((id) => this.noteDefinitions.has(id))
                if (noteListId) {
                    callback(this.noteDefinitions.get(noteListId))
                } else {
                    callback(undefined)
                }
            }
        })
    }
}

// Pattern extension
 export class PatternExtension {

    constructor() {
        this.delegates = new Map()
    }

    setPatternDelegate(pluginId, delegate) {
      /* delegate is an object with methods : 
            getPatternList: () => PatternEntry[]
            createPattern: (id: string) => void
            deletePattern: (id: string) => void
            playPattern: (id: string | undefined) => void
            getPatternState: (id: string) => any
            setPatternState: (id: string, state: any) => any
      */
      
        if (delegate) {
            this.delegates.set(pluginId, delegate)
                  console.log("### DANS setPatternDelegate plugin id = " + pluginId + "###")

        } else {
            this.delegates.delete(pluginId)
        }
    }

    getPatternViewDelegate(pluginId) {
      console.log("### This.delegate = " + this.delegates)
        return this.delegates.get(pluginId)
    }
}


    

export const initExtensions = async () => {
    window.WAMExtensions = window.WAMExtensions || {};
    window.WAMExtensions.notes = new NoteExtension();
    window.WAMExtensions.patterns = new PatternExtension();
};
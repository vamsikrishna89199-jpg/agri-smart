// js/commandContext.js
const CommandContext = {
    lastCrop: null,
    lastLocation: null,

    update(context) {
        if (context.crop) this.lastCrop = context.crop;
        if (context.location) this.lastLocation = context.location;
    },

    get() {
        return {
            crop: this.lastCrop,
            location: this.lastLocation
        };
    },
    
    clear() {
        this.lastCrop = null;
        this.lastLocation = null;
    }
};

window.CommandContext = CommandContext;

try {
    if (!Nabu) throw "Nabu Manager not loaded";
} catch (e) {
    throw "Nabu Manager not loaded";
}

Nabu.Event = function(params)
{
    this.params = params;
    this.bubble = true;
};

Nabu.Event.prototype = {

    isBubble: function()
    {
        return this.bubble;
    },

    setBubble: function(value)
    {
        this.bubble = value;
    },

    fireEvent: function(event, source, params)
    {
        if (this.params[event]) {
            var retval = this.params[event]({ source: source, params: params});
            return (typeof retval === 'undefined' ? true : retval);
        }

        return true;
    },

    isEventTargeted: function(event)
    {
        return (typeof this.params[event]) !== "undefined";
    }
};

Nabu.EventPool = function() {
    this.events = new Array();
};

Nabu.EventPool.prototype = {

    addEventListener: function(event)
    {
        if (this.getEventListenerIndex(event) === -1) {
            this.events.push(event);
        }
    },

    fireEvent: function(event, source, params)
    {
        var retval = true;

        for (var i = 0; i < this.events.length; i++) {
            retval = this.events[i].fireEvent(event, source, params);
            if (!this.events[i].isBubble()) break;
        }

        return retval;
    },

    isEventTargeted: function(event)
    {

        for (var i = 0; i < this.events.length; i++)
            if (this.events[i].isEventTargeted(event)) return true;
        return false;
    },

    getEventListenerIndex: function(event)
    {
        for (var i = 0; i < this.events.length; i++)
            if (this.events[i] === event) return i;
        return -1;
    },

    removeEventListener: function(event)
    {
        var i = this.getEventListenerIndex(event);
        if (i > -1) this.events.splice(i, 1);
    }

};

nabu.registerLibrary('Event');

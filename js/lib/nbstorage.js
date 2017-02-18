try {
    if (!Nabu) throw "Nabu Manager not loaded";
} catch (e) {
    throw "Nabu Manager not loaded";
}

Nabu.Storage = function(permanent) {

    if (permanent !== true && permanent !== false) {
        throw new Exception("[permanent] value not falid");
    }

    this.available = false;
    this.permanent = permanent;
    this.storage = null;
    this.events = new Nabu.EventPool();

    this.init();
};

Nabu.Storage.prototype = {

    init: function() {

        try {
            var storage = window[this.permanent ? 'localStorage' : 'sessionStorage'];
            var x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            this.storage = storage;
            this.available = true;
	}
	catch(e) {
            this.storage = null;
            this.available = false;
	}
    },

    getValue: function(key, parser) {

        var value = null;

        if (this.available && this.storage !== null) {
            if ((value = this.storage.getItem(key)) !== null) {
                if ((typeof parser) === "function") {
                    value = parser(value);
                }
                if (this.events.isEventTargeted('onExists')) {
                    this.events.fireEvent('onExists', this, {
                        key: key,
                        value: value
                    });
                }
                return value;
            }
        } else if (this.events.isEventTargeted('onError')) {
            this.events.fireEvent('onError', this, {
                error: 'Storage not available'
            });

            return null;
        } else {
            throw 'Storage not available. Unrecoverable value for ' + key;
        }

        if (this.events.isEventTargeted('onCreate')) {
            return this.events.fireEvent('onCreate', this, {
                key: key
            });
        }
    },

    getObject: function(key) {

        return this.getValue(key, function(value) {
            if ((typeof value) === 'string') {
                return JSON.parse(value);
            }
            return null;
        });
    },

    setValue: function(key, value) {

        if (this.available && this.storage !== null) {
             this.storage.setItem(key, value);
             if (this.events.isEventTargeted('onSetted')) {
                 this.events.fireEvent('onSetted', this, {
                     key: key,
                     value: value
                 });
             }
        }
    },

    setObject: function(key, value) {

        if ((typeof value) === 'object') {
            this.setValue(key, JSON.stringify(value));
        }
    },

    addEventListener: function(event) {

        this.events.addEventListener(event);
    },

    removeEventListener: function(event) {

        this.events.removeEventListener(event);
    }
};

nabu.registerLibrary('Storage', ['Event']);

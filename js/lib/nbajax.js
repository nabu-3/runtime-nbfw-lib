try {
    if (!Nabu) throw "Nabu Manager not loaded";
} catch (e) {
    throw "Nabu Manager not loaded";
}

Nabu.Ajax = new Object();

Nabu.Ajax.READY_STATE_UNINITIALIZED=0;
Nabu.Ajax.READY_STATE_LOADING=1;
Nabu.Ajax.READY_STATE_LOADED=2;
Nabu.Ajax.READY_STATE_INTERACTIVE=3;
Nabu.Ajax.READY_STATE_COMPLETE=4;

Nabu.Ajax.GET="GET";
Nabu.Ajax.POST="POST";
Nabu.Ajax.PUT="PUT";
Nabu.Ajax.DELETE="DELETE";

Nabu.Ajax.basePath = null;

Nabu.Ajax.Connector = function(url, method, params) {

    this.url = url;
    this.method = method;
    this.request = null;
    this.params = params;
    this.pending = false;
    this.postStream = null;
    this.start_time = null;
    this.request_type = null;

    this.events = new Nabu.EventPool();

    var url_test = document.location.protocol + "//" + document.location.host
                 + (document.location.port > 0 ? ":" + document.location.port : '') + "/";
    var require_xdr = (this.url.substring(0, 1) !== '/' &&
                       (this.url.length < url_test.length || this.url.substr(0, url_test.length) !== url_test));

    if (require_xdr && window.XDomainRequest) {
        this.request = new XDomainRequest();
        this.request_type = "XDomainRequest";
    } else if (window.XMLHttpRequest) {
        this.request = new XMLHttpRequest();
        this.request_type = "XMLHttpRequest";
    } else if (window.ActiveXObject) {
        this.request = new ActiveXObject("Microsoft.XMLHTTP");
        this.request_type = "Microsoft.XMLHTTP";
        try {
            this.request = new ActiveXObject("MSXML2.XMLHTTP");
            this.request_type = "MSXML2.XMLHTTP";
        } catch (e) {
            try {
                this.request = new ActiveXObject("Microsoft.XMLHTTP");
                this.request_type = "Microsoft.XMLHTTP";
            } catch (e) {
                this.request_type = null;
            }
        }
    }
}

Nabu.Ajax.Connector.prototype = {

    isAjaxAllowed: function()
    {
        return (this.request !== null) ? true : false;
    },

    now: function()
    {
        return new Date().getTime();
    },

    execute: function()
    {
        if (this.request) {
            try {
                var loader = this;

                this.pending = true;
                this.start_time = this.now();

                if (this.request_type === "XDomainRequest") {
                    var session = nabu.getCookie('PHPSESSID');
                    if (session.length > 0) {
                        if (this.url.indexOf('?') < 0) {
                            this.url = this.url + '?PHPSESSID=' + session;
                        } else {
                            this.url = this.url + '&PHPSESSID=' + session;
                        }
                    }
                    if (this.params.headerAccept && this.params.headerAccept === 'application/json') {
                        this.url = this.url + '&json';
                    }
                    this.request.open(this.method, this.url);
                    this.request.onprogress = function() {
                    };
                    this.request.ontimeout = function() {
                    };
                    this.request.onload = function() {
                        loader.onReadyState();
                        loader.pending = false;
                    };
                    this.request.onerror = function(e) {
                    };
                } else {
                    this.request.open(this.method, this.url, true);
                    this.request.onreadystatechange = function() {
                        loader.onReadyState();
                        loader.pending = false;
                    };
                    if (this.request.ontimeout) {
                        this.request.ontimeout = function() {
                            loader.onTimeout();
                            loader.pending = false;
                        };
                    }
                    try {
                        this.request.upload.onprogress = function(event) {
                            loader.onUploadProgress(event);
                        };
                    } catch (e) {}
                }

                if (this.params) {
                    if (this.params.headerAccept) {
                        this.setRequestHeader('Accept', this.params.headerAccept);
                    }
                    if (this.params.headerCacheControl) {
                        this.setRequestHeader('Cache-Control', this.params.headerCacheControl);
                    }
                    if (this.params.headerAuthorization) {
                        this.setRequestHeader('Authorization', this.params.headerAuthorization);
                    }
                    if (this.params.withCredentials) {
                        this.request.withCredentials = this.params.withCredentials;
                    }
                }
                if (this.method === "POST") {
                    if (this.params && (typeof this.params.contentType) !== (typeof undefined)) {
                        if (this.params.contentType !== null) {
                            this.setRequestHeader("Content-type", this.params.contentType);
                        }
                    } else {
                        this.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                    }
                    //this.request.setRequestHeader("Content-length", this.postStream === null ? 0 : this.postStream.length);
                    //this.request.setRequestHeader("Connection", "close");
                }

                if (this.request_type === 'XDomainRequest') {
                    var xdr = this.request;
                    setTimeout(function() {
                        xdr.send(loader.postStream);
                    }, 0);
                } else {
                    this.request.send(this.postStream);
                }
            } catch (err) {
                if (this.params && this.params.onError)
                    this.params.onError(err);
                else
                    alert("Se ha producido un error");
            }
        }
    },

    setRequestHeader: function(name, value)
    {
        try {
            this.request.setRequestHeader(name, value);
        } catch (e) {}
    },

    onReadyState: function()
    {
        var is_xdr = this.request_type === 'XDomainRequest';

        if (is_xdr || this.request.readyState === Nabu.Ajax.READY_STATE_COMPLETE) {
            var httpStatus = (is_xdr ? 200 : this.request.status);
            if (httpStatus === 200 /*|| httpStatus === 0*/) {

                if (this.params && this.params.onLoad)
                    this.params.onLoad(this.request.responseText);
                else if (!this.events.isEventTargeted("onLoad"))
                    alert(this.request.responseText);

                var params = new Object();
                params.text = this.request.responseText;
                if (this.request.responseXML && this.request.responseXML !== null) {
                    params.xml = this.request.responseXML;
                } else {
                    try {
                        var json = eval ("(" + this.request.responseText + ")");
                        if (json !== null) params.json = json;
                    } catch (e) {
                        console.log("Error parsing JSON");
                    }
                }
                this.events.fireEvent("onLoad", this, params);
            } else {
                if (this.events.isEventTargeted("onError"))
                    this.events.fireEvent("onError", this, {message: "Error connecting to " + this.url});
                else
                    console.log("Error connecting to " + this.url);
            }
        }
    },

    onUploadProgress: function(event) {

        var total = event.total;
        var loaded = event.loaded;
        var pending = total - loaded;
        var duration = this.now() - this.start_time;
        var params = {
            lengthComputable: event.lengthComputable,
            total: event.total,
            loaded: event.loaded,
            current: duration,
            timeleft: (duration * pending) / loaded,
            rate: loaded * 1000 / duration,
            ratio: (total !== 0 ? loaded/total : 1)
        };

        if (this.params && this.params.onUploadProgress) {
            this.params.onUploadProgress(params);
        } else if (this.events.isEventTargeted('onUploadProgress')) {
            this.events.fireEvent('onUploadProgress', this, params);
        }
    },

    onTimeout: function() {

        alert("Timeout request");
    },

    abort: function() {

        if (this.pending && this.request) {
            this.request.abort();
        }
    },

    setPostStream: function(stream) {
        this.postStream = stream;
    },

    setPostParam: function(name, value) {

        if (this.postStream !== null && this.postStream.length > 0)
            this.postStream += "&";
        else
            this.postStream = "";

        this.postStream += encodeURIComponent(name) + "=" + encodeURIComponent(value);
    },

    addEventListener: function(event) {

        this.events.addEventListener(event);
    },

    removeEventListener: function(event) {

        this.events.removeEventListener(event);
    }
}

nabu.registerLibrary('Ajax', ['Event']);

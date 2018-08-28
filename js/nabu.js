var Nabu = function() {
    if (typeof NABU_LIBRARY_PATH === "undefined") {
        this.libraries = new Nabu.LibraryManager("/runtime/nbfw/lib/js/lib/nb");
    } else {
        this.libraries = new Nabu.LibraryManager(NABU_LIBRARY_PATH);
    }
    this.minify = true;
};

Nabu.prototype = {

    loadLibrary: function(name, callback)
    {
        return this.libraries.loadLibrary(name, callback);
    },

    registerLibrary: function(name, required, hook)
    {
        this.libraries.registerLibrary(name, required, hook);
    },

    isMinify: function()
    {
        return this.minify;
    },

    setMinify: function(minify)
    {
        this.minify = minify;
    },

    extend: function(ctor, superCtor)
    {
        var f = function() {};
        f.prototype = superCtor.prototype;

        ctor.prototype = new f();
        ctor.prototype.constructor = ctor;
    },

    numberFormat: function(num, numDecimals, thousandSeparator, decimalSeparator)
    {
        if (num !== 0 && (num === null || num === '')) {
            return null;
        }

        var filter_zeros = /^[*0]+$/;
        var i;
        var aux = 0;
        var rend = 0;
        var aux_num= '0';
        var aux_decimals = 0;
        var numstr = new String(num);
        var pos_decimals = numstr.lastIndexOf(".");

        if (!thousandSeparator) {
            thousandSeparator = '.';
        }
        if (!decimalSeparator) {
            decimalSeparator = ',';
        }

        var decimals = decimalSeparator;

        if (pos_decimals!== -1) {
            aux_decimals = numstr.substr(pos_decimals+1);
            aux_num = numstr.substr(0, pos_decimals);
        } else {
            aux_num = new String(num);
        }
        if (filter_zeros.test(aux_num)) {
            aux_num='0';
        }

        if (numDecimals !== 0) {
            if (!filter_zeros.test(aux_decimals)) {
                if (aux_decimals.length > numDecimals) {
                    rend = aux_decimals.substr((numDecimals*1), 1);
                    if (rend) {
                        if (rend >= 5) decimals += (aux_decimals.substr(0,numDecimals)*1)+1;
                        else decimals += (aux_decimals.substr(0,numDecimals)*1);
                    }
                } else {
                    decimals += aux_decimals;
                    for (i=aux_decimals.length; i<numDecimals; i++) {
                        decimals += "0";
                    }
                }
            } else {
                for (i=0; i<numDecimals; i++) {
                    decimals += "0";
                }
            }
        } else {
            if(aux_decimals !== 0) {
                rend = aux_decimals.substr(0,1);
                if (rend >= 5) aux_num = new String((aux_num*1)+1);
            }
        }

        var first_num = new String(aux_num).length % 3;
        var cont = first_num;
        if  (aux_num.length > 3) {
            aux = aux_num.substr(0, first_num);
            while(cont < aux_num.length) {
                var fragment = aux_num.substr(cont,3);
                if (fragment) {
                    aux += (fragment.length !== 3 || cont > 0 ? thousandSeparator : "") + fragment;
                }
                cont +=3;
            }
            aux_num = aux;
        }
        if (numDecimals !== 0) {
                return (aux_num + decimals);
        } else {
                return aux_num;
        }
    },

    isValidEmail: function (expression) {
        var filter = /^([a-zA-Z0-9�-��-�_\.\-])+\@(([a-zA-Z0-9�-��-�\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        return filter.test(expression);
    },

    isValidURL: function (expression) {
        var filter = /^((http|https):\/\/){0,1}([a-zA-Z0-9_\.\-])+(:\d+){0,1}(\/.*)*$/;
        return filter.test(expression);
    },

    isValidPhoneNumber: function (expression) {
        var filter = /^(\+?[0-9\ \-]{8,}[0-9])$/;
        return filter.test(expression);
    },

    isValidIPv4: function (expression) {
        var filter = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/;
        return filter.test(expression);
    },

    isObjectVisible: function(obj) {

        for (var p = obj; p !== null; p = p.parentElement) {
            var disp = this.getStyle(p, 'display');
            if (disp === 'none') return false;
        }

        return true;
    },

    getStyle: function (obj, attr)
    {
        var strValue = "";

        if(document.defaultView && document.defaultView.getComputedStyle) {
            strValue = document.defaultView.getComputedStyle(obj, "").getPropertyValue(attr);
        } else if(obj.currentStyle) {
            attr = attr.replace(/\-(\w)/g, function (strMatch, p1) {
                return p1.toUpperCase();
            });
            strValue = obj.currentStyle[attr];
        }

        return strValue;
    },

    getCookie: function(name) {

        var list = document.cookie.split(";");
        for (var i = 0; i < list.length; i++) {
            var cookie_n = list[i].substr(0, list[i].indexOf("="));
            var cookie_v = list[i].substr(list[i].indexOf("=") + 1);
            cookie_n = cookie_n.replace(/^\s+|\s+$/g, "");
            if (cookie_n === name) return unescape(cookie_v);
        }

        return null;
    },

    setCookie: function(name, value, expires, path) {

        var ck = "";

        if (expires && expires !== null) {
            var date = new Date();
            var extdate = new Date(date.getTime() + (expires * 1000));
            ck = name + "=" + escape(value) + "; expires=" + extdate.toUTCString();
        } else {
            ck = name + "=" + escape(value);
        }

        if (path && path !== null) ck += "; path=" + escape(path);

        document.cookie = ck;
    },

    isCookieEnabled: function() {

        if (typeof navigator.cookieEnabled !== "undefined") {
            return navigator.cookieEnabled;
        } else {
            document.cookie='wow-test-cookie';
            alert(document.cookie.indexOf('wow-test-cookie'));
            return document.cookie.indexOf('wow-test-cookie') !== -1;
        }
    },

    getNavigatorName: function() {
       if (/Android[\/\s](\d+\.\d+)/.test(navigator.userAgent)) return "Android";
       if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) return "MSIE";
       if (/Trident\/(\d+\.\d+);/.test(navigator.userAgent)) return "MSIE11";
       if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)) return "Firefox";
       if (/Opera[\/\s](\d+\.\d+)/.test(navigator.userAgent)) return "Opera";
       if (/Chrome[\/\s](\d+\.\d+[\.\d+][\.\d+])/.test(navigator.userAgent)) return "Chrome";
       if (/Safari[\/\s](\d+\.\d+[\.\d+])/.test(navigator.userAgent)) return "Safari";
       if (/SeaMonkey[\/\s](\d+\.\d+[\.\d+])/.test(navigator.userAgent)) return "SeaMonkey";

        //alert(navigator.userAgent);
        return null;
    },

    getOS: function() {

        var os = false;
        var nAgt = navigator.userAgent;

        var clientStrings = [
            {s:'Windows 10', r:/(Windows 10.0|Windows NT 10.0)/},
            {s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/},
            {s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/},
            {s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/},
            {s:'Windows Vista', r:/Windows NT 6.0/},
            {s:'Windows Server 2003', r:/Windows NT 5.2/},
            {s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/},
            {s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/},
            {s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/},
            {s:'Windows 98', r:/(Windows 98|Win98)/},
            {s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/},
            {s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
            {s:'Windows CE', r:/Windows CE/},
            {s:'Windows 3.11', r:/Win16/},
            {s:'Android', r:/Android/},
            {s:'Open BSD', r:/OpenBSD/},
            {s:'Sun OS', r:/SunOS/},
            {s:'Linux', r:/(Linux|X11)/},
            {s:'iOS', r:/(iPhone|iPad|iPod)/},
            {s:'Mac OS X', r:/Mac OS X/},
            {s:'Mac OS', r:/(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
            {s:'QNX', r:/QNX/},
            {s:'UNIX', r:/UNIX/},
            {s:'BeOS', r:/BeOS/},
            {s:'OS/2', r:/OS\/2/},
            {s:'Search Bot', r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
        ];
        for (var id in clientStrings) {
            var cs = clientStrings[id];
            if (cs.r.test(nAgt)) {
                os = cs.s;
                break;
            }
        }

        return os;
    },

    callJavaScript: function(container) {

        if (container !== null && container.childNodes && container.childNodes.length > 0) {
            for (var i in container.childNodes) {
                var obj = container.childNodes[i];
                if (obj && obj.tagName !== undefined && obj.tagName.toUpperCase() === 'SCRIPT') {
                    if (obj.innerHTML !== null) window.eval(obj.innerHTML);
                    if (obj.attributes && obj.attributes['src']) {
                        var lib = document.createElement('script');
                        lib.type = "text/javascript";
                        lib.src = obj.attributes['src'].value;
                        document.body.appendChild(lib);
                    }
                }
                this.callJavaScript(obj);
            }
        }
    }
};

Nabu.LibraryManager = function(base_path)
{
    this.base_path = base_path;
    this.libraries = new Object();
};

Nabu.LibraryManager.prototype = {

    getLibraryPath: function(library)
    {
        return Nabu.LibraryManager.Packages.Files[library]
               ? Nabu.LibraryManager.Packages.Files[library]
               : this.base_path + library.toLowerCase() + (nabu.isMinify() ? '.min' : '') + ".js"
        ;
    },

    loadLibrary: function(name, callback)
    {
        var library = this.libraries[name] = this.getLibrary(name, true);

        if (library.isLoaded()) {
            if (typeof callback === 'function') {
                callback();
            }
        } else {
            if (typeof callback === 'function') {
                library.appendCallback(callback);
            }
            library.load();
        }

        return !library.isLoaded();
    },

    registerLibrary: function(name, required, hook)
    {
        var library = this.getLibrary(name);

        if (library !== null) {
            if (typeof hook === 'function') {
                library.setHook(hook);
            }
            library.setRequiredLibraries(required);
            library.loadEnd = true;
            library.register();
        } else {
            throw "Library " + name + " does not exists.";
        }
    },

    getLibrary: function(name, create)
    {
        if (this.libraries[name] !== undefined) {
            return this.libraries[name];
        } else if (create) {
            return new Nabu.LibraryManager.Library(this, name);
        } else {
            return null;
        }
    },

    verifyLibraries: function()
    {
        for(var i in this.libraries) {
            var library = this.libraries[i];
            if (!library.isLoaded()) {
                library.register();
            }
        }
    }
};

Nabu.LibraryManager.Packages = new Object();
Nabu.LibraryManager.Packages.Files = new Array();

Nabu.LibraryManager.Packages.registerPackage = function(path, libraries)
{
    if (libraries instanceof Array) {
        for (i in libraries) {
            var lib = libraries[i];
            var file = path + lib.toLowerCase() + (nabu.isMinify() ? '.min' : '') + ".js";
            if (Nabu.LibraryManager.Packages.Files.indexOf(file) === -1) {
                Nabu.LibraryManager.Packages.Files[lib] = file;
            }
        }
    }
};

Nabu.LibraryManager.Library = function(manager, name)
{
    this.manager = manager;
    this.name = name;
    this.base_path = manager.getLibraryPath(name);
    this.loaded = false;
    this.loadStarted = false;
    this.loadEnd = false;
    this.onloadFunctions = new Array();
    this.required = null;
    this.hook = false;
};

Nabu.LibraryManager.Library.prototype = {

    isLoaded: function()
    {
        return this.loaded;
    },

    load: function()
    {
        var Self = this;

        if (!this.loadStarted) {
            (function() {
                Self.loadStarted = true;
                var lib = document.createElement('script');
                lib.type = "text/javascript";
                lib.src = Self.base_path;
                lib.async = true;
                //lib.defer = true;
                document.body.appendChild(lib);
            })();
        }
    },

    appendCallback: function(callback)
    {
        if (this.loaded === false) this.onloadFunctions.push(callback);
    },

    setHook: function(hook)
    {
        this.hook = (typeof hook === 'function') ? hook : this.hook;
    },
    setRequiredLibraries: function(required)
    {
        this.required = (typeof required === 'undefined' ? null : required);
    },
    register: function()
    {
        if (!this.loaded && this.loadEnd) {
            if (this.verifyDependencies()) {
                if (this.hook instanceof Function) {
                    this.hook();
                }
                while (this.onloadFunctions.length > 0) {
                    var callback = this.onloadFunctions.shift();
                    if ((typeof callback !== 'undefined') && callback !== null) {
                        callback();
                    }
                }
                this.loaded = true;
                this.loadStarted = false;
                this.manager.verifyLibraries();
            }
        }
    },

    verifyDependencies: function()
    {
        var retval = true;

        if (this.required !== null) {
            for (var i = 0; i < this.required.length; i++) {
                var library = this.manager.getLibrary(this.required[i]);
                if (library === null) {
                    this.manager.loadLibrary(this.required[i]);
                    retval = false;
                } else if (!library.isLoaded()) {
                    retval = false;
                }
            }
        }

        return retval;
    }

};

var nabu = new Nabu();

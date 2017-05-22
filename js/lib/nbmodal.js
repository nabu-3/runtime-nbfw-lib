try {
    if (!Nabu) throw "Nabu Manager not loaded";
} catch (e) {
    throw "Nabu Manager not loaded";
}

if (typeof Nabu.UI === 'undefined') {
    Nabu.UI = function() {};
}

Nabu.UI.Modal = function(object, params) {
    this.container = object;
    this.params = params;
    this.modal = null;
    this.events = new Nabu.EventPool();
}

Nabu.UI.Modal.prototype =
{
    addEventListener: function(event)
    {
        this.events.addEventListener(event);
    },

    removeEventListener: function(event)
    {
        this.events.removeEventListener(event);
    },

    openRemote: function(url)
    {
        var Self = this;

        var ajax = new Nabu.Ajax.Connector(url, 'GET', (this.params && this.params.ajax ? this.params.ajax : null));
        ajax.addEventListener(new Nabu.Event({
            onLoad: function(e)
            {
                if (Self.container !== null) {
                    Self.container.innerHTML = e.params.text;
                    nabu.callJavaScript(Self.container);
                    nbBootstrapToggleAll(Self.container);
                    var modal = $(Self.container).find('.modal[role="dialog"]');
                    Self.modal = modal.length === 1 ? modal[0] : null;
                    if (Self.modal !== null) {
                        $(Self.modal).on('show.bs.modal', function(e) {
                            Self.events.fireEvent('onShowStart', Self, {"button" : e.relatedTarget});
                        });
                        $(Self.modal).on('shown.bs.modal', function(e) {
                            Self.events.fireEvent('onShowCompleted', Self, {"button": e.relatedTarget});
                        });
                        $(Self.modal).on('hide.bs.modal', function() {
                            Self.events.fireEvent('onHideStart', Self);
                        })
                        $(Self.modal).on('hidden.bs.modal', function() {
                            $(Self.container).empty();
                            Self.events.fireEvent('onHideCompleted', Self);
                        });
                        var form = $(Self.modal).find('[data-toggle="nabu-form"]');
                        if (form.length === 1) {
                            form.on('beforesubmit.form.nabu', function() {
                                Self.events.fireEvent('onBeforeSubmit');
                            });
                            form.on('response.form.nabu', function(e, params) {
                                Self.events.fireEvent('onAfterSubmit', Self, params);
                            });
                        }
                        Self.events.fireEvent('onLoad', Self);
                        $(Self.modal).modal('show');
                    }
                }
            },
            onError: function(e)
            {
                Self.events.fireEvent('onError', Self, e);
            }
        }));
        ajax.execute();
    },

    close: function()
    {
        if (this.modal) {
            $(this.modal).modal('hide');
        }
    }
};

nabu.registerLibrary('Modal', ['Event', 'Ajax']);

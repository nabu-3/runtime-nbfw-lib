try {
    if (!Nabu) throw "Nabu Manager not loaded";
} catch (e) {
    throw "Nabu Manager not loaded";
}

if (typeof Nabu.UI === 'undefined') {
    Nabu.UI = function() {};
}

Nabu.UI.Table = function(object, params)
{
    this.events = new Nabu.EventPool();
    this.container = object;
    this.params = params;

    this.init();
};

Nabu.UI.Table.prototype = {

    addEventListener: function(event)
    {
        this.events.addEventListener(event);
    },

    removeEventListener: function(event)
    {
        this.events.removeEventListener(event);
    },

    init: function()
    {
        this.initEditButtonStyle();
        this.initSelectableCheckbox();
        this.initToolbar();
    },

    initEditButtonStyle: function()
    {
        var Self = this;

        if (this.params.editButton === 'button') {
            $(this.container).find('.btn-editor')
                .unbind('click')
                .on('click', function(e) {
                    return Self.doEditButtonClick(e);
                })
            ;
        } else if (this.params.editButton === 'line') {
            $(this.container).find('tr[data-id]')
                .unbind('click')
                .on('click', function(e) {
                    return Self.doEditButtonClick(e);
                })
            ;
        }
    },

    initSelectableCheckbox: function()
    {
        var Self = this;

        $(this.container).find('thead th[data-toggle="table-selectable"] input[type="checkbox"]')
            .unbind('click')
            .on('click', function(e) {
                return Self.doSelectableHeadCheckbox(e);
            })
        ;

        $(this.container).find('tbody th[data-toggle="table-selectable"] input[type="checkbox"]')
            .unbind('click')
            .on('click', function(e) {
                return Self.doSelectableBodyCheckbox(e);
            })
        ;
    },

    initToolbar: function()
    {
        var Self = this;

        $(this.container).find('.table-toolbar .btn')
            .unbind('click')
            .on('click', function(e) {
                var data = $(this).data();
                if (data.action) {
                    Self.events.fireEvent('onToolbarClick', Self, {
                        action: data.action,
                        selection: Self.getSelectedItems()
                    });
                }
            })
        ;

        this.enableToolbarButtons();
    },

    enableToolbarButtons: function()
    {
        var toolbar = $(this.container).find('.table-toolbar');
        if (toolbar.length > 0) {
            var selected = this.getSelectedItems();
            toolbar.find('.btn').attr('disabled', 'disabled');
            if (selected !== null) {
                if (selected.length === 1) {
                    toolbar.find('[data-apply="all"], [data-apply="single"], [data-apply="multiple"]')
                           .removeAttr('disabled');
                } else if (selected.length > 1) {
                    toolbar.find('[data-apply="all"], [data-apply="multiple"]')
                           .removeAttr('disabled');
                }
            } else {
                toolbar.find('[data-apply="all"]')
                       .removeAttr('disabled');
            }
        }
    },

    doEditButtonClick: function(e)
    {
        var id = false;
        var Self = this;

        if (this.params.editButton === 'line') {
            id = $(e.currentTarget).data('id');
        } else if (this.params.editButton === 'button') {
            id = $(e.currentTarget).closest('[data-id]').data('id');
        } else {
            throw Exception('Invalid editButton value [' + id + ']');
        }

        var target = $.sprintf(this.params.editor, id);

        if (this.params.editorMode === 'ajax' && this.params.editorContainer.length > 0) {
            var container = $("#" + this.params.editorContainer);
            if (container.length > 0) {
                container.find('[id^=' + this.params.editorContainer + '_]').addClass('hide');
            }
            var myst = container.find('.myst');
            myst.removeClass('hide');
            var current = container.find('[id=' + this.params.editorContainer + '_' + id + ']');
            if (current.length > 0) {
                current.removeClass('hide');
                myst.addClass('hide');
            } else {
                nabu.loadLibrary('Ajax', function() {
                    var ajax = new Nabu.Ajax.Connector(target, 'GET');
                    ajax.addEventListener(new Nabu.Event({
                        onLoad: function(e) {
                            container.append('<div id="' + Self.params.editorContainer + '_' + id + '">' + e.params.text + '</div>');
                            Self.events.fireEvent('onLoadEditor', Self, {
                                id: Self.params.editorContainer + '_' + id
                            });
                            myst.addClass('hide');
                        },
                        onError: function(e) {
                            myst.addClass('hide');
                        }
                    }));
                    ajax.execute();
                });
            }
        } else if (this.params.editorMode === 'page') {
            document.location = target;
        }

        return false;
    },

    doSelectableHeadCheckbox: function(e)
    {
        e.stopPropagation();

        var checks = $(this.container).find('tbody th[data-toggle="table-selectable"] input[type="checkbox"]');
        var head = $(e.currentTarget);
        if (e.currentTarget.checked) {
            checks.prop('checked', true);
        } else {
            checks.prop('checked', false);
        }

        this.enableToolbarButtons();

        return true;
    },

    doSelectableBodyCheckbox: function(e)
    {
        e.stopPropagation();

        var head = $(this.container).find('thead th[data-toggle="table-selectable"] input[type="checkbox"]');
        var total = $(this.container).find('tbody th[data-toggle="table-selectable"] input[type="checkbox"]').length;
        var checks = $(this.container).find('tbody th[data-toggle="table-selectable"] input[type="checkbox"]:checked').length;

        head.prop('checked', (total === checks));

        this.enableToolbarButtons();

        return true;
    },

    getSelectedItems: function()
    {
        var selected = [];

        $(this.container)
            .find('tbody th[data-toggle="table-selectable"] input[type="checkbox"]:checked')
            .closest('tr')
            .each(function(e) {
                if ($(this).data('id')) {
                    selected.push($(this).data('id'));
                }
            })
        ;

        return selected.length > 0 ? selected : null;
    }
};

nabu.registerLibrary('Table', ['Event', 'Ajax']);

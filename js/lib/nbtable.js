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
        this.initUI();
        this.initPager();
        this.initEditButtonStyle();
        this.initSelectableCheckbox();
        this.initToolbar();
    },

    initUI: function()
    {
        var Self = this;

        $(window).resize(function() {
            cells = $(Self.container).find('tbody tr:first').children();
            widths = cells.map(function() {
                return $(this).width();
            }).get();

            $(Self.container).find('thead tr').children().each(function (i, v) {
                $(v).width(widths[i]);
            });
        }).resize();
    },

    initPager: function()
    {
        console.log(this.params);
        if (this.params.tablePager && this.params.tableSize > 0) {
            var pager = $(this.container).find('.table-pager');
            var rows = $(this.container).find('tbody > tr');
            console.log(rows.length);
            if (pager.length === 0) {
                var html =
                    "<div class=\"table-pager hide\">" +
                        "<nav aria-label=\"Page navigation\">" +
                            "<ul class=\"pagination\">" +
                                "<li><a href=\"#\" aria-label=\"Previous\"><span aria-hidden=\"true\">&laquo;</span></a></li>" +
                                "<li><a href=\"#\">1</a></li>" +
                                "<li><a href=\"#\">2</a></li>" +
                                "<li><a href=\"#\">3</a></li>" +
                                "<li><a href=\"#\">4</a></li>" +
                                "<li><a href=\"#\">5</a></li>" +
                                "<li><a href=\"#\" aria-label=\"Next\"><span aria-hidden=\"true\">&raquo;</span></a></li>" +
                            "</ul>" +
                        "</nav>" +
                    "</div>"
                ;
                $(this.container).append(html);
                pager = $(this.container).find('.table-pager');
            } else {
                pager.addClass("hide");
            }

            console.log(pager);
            if (this.params.tableSize < rows.length) {
                pager.removeClass("hide");
            }
        }
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
            .on('click', function(e) {
                var data = $(this).data();
                if (data.action) {
                    Self.events.fireEvent('onToolbarClick', Self, {
                        action: data.action,
                        selection: Self.getSelectedItems()
                    });
                }
                if (!data.toggle) {
                    e.preventDefault();
                    return false;
                } else {
                    return true;
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

        if (this.params.editButton === 'line') {
            id = $(e.currentTarget).data('id');
        } else if (this.params.editButton === 'button') {
            id = $(e.currentTarget).closest('[data-id]').data('id');
        } else {
            throw Exception('Invalid editButton value [' + id + ']');
        }

        this.editor(id);
    },

    editor: function(id)
    {
        var Self = this;
        var is_new = (typeof(id) === 'undefined');
        var target = is_new
                   ? $.sprintf(this.params.editor, '')
                   : $.sprintf(this.params.editor, id)
        ;

        if (this.params.editorMode === 'ajax' && this.params.editorContainer.length > 0) {
            var container = $("#" + this.params.editorContainer);
            if (container.length > 0) {
                container.find('[id^=' + this.params.editorContainer + '_]').addClass('hide');
            }

            var myst = container.find('.myst');
            myst.removeClass('hide');

            var current = is_new ? [] : container.find('[id=' + this.params.editorContainer + '_' + id + ']');
            if (current.length > 0) {
                current.removeClass('hide');
                myst.addClass('hide');
            } else {
                nabu.loadLibrary('Ajax', function() {
                    var ajax = new Nabu.Ajax.Connector(target, 'GET');
                    ajax.addEventListener(new Nabu.Event({
                        onLoad: function(e) {
                            var cont_id = Self.params.editorContainer + '_'
                                        + (is_new ? 'new_' + (new Date().getTime()) + '' + Math.floor(Math.random() * 900) + 100 : id);
                            container.append('<div id="' + cont_id + '">' + e.params.text + '</div>');
                            Self.events.fireEvent('onLoadEditor', Self, {
                                id: cont_id
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

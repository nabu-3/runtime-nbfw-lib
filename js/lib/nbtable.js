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
    this.currentPage = 1;

    try {
        this.table = $(object).find('table').get(0);
    } catch (e) {
        this.table = null;
    }

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

        $(window).resize(
            function()
            {
                var body_widths =
                    $(Self.container)
                        .find('tbody tr[data-type="row"]:first')
                        .children()
                        .map(
                            function() {
                                return $(this).width();
                            }
                        )
                        .get()
                ;
                $(Self.container)
                    .find('thead tr')
                    .children()
                    .each(
                        function (i, v) {
                            console.log(v);
                            console.log(body_widths[i]);
                            $(v).width(body_widths[i]);
                        }
                    )
                ;
            }
        ).resize();
    },

    initPager: function()
    {
        var Self = this;

        $(this.container).find('.table-pager').remove();
        if (this.params.tablePager && this.params.tableSize > 0) {
            var rows = $(this.container).find('tbody > tr:not([data-type="empty"])');
            var buttons = Math.ceil(rows.length / this.params.tableSize);
            var from_page = this.currentPage > 2 ? this.currentPage - 2 : 1;
            var to_page = from_page + 4 > buttons ? buttons : from_page + 4;
            from_page = to_page - from_page < 5 ? (to_page > 4 ? to_page - 4 : 1) : from_page;
            if (buttons > 1) {
                var html =
                    "<div class=\"table-pager\">" +
                        "<nav aria-label=\"Page navigation\">" +
                            "<ul class=\"pagination\">" +
                                "<li" + (this.currentPage === 1 ? ' class="disabled"' : '') + "><a href=\"#\" aria-label=\"Previous\"><span aria-hidden=\"true\">&laquo;</span></a></li>";
                for (var i = from_page; i <= to_page; i++) {
                    html +=     "<li" + (i === this.currentPage ? ' class="active"' : '') + " data-page=\"" + i + "\"><a href=\"#\">" + i + "</a></li>";
                }
                html +=         "<li" + (this.currentPage === buttons ? ' class="disabled"' : '') + "><a href=\"#\" aria-label=\"Next\"><span aria-hidden=\"true\">&raquo;</span></a></li>" +
                            "</ul>" +
                        "</nav>" +
                    "</div>"
                ;
                $(this.container).append(html);

                pager = $(this.container).find('.table-pager');
                if (this.currentPage > 1) {
                    pager.find('li:first-child > a')
                        .on('click',
                            function(e) {
                                e.preventDefault();
                                if (Self.currentPage > 1) {
                                    Self.currentPage--;
                                    Self.initPager();
                                }
                            }
                        )
                    ;
                }
                if (this.currentPage < buttons) {
                    pager.find('li:last-child > a')
                        .on('click',
                            function(e) {
                                e.preventDefault();
                                if (Self.currentPage < buttons) {
                                    Self.currentPage++;
                                    Self.initPager();
                                }
                            }
                        )
                    ;
                }
                pager.find('li[data-page]')
                    .on('click',
                        function(e) {
                            e.preventDefault();
                            Self.currentPage = $(this).data('page');
                            Self.initPager();
                        }
                    )
                ;

                for (var i = 0; i < rows.length; i++) {
                    var page = Math.ceil((i + 1) / this.params.tableSize);
                    if (page === this.currentPage) {
                        $(rows[i]).removeClass('hide');
                    } else {
                        $(rows[i]).addClass('hide');
                    }
                }
            } else {
                rows.removeAttr('hide');
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

        $(this.container).find('tbody td[data-toggle="table-selectable"] input[type="checkbox"]')
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
        var is_new = ((typeof id) === 'undefined');

        var target = is_new
                   ? $.sprintf(this.params.editor, '')
                   : $.sprintf(this.params.editor, id)
        ;

        if (this.params.editorMode === 'ajax' && this.params.editorContainer.length > 0) {

            if (is_new) {
                var row_id =  'new_' + (new Date().getTime()) + '' + Math.floor(Math.random() * 900) + 100;
                this.hideEmptyMessage();
                this.appendRow(row_id);
                this.initSelectableCheckbox();
                this.initEditButtonStyle();
            } else {
                this.editRow(id);
            }

            var container = $("#" + this.params.editorContainer);
            if (container.length > 0) {
                container.find('[id^=' + this.params.editorContainer + '_]').addClass('hide');
            }

            var myst = container.find('.myst');
            myst.removeClass('hide');

            var current = is_new ? [] : container.find('[id=' + this.params.editorContainer + '_' + id + ']');
            if (current.length > 0) {
                var cont_id = Self.params.editorContainer + '_' + (is_new ? row_id : id);
                current.removeClass('hide');
                myst.addClass('hide');
                $(this.table).find('tr').removeClass('editing');
                $(this.table).find('tr[data-id="' + id + '"]').addClass('editing');
                Self.events.fireEvent('onShownEditor', Self, {
                    id: (is_new ? row_id : id),
                    container_id: cont_id
                });
            } else {
                nabu.loadLibrary('Ajax', function() {
                    var ajax = new Nabu.Ajax.Connector(target, 'GET');
                    ajax.addEventListener(new Nabu.Event({
                        onLoad: function(e) {
                            var cont_id = Self.params.editorContainer + '_' + (is_new ? row_id : id);
                            var div = document.createElement('DIV');
                            div.id = cont_id;
                            div.innerHTML = e.params.text;
                            container.append(div);
                            if (is_new) {
                                var multiform=container.find('form[data-multiform-part]');
                                multiform.each(function() {
                                    var part = $(this).data('multiform-part');
                                    $(this).attr('data-multiform-part', $.sprintf(part, row_id));
                                    $(this).data('multiform-part', $.sprintf(part, row_id));
                                });
                            }
                            $(Self.table).find('tr').removeClass('editing');
                            $(Self.table).find('tr[data-id="' + (is_new ? row_id : id) + '"]').addClass('editing');
                            Self.events.fireEvent('onLoadEditor', Self, {
                                id: (is_new ? row_id : id),
                                container_id: cont_id
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

    appendRow: function(row_id)
    {
        if (this.table !== null) {
            var row = this.table.insertRow(this.table.rows.length);
            $(row).attr('data-id', row_id);
            if (this.params.editButton==='line') {
                $(row).addClass('btn-edit-line');
            }
            if (this.table.tHead.rows.length > 0) {
                var head_row = this.table.tHead.rows[0];
                for (var i=0; i < head_row.cells.length; i++) {
                    var head_cell = head_row.cells[i];
                    var cell = row.insertCell();
                    if (head_cell.hasAttribute('data-toggle') && head_cell.getAttribute('data-toggle') === 'table-selectable') {
                        cell.setAttribute('data-toggle', 'table-selectable');
                        cell.innerHTML = "<input type=\"checkbox\">";
                    }
                    if (head_cell.hasAttribute('class')) {
                        cell.setAttribute('class', head_cell.getAttribute('class'));
                    }
                    if (head_cell.hasAttribute('data-name')) {
                        cell.setAttribute('data-name', head_cell.getAttribute('data-name'));
                    }
                    if (head_cell.hasAttribute('data-align')) {
                        $(cell).addClass(head_cell.getAttribute('data-align'));
                    }
                    if (head_cell.hasAttribute('data-is-id') && head_cell.getAttribute('data-is-id') === 'true') {
                        $(cell).html('<i class="fa fa-plus text-danger edited pull-left"></i>');
                    }
                }
            }
        }
    },

    editRow: function(row_id)
    {
        if (this.table !== null) {
            var body_row = $(this.table).find('tbody tr[data-id="' + row_id + '"]').get(0);
            var head_row = this.table.tHead.rows[0];
            if (body_row.cells.length === head_row.cells.length) {
                for (var i = 0; i < head_row.cells.length; i++) {
                    var head_cell = head_row.cells[i];
                    if ($(head_cell).data('is-id')) {
                        var body_cell = body_row.cells[i];
                        if ($(body_cell).find('.edited').length === 0) {
                            $('<i class="fa fa-pencil text-danger edited pull-left"></i>')
                                .insertBefore($(body_cell).children().get(0))
                            ;
                        }
                    }
                }
            }
        }
    },

    getCell: function(row_id, col_name)
    {
        if (this.table !== null) {
            return $(this.table).find('tbody tr[data-id="' + row_id + '"] td[data-name="' + col_name + '"]').html();
        }

        return null;
    },

    doSelectableHeadCheckbox: function(e)
    {
        e.stopPropagation();

        var checks = $(this.container).find('tbody td[data-toggle="table-selectable"] input[type="checkbox"]');
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
        var total = $(this.container).find('tbody td[data-toggle="table-selectable"] input[type="checkbox"]').length;
        var checks = $(this.container).find('tbody td[data-toggle="table-selectable"] input[type="checkbox"]:checked').length;

        head.prop('checked', (total === checks));

        this.enableToolbarButtons();

        return true;
    },

    getSelectedItems: function()
    {
        var selected = [];

        $(this.container)
            .find('tbody td[data-toggle="table-selectable"] input[type="checkbox"]:checked')
            .closest('tr')
            .each(function(e) {
                if ($(this).data('id')) {
                    selected.push($(this).data('id'));
                }
            })
        ;

        return selected.length > 0 ? selected : null;
    },

    connectForm: function(table_row_id, form_id)
    {
        var $form = $(form_id);
        if ($form.length === 1) {
            var form = $form.get(0);
            if (form.nabuForm) {
                var Self = this;
                form.nabuForm.addEventListener(new Nabu.Event({
                    onFieldChange: function(e, params) {
                        var head_cell = $(Self.table).find("thead th[data-name=\"" + e.params.field + "\"]");
                        if (head_cell.length === 1) {
                            var text = e.params.value;
                            var head_lookup = head_cell.data('lookup');
                            if ((typeof head_lookup) !== "undefined") {
                                text = head_lookup[e.params.value];
                            }
                            $(Self.table)
                                .find("tbody tr[data-id=\"" + table_row_id + "\"] td[data-name=\"" + e.params.field + "\"]")
                                .text(text)
                            ;
                        }
                    }
                }));
            } else {
                console.log("Nabu.Form object not found");
            }
        } else if ($form.length > 1) {
            console.log("More than one forms found with same identifier [" + form_id + "]");
        }
    },

    hideEmptyMessage: function()
    {
        $(this.container).find('tbody > tr[data-type="empty"]').addClass('hide');
    }
};

nabu.registerLibrary('Table', ['Event', 'Ajax']);

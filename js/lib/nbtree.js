try {
    if (!Nabu) throw "Nabu Manager not loaded";
} catch (e) {
    throw "Nabu Manager not loaded";
}

if (typeof Nabu.UI === 'undefined') {
    Nabu.UI = function() {};
}

Nabu.UI.Tree = function(object, params)
{
    this.events = new Nabu.EventPool();
    this.container = object;
    this.params = params;

    try {
        this.tree = $(object).find('.tree').get(0);
    } catch (e) {
        this.tree = null;
    }

    this.init();
};

Nabu.UI.Tree.prototype = {

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
        this.initCollapseButtons(this.container);
        this.initToolbar();
        this.initDAD();
    },

    initEditButtonStyle: function()
    {
        var Self = this;

        if (this.params.editButton === 'button') {
            $(this.container).find('.btn-editor')
                .on('click', function(e) {
                    return Self.doEditButtonClick(e);
                })
            ;
        } else if (this.params.editButton === 'line') {
            $(this.container).find('.tree-level > li > .tree-item')
                .on('click', function(e) {
                    return Self.doEditButtonClick(e);
                })
            ;
        }
    },

    initCollapseButtons: function(container)
    {
        var Self = this;
        $(container)
            .find('.tree-item-toolbar > .btn-expand')
                .on('click', function(e) {
                    e.stopPropagation();
                    var item = $(this).closest('.tree-item');
                    Self.toggleCollapsedItem(item);
                    return false;
                })
        ;
    },

    initToolbar: function()
    {
        var Self = this;

        $(this.container).find('.tree-toolbar .btn')
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

    initDAD: function()
    {
        $(this.container).find('[data-toggle="drag-item"]').on('nabu.DAD.beforeDragStart', function() {
            console.log("nabu.DAD.beforeDragStart");
            return true;
        });
    },

    enableToolbarButtons: function()
    {
        var toolbar = $(this.container).find('.tree-toolbar');
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

    toggleCollapsedItem: function(item)
    {
        var li = $(item).closest('li');
        li.toggleClass('expanded');
        var data = $(item).data();
        this.events.fireEvent('onToggle', this, {
            id: (typeof data.id === 'undefined') ? null : data.id,
            expanded: li.hasClass('expanded')
        });
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
        if (typeof this.params.editor !== 'string' || this.params.editor.length === 0) {
            console.log("Invalid editor Ajax URL");
            return;
        }

        var Self = this;
        var is_new = ((typeof id) === 'undefined');

        var target = is_new
                   ? $.sprintf(this.params.editor, '')
                   : $.sprintf(this.params.editor, id)
        ;

        if (this.params.editorMode === 'ajax' && this.params.editorContainer.length > 0) {

            if (is_new) {
                var row_id =  'new_' + (new Date().getTime()) + '' + Math.floor(Math.random() * 900) + 100;
                //this.appendRow(row_id);
                //this.initSelectableCheckbox();
                //this.initEditButtonStyle();
            } else {
                this.editItem(id);
            }

            var container = $("#" + this.params.editorContainer);
            if (container.length > 0) {
                container.find('[id^="' + this.params.editorContainer + '_"]').addClass('hide');
            }

            var myst = container.find('.myst');
            myst.removeClass('hide');

            var current = is_new ? [] : container.find('[id="' + this.params.editorContainer + '_' + id + '"]');
            if (current.length > 0) {
                current.removeClass('hide');
                myst.addClass('hide');
                $(this.tree).find('.tree-level > li > .tree-item').removeClass('editing');
                $(this.tree).find('.tree-level > li > .tree-item[data-id="' + id + '"]').addClass('editing');
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
                            $(Self.tree).find('.tree-level > li > .tree-item').removeClass('editing');
                            $(Self.tree).find('.tree-level > li > .tree-item[data-id="' + (is_new ? row_id : id) + '"]').addClass('editing');
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

    getSelectedItems: function()
    {
        var selected = [];

        $(this.container)
            .find('.tree-level > li > .tree-item.active')
            .each(function(e) {
                if ($(this).data('id')) {
                    selected.push($(this).data('id'));
                }
            })
        ;

        return selected.length > 0 ? selected : null;
    },

    editItem: function(item_id)
    {
        if (this.tree !== null) {
            var item = $(this.tree).find('.tree-level > li > .tree-item[data-id="' + item_id + '"]');
            var flags = item.find('.tree-item-flags');
            if (flags.find('.edited').length === 0) {
                $('<i class="fa fa-pencil text-danger edited pull-left"></i>')
                    .appendTo(flags);
            }
        }
    },

    connectForm: function(tree_row_id, form_id)
    {
        var $form = $(form_id);
        if ($form.length === 1) {
            var form = $form.get(0);
            if (form.nabuForm) {
                var Self = this;
                form.nabuForm.addEventListener(new Nabu.Event({
                    onFieldChange: function(e, params) {
                        /*
                        var head_cell = $(Self.tree).find("thead th[data-name=\"" + e.params.field + "\"]");
                        if (head_cell.length === 1) {
                            var text = e.params.value;
                            var head_lookup = head_cell.data('lookup');
                            if ((typeof head_lookup) !== "undefined") {
                                text = head_lookup[e.params.value];
                            }
                            $(Self.tree)
                                .find("tbody tr[data-id=\"" + tree_row_id + "\"] td[data-name=\"" + e.params.field + "\"]")
                                .text(text)
                            ;
                        }
                        */
                    }
                }));
            } else {
                console.log("Nabu.Form object not found");
            }
        } else {
            console.log("More than one forms found with same identifier");
        }
    }
};

nabu.registerLibrary('Tree', ['Event']);

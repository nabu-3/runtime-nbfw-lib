try {
    if (!Nabu) throw "Nabu Manager not loaded";
} catch (e) {
    throw "Nabu Manager not loaded";
}

Nabu.Bootstrap = function() {
    this.bootloaders = new Array();
};

Nabu.Bootstrap.prototype =
{
    addLoader: function(loader) {
        if (typeof loader === "function") {
            this.bootloaders.push(loader);
        }
    },

    runLoaders: function(container) {
        for (var i in this.bootloaders) {
            var loader = this.bootloaders[i];
            loader(container);
        }
    }
}

var nabuBootstrap = new Nabu.Bootstrap();

$.fn.nabuTable = function(options)
{
    return this.each(function() {
        var opts = $.extend({}, $.fn.nabuTable.defaults, options);
        var data = $(this).data();
        opts = $.extend({}, opts, data);
        this.nabuTable = new Nabu.UI.Table(this, opts);
        var Self = this;
        this.nabuTable.addEventListener(new Nabu.Event({
            onToolbarClick: function(e) {
                if (e.params.action && e.params.action.length > 0) {
                    $(Self).trigger('pressed.' + e.params.action + '.toolbar.table.nabu', e.params);
                } else {
                    $(Self).trigger('pressed.toolbar.table.nabu', e.params);
                }
            },
            onLoadEditor: function(e) {
                nbBootstrapToggleAll('#' + e.params.container_id);
                Self.nabuTable.connectForm(e.params.id, '#' + e.params.container_id + ' form');
                $(Self).trigger('loaded.editor.table.nabu', e.params);
            },
            onShownEditor: function(e) {
                $(Self).trigger('shown.editor.table.nabu', e.params);
            }
        }));
    });
};

$.fn.nabuTable.defaults = {
    "tablePager": true,
    "tableSize": 10,
    "api": null,
    "editor": null,
    "editorMode": "page",
    "editButton": "line"
};

function nbBootstrapTables(container)
{
    var tables = $(container).find('[data-toggle="nabu-table"]');
    if (tables.length > 0) {
        nabu.loadLibrary('Table', function() {
            tables.nabuTable();
        });
    }
}

$.fn.nabuTree = function(options)
{
    return this.each(function() {
        var opts = $.extend({}, $.fn.nabuTree.defaults, options);
        var data = $(this).data();
        opts = $.extend({}, opts, data);
        this.nabuTree = new Nabu.UI.Tree(this, opts);
        var Self = this;
        this.nabuTree.addEventListener(new Nabu.Event({
            onToolbarClick: function(e) {
                if (e.params.action && e.params.action.length > 0) {
                    $(Self).trigger('pressed.' + e.params.action + '.toolbar.tree.nabu', e.params);
                } else {
                    $(Self).trigger('pressed.toolbar.tree.nabu', e.params);
                }
            },
            onLoadEditor: function(e) {
                nbBootstrapToggleAll('#' + e.params.container_id);
                Self.nabuTree.connectForm(e.params_id, '#' + e.params.container_id + ' form');
            }
        }));
    });
};

$.fn.nabuTree.defaults = {
    "api": null,
    "editor": null,
    "editorMode": "page",
    "editorButton": "line"
};

function nbBootstrapTrees(container)
{
    var trees = $(container).find('[data-toggle="nabu-tree"]');
    if (trees.length > 0) {
        nabu.loadLibrary('Tree', function() {
            trees.nabuTree();
        });
    }
}

$.fn.nabuForm = function(options)
{
    return this.each(function() {
        var opts = $.extend({}, $.fn.nabuForm.defaults, options);
        var data = $(this).data();
        $.extend(opts, data);
        var form = new Nabu.UI.Form(this, opts);
        var Self = this;
        form.addEventListener(new Nabu.Event({
            onBeforeSubmit: function(e) {
                return $(Self).trigger("beforesubmit.form.nabu");
            },
            onSubmit: function(e) {
                var data = $(Self).data();
                if (data.actionTemplate && data.actionTemplate.length > 0) {
                    var field = (data.actionTemplateField && data.actionTemplateField.length > 0
                              ? data.actionTemplateField
                              : 'id'
                    );
                    if (e.params.response.json.data && e.params.response.json.data[field]) {
                        $(Self).data('id', e.params.response.json.data[field]);
                    }
                }
                return $(Self).trigger("response.form.nabu", e.params);
            },
            onValidateField: function(e) {
                $(Self).trigger(e.params.name + ".validate.form.nabu", e.params);
                return e.params.status;
            }
        }));
    });
};

$.fn.nabuForm.defaults = {
    evaluate: false,
    validation: false,
    reflection: null,
    ajax: false,
    ajax_target: null,
    ajax_on_upload_progress: null,
    ajax_onload: null
};

function nbBootstrapForms(container)
{
    var forms = $(container).find('form[data-toggle="nabu-form"]');
    if (forms.length > 0) {
        nabu.loadLibrary('Form', function() {
            forms.nabuForm();
        });
    }
}

$.fn.nabuFormSelect = function(options)
{
    return this.each(function() {
        var opts = $.extend({}, $.fn.nabuFormSelect.defaults, options);
        var data = $(this).data();
        opts = $.extend({}, opts, data);
        var table = new Nabu.UI.Select(this, opts);
    });
};

$.fn.nabuFormSelect.defaults = {
    "tableSize": 25,
    "api": null,
    "editor": null,
    "editButton": "line"
};

function nbBootstrapSelects(container)
{
    var selects = $(container).find('[data-toggle="nabu-select"]');
    if (selects.length > 0) {
        nabu.loadLibrary('Select', function() {
            selects.nabuFormSelect();
        });
    }
}

$.fn.nabuTabLink = function(options)
{
    return this.each(function() {
        var opts = $.extend({}, $.fn.nabuTabLink.defaults, options);
        var data = $(this).data();
        opts = $.extend({}, opts, data);
        $(this).on('click', function(e) {
            var tab_control = $($(this).data('tags'));
            if (tab_control.length > 0) {
                var tab_item = tab_control.find('[href="' + $(this).attr('href') + '"]');
                if (tab_item.length > 0) {
                    e.preventDefault();
                    tab_item.tab('show');
                }
            }
        });
    });
};

$.fn.nabuTabLink.defaults = {

};

function nbBootstrapTabLinks(container)
{
    $(container).find('[data-toggle="nabu-tab-link"]').nabuTabLink();
}

function nbBootstrapTabPersistence(container)
{
    var tab_groups = $(container).find('[data-toggle="tab-persistence"]');
    if (tab_groups.length > 0) {
        nabu.loadLibrary('Storage', function() {
            var storage = new Nabu.Storage(true);
            tab_groups.each(function() {
                var id = $(this).data('persistenceId');
                if (typeof id !== 'undefined') {
                    var tab = storage.getValue('tabPersistence_' + id);
                    if (typeof tab !== 'undefined') {
                        $(this).find('[href="' + tab + '"]').tab('show');
                    }
                    $(this).find('[data-toggle="tab"]').on('click', function() {
                        tab = $(this).attr('href');
                        if (typeof tab !== 'undefined') {
                            storage.setValue('tabPersistence_' + id, tab);
                        }
                    });
                }
            });
        });
    }
}

$.fn.nabuSplitPanels = function(options)
{
    return this.each(function() {
        var opts = $.extend({}, $.fn.nabuSplitPanels.defaults, options);
        var data = $(this).data();
        opts = $.extend({}, opts, data);
        $(this)
            .on('mousedown', function(e) {
                var event = e.originalEvent;
                var target = null;
                if ($(event.target).hasClass('split-separator')) {
                    target = event.target;
                } else {
                    var closest = $(event.target).closest('.split-separator');
                    if (closest.length > 0) {
                        target = closest.get(0);
                    }
                }
                if (target !== null) {
                    var prev_content = $(target).prev('.split-content');
                    if (prev_content.length > 0) {
                        this._nabuCursorPosition = {
                            separator: target,
                            x: e.clientX,
                            y: e.clientY,
                            dx: e.clientX - target.offsetWidth,
                            dy: e.clientY - target.offsetHeight,
                            w: prev_content.get(0).offsetWidth,
                            h: prev_content.get(0).offsetHeight,
                            pressed: true
                        };
                    }
                    e.preventDefault();
                    e.stopPropagation();
                }
            })
            .on('mousemove', function(e) {
                var event = e.originalEvent;
                if (this._nabuCursorPosition && this._nabuCursorPosition.pressed) {
                    target = this._nabuCursorPosition.separator;
                    var prev_content = $(target).prev('.split-content');
                    if (prev_content.length > 0) {
                        if (opts.splitDirection==='horizontal') {
                            var dx = this._nabuCursorPosition.w + event.clientX - this._nabuCursorPosition.x;
                            if (dx < 0) {
                                dx = 0;
                            }
                            prev_content.css({
                                'flex-basis': dx + 'px',
                                'flex-grow': 0,
                                'width': dx + 'px'
                            });
                            $(window).resize();
                        }
                    }
                    e.preventDefault();
                    e.stopPropagation();
                }
            })
            .on('mouseout', function(e) {
                var x = e.originalEvent.clientX;
                var y = e.originalEvent.clientY;

                var dim = this.getBoundingClientRect();

                if (x <= dim.left || x >= dim.right || y <= dim.top || y >= dim.bottom) {
                    if (this._nabuCursorPosition) {
                        this._nabuCursorPosition.pressed = false;
                    }
                }
            })
            .on('mouseup', function(e) {
                if (this._nabuCursorPosition) {
                    this._nabuCursorPosition.pressed = false;
                }
            })
        ;
    });
};

$.fn.nabuSplitPanels.defaults = {
    "direction": "horizontal"
};

function nbBootstrapSplitPanels(container)
{
    $(container).find('[data-toggle="nabu-split-panels"]').nabuSplitPanels();
}

$.fn.nabuMultiForm = function(options)
{
    return this.each(function() {
        var opts = $.extend({}, $.fn.nabuMultiForm.defaults, options);
        var data = $(this).data();
        opts = $.extend({}, opts, data);
        $(this).find('[data-toggle="nabu-multiform-save"]')
            .on('click', function(e) {
                if (typeof CKEDITOR !== 'undefined') {
                    for(var name in CKEDITOR.instances) {
                        CKEDITOR.instances[name].updateElement();
                    }
                }
                var multiform = $(this).closest('[data-toggle="nabu-multiform"]');
                var forms = multiform.find('form[data-toggle="nabu-form"][data-multiform-part]');
                if (forms.length > 0) {
                    var parts = new Array();
                    forms.each(function() {
                        if (this.nabuForm) {
                            parts.push($(this).data('multiform-part'));
                        }
                    });
                    parts.sort();
                }
                for (var i in parts) {
                    var form = multiform.find('form[data-toggle="nabu-form"][data-multiform-part="' + parts[i] + '"]');
                    form.each(function() {
                        this.nabuForm.onSubmit(e.originalEvent);
                    });
                }
            })
        ;
    });
}

$.fn.nabuMultiForm.defaults = {

};

function nbBootstrapMultiForms(container)
{
    $(container).find('[data-toggle="nabu-multiform"]').nabuMultiForm();
}

$.fn.nabuModal = function(options)
{
    return this.each(function() {

    });
}

$.fn.nabuModal.defaults = {

};

function nbBootstrapModals(container)
{
    $(container).find('[data-toggle="nabu-modal"]').nabuModal();
}

$.fn.nabuDragAndDrop = function(options)
{
    if (typeof options === 'string') {

    } else {
        return this.each(function()
        {
            var obj = this;
            var opts = $.extend({}, $.fn.nabuDragAndDrop.defaultsContainer, options);
            var data = $(this).data();
            opts = $.extend({}, opts, data);

            var container = new Nabu.DragAndDrop.Container(this, opts);

            var drops = $(this).find('[data-toggle="drop-container"]');
            drops.each(function() {
                var data = $(this).data();
                var dropOpts = $.extend({}, $.fn.nabuDragAndDrop.defaultsDrop, data);
                this.dropContainer = new Nabu.DragAndDrop.DropContainer(container, this, dropOpts);
            });

            var drags = $(this).find('[data-toggle="drag-item"]');
            drags.each(function() {
                var data = $(this).data();
                var dragOpts = $.extend({}, $.fn.nabuDragAndDrop.defaultsDrag, data);
                this.dragItem = new Nabu.DragAndDrop.DragItem(container, this, dragOpts);
                this.dragItem.addEventListener(new Nabu.Event({
                    beforeDragStart: function(source, params) {
                        return $(obj).triggerHandler('nabu.DAD.beforeDragStart');
                    }
                }));
            });

            $(this).triggerHandler('nabu.DAD.afterInitContainer');
        });
    }
};

$.fn.nabuDragAndDrop.defaultsContainer = {
};

$.fn.nabuDragAndDrop.defaultsDrop = {
};

$.fn.nabuDragAndDrop.defaultsDrag = {
};

function nbBootstrapDADs(container)
{
    var containers = $(container).find('[data-toggle="nabu-drag-and-drop"]');
    if (containers.length > 0) {
        nabu.loadLibrary('DragAndDrop', function() {
            containers.nabuDragAndDrop();
        });
    }
}

$.fn.nabuLangSelector = function(options)
{
    var checkLangs = function(opts)
    {
        var count = $(opts.container).find('[lang].active').length;
        $(opts.container).find('li[lang]').each(function() {
            var lang = $(this).attr('lang');
            var from = typeof opts.target === 'string' ? $(opts.target) : $(document);
            if ($(this).hasClass('active')) {
                from.find('[data-toggle="toggable-lang"] [lang="' + lang + '"]').removeClass('hide');
                if (count === 1) {
                    from.find('[data-toggle="toggable-lang"] .flag[lang="' + lang + '"]').addClass('hide');
                }
            } else {
                from.find('[data-toggle="toggable-lang"] [lang="' + lang + '"]').addClass('hide');
            }
        });
    };

    if (typeof(options) === 'string') {
        if (options === 'refresh') {
            this.each(function() {
                checkLangs(this.options);
            });
        }
    } else {
        return this.each(function() {
            var opts = $.extend({}, $.fn.nabuLangSelector.defaults, options);
            var data = $(this).data();
            opts = $.extend(opts, data);
            opts.container = this;
            this.options = opts;

            checkLangs(opts);

            $(this).find('li[lang] > a').on('click', function() {
                var li = $(this).closest('li[lang]');
                var count = $(opts.container).find('[lang].active').length;
                if (li.hasClass('active')) {
                    if (count > 1) {
                        li.removeClass('active');
                        $(this).removeClass('btn-default').addClass('btn-link');
                    }
                } else {
                    if (count < 2) {
                        li.addClass('active');
                        $(this).removeClass('btn-link').addClass('btn-default');
                    }
                }
                checkLangs(opts);
            });
        });
    }
}

$.fn.nabuLangSelector.defaults = {
};

function nbBootstrapLangSelectors(container)
{
    var selectors = $(container).find('[data-toggle="nabu-lang-selector"]');
    selectors.nabuLangSelector();
}

function nbBootstrapInputGroups(container)
{
    var groups = $(container).find('[data-toggle="nabu-input-group"]');
    if (groups.length > 0) {
        groups.each(function() {
            var group = $(this);
            group.find('input[type="radio"]').on('change', function() {
                var Self = this;
                var input = $(this);
                var form = input.closest('form');
                var same = form.find('input[name="' + input.attr('name') + '"]');
                same.closest('[data-toggle="nabu-input-group"]').find('input,select,textarea,button').each(function() {
                    if ($(this).attr('name') !== input.attr('name')) {
                        $(this).addClass('disabled');
                        $(this).attr('disabled', true);
                    }
                });
                group.find('input,select,textarea,button').removeClass('disabled');
                group.find('input,select,textarea,button').attr('disabled', false);
            });
        });
    }
}

$.fn.nabuReflect = function(options)
{
    var doReflect = function(opts, object, id) {
        var target = $(opts.reflect);
        target.each(function() {
            var Self = this;
            if (this.hasAttribute('data-refresh')) {
                var url = $.sprintf($(this).data('refresh'), id);
                var refresh = new Nabu.Ajax.Connector(url, 'GET');
                refresh.addEventListener(new Nabu.Event({
                    onLoad: function(e) {
                        Self.innerHTML = e.params.text;
                        nabu.callJavaScript(Self);
                        nbBootstrapToggleAll(Self);
                    }
                }));
                refresh.execute();
            }
        });
    };

    return this.each(function() {
        var opts = $.extend({}, $.fn.nabuReflect.defaults, options);
        var data = $(this).data();
        opts = $.extend({}, opts, data);
        if (this.hasAttribute('data-toggle') && $(this).data('toggle') === 'nabu-select' && this.hasAttribute('data-reflect')) {
            $(this).on('change.select.nabu', function(e, params) {
                doReflect(opts, this, params.option);
            });
        }
    });
};

$.fn.nabuReflect.defaults = {};

function nbBootstrapReflect(container)
{
    var selectors = $(container).find('[data-reflect]');
    selectors.nabuReflect();
}

function nbBootstrapToggleAll(container)
{
    nbBootstrapDADs(container);
    nbBootstrapSelects(container);
    nbBootstrapSplitPanels(container);
    nbBootstrapTabLinks(container);
    nbBootstrapTabPersistence(container);
    nbBootstrapInputGroups(container);
    nbBootstrapLangSelectors(container);
    nbBootstrapTables(container);
    nbBootstrapTrees(container);
    nbBootstrapForms(container);
    nbBootstrapReflect(container);
    nbBootstrapMultiForms(container);
    nbBootstrapModals(container);

    nabuBootstrap.runLoaders(container);

    $(container).find('[data-toggle="tab"]').on('shown.bs.tab', function() {
        $(window).resize();
    });

    $(container).find('.box [data-toggle="box-maximize"]').on('click', function() {
        var box = $(this).closest('.box');
        if (box.length === 1) {
            $(this).addClass('hide');
            $('body').addClass('modal-open');
            $('body').append('<div class="modal-backdrop fade in"></div>');
            box.addClass('maximized');
            $(this).siblings('[data-toggle="box-restore"]').removeClass('hide');
        }
    });

    $(container).find('.box [data-toggle="box-restore"]').on('click', function() {
        var box = $(this).closest('.box');
        if (box.length === 1) {
            $(this).addClass('hide');
            $('body .modal-backdrop').remove();
            $('body').removeClass('modal-open');
            box.removeClass('maximized');
            $(this).siblings('[data-toggle="box-maximize"]').removeClass('hide');
        }
    });
}

$(document).ready(function() {
    nbBootstrapToggleAll(document);
});

$.fn.nabuTable = function(options)
{
    return this.each(function() {
        var opts = $.extend({}, $.fn.nabuTable.defaults, options);
        var data = $(this).data();
        opts = $.extend({}, opts, data);
        var table = new Nabu.UI.Table(this, opts);
    });
};

$.fn.nabuTable.defaults = {
    "tableSize": 25,
    "api": null,
    "editor": null,
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
        $.extend(opts, data);
        var tree = new Nabu.UI.Tree(this, opts);
        var Self = this;
        tree.addEventListener(new Nabu.Event({
            onClick: function(e) {
                console.log('onClick');
                $(Self).trigger('click.tree.nabu', e.params.id);
            },
            onToggle: function(e) {
                console.log(e.params);
            },
            onCancelSelection: function(e) {
                console.log('onCancelSelection');
                console.log(e.params);
            }
        }));
    });
};

$.fn.nabuTree.defaults = {
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
            onSubmit: function(e) {
                $(Self).trigger("response.form.nabu", e.params);
            }
        }));
    });
};

$.fn.nabuForm.defaults = {
    evaluate: false,
    validation: false,
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
        var table = new Nabu.Form.Select(this, opts);
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

$.fn.nabuDragAndDrop = function(options)
{
    return this.each(function() {
        var obj = this;
        var opts = $.extend({}, $.fn.nabuDragAndDrop.defaults, options);
        var data = $(this).data();
        opts = $.extend({}, opts, data);
        switch (opts.type) {
            case 'item':
                var manager = new Nabu.DragAndDrop.DragItem(this, opts);
                manager.addEventListener(new Nabu.Event({
                    beforeDragStart: function(source, params) {
                        console.log("beforeDragStart");
                        console.log("====> " + $(obj).triggerHandler('nabu.DAD.beforeDragStart'));
                        return $(obj).triggerHandler('nabu.DAD.beforeDragStart');
                    }
                }));
                break;
            case 'container':
                var manager = new Nabu.DragAndDrop.DropContainer(this, opts);
                break;
        }
    });
};

$.fn.nabuDragAndDrop.defaults = {
};

function nbBootstrapDADs(container)
{
    var drops = $(container).find('[data-toggle="drop-container"]');
    if (drops.length > 0) {
        nabu.loadLibrary('DragAndDrop', function() {
            drops.nabuDragAndDrop({
                type: 'container'
            });
        })
    }
    var drags = $(container).find('[data-toggle="drag-item"]');
    if (drags.length > 0) {
        nabu.loadLibrary('DragAndDrop', function() {
            drags.nabuDragAndDrop({
                type: 'item'
            });
        })
    }
}

$.fn.nabuLangSelector = function(options)
{
    return this.each(function() {
        var opts = $.extend({}, $.fn.nabuLangSelector.defaults, options);
        var data = $(this).data();
        opts = $.extend(opts, data);
        opts.container = this;


        var checkLangs = function()
        {
            var count = $(opts.container).find('[lang].active').length;
            $(opts.container).find('li[lang]').each(function() {
                var lang = $(this).attr('lang');
                if ($(this).hasClass('active')) {
                    $('[data-toggle="toggable-lang"] [lang="' + lang + '"]').removeClass('hide');
                    if (count === 1) {
                        $('[data-toggle="toggable-lang"] .flag[lang="' + lang + '"]').addClass('hide');
                    }
                } else {
                    $('[data-toggle="toggable-lang"] [lang="' + lang + '"]').addClass('hide');
                }
            });
        };

        checkLangs();

        $(this).find('li[lang] > a').on('click', function() {
            var li = $(this).closest('[lang]');
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
            checkLangs();
        });
    });
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

function nbBootstrapToggleAll(container)
{
    nbBootstrapDADs(container);
    nbBootstrapSelects(container);
    nbBootstrapInputGroups(container);
    nbBootstrapLangSelectors(container);
    nbBootstrapTables(container);
    nbBootstrapTrees(container);
    nbBootstrapForms(container);
}

nbBootstrapToggleAll(document);

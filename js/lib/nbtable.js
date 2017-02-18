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
    this.container = object;
    this.params = params;

    this.init();
};

Nabu.UI.Table.prototype = {
    init: function()
    {
        this.initEditButtonStyle();
        this.initSelectableCheckbox();
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

        document.location = $.sprintf(this.params.editor, id);

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
        return true;
    },

    doSelectableBodyCheckbox: function(e)
    {
        e.stopPropagation();

        var head = $(this.container).find('thead th[data-toggle="table-selectable"] input[type="checkbox"]');
        var total = $(this.container).find('tbody th[data-toggle="table-selectable"] input[type="checkbox"]').length;
        var checks = $(this.container).find('tbody th[data-toggle="table-selectable"] input[type="checkbox"]:checked').length;

        head.prop('checked', (total === checks));

        return true;
    }
};

nabu.registerLibrary('Table', ['Event', 'Ajax']);

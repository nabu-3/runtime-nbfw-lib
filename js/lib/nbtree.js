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
        var Self = this;
        $(this.container).find('.tree-level > li > .tree-item').on('click', function(e) {
            e.stopPropagation();
            var li = $(this.parentElement);
            $(Self.container).find('.tree-level > li').removeClass('active');
            li.addClass('active');
            var data = li.data();
            Self.events.fireEvent('onClick', Self, {
                id: (typeof data.id === 'undefined') ? null : data.id
            });
            return false;
        });

        $(this.container).find('.tree-level li > .tree-item .btn-toolbar > .btn-expand').on('click', function(e) {
            e.stopPropagation();
            var li = $(this).closest('li');
            li.toggleClass('expanded');
            if (!li.hasClass('expanded')) {
                li.find('.nabu-tree-level > li').removeClass('active');
                if ($(Self.container).find('.tree-level > li.active').length === 0) {
                    Self.events.fireEvent('onCancelSelection', Self);
                }
            }
            var data = $(this.parentElement).data();
            Self.events.fireEvent('onToggle', Self, {
                id: (typeof data.id === 'undefined') ? null : data.id,
                expanded: li.hasClass('expanded')
            });
            return false;
        });

        $(this.container).find('[data-toggle="drag-item"]').on('nabu.DAD.beforeDragStart', function() {
            console.log("nabu.DAD.beforeDragStart");
            return true;
        });
    }
};

nabu.registerLibrary('Tree', ['Event']);

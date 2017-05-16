try {
    if (!Nabu) throw "Nabu Manager not loaded";
} catch (e) {
    throw "Nabu Manager not loaded";
}

if (typeof Nabu.UI === 'undefined') {
    Nabu.UI = function() {};
}

Nabu.UI.Select = function(object, params) {
    this.container = object;
    this.input = $(object).find('input[type="hidden"]');
    this.caption = $(object).find('button:first-child').get(0);
    this.params = params;

    this.init();
};

Nabu.UI.Select.prototype = {
    init: function()
    {
        var Self = this;
        if (this.input.length === 1) {
            $(this.container).find('.dropdown-menu [data-id]').unbind('click').on('click', function() {
                var id = $(this).data('id');
                Self.input.val(id);
                Self.caption.innerText = this.innerText;
                $(this).siblings('.active').removeClass('active');
                $(this).addClass('active');
                $(Self.container).trigger('change.nb.select', {option: id});
            });
        }
    }
};

nabu.registerLibrary('Select', ['Event', 'Ajax']);

try {
    if (!Nabu) throw "Nabu Manager not loaded";
} catch (e) {
    throw "Nabu Manager not loaded";
}

if (!Nabu.prototype.DragAndDrop) {
    Nabu.DragAndDrop = function() {};
}

Nabu.DragAndDrop.DragItem = function(object, params)
{
    console.log("new DragItem object");
    this.events = new Nabu.EventPool();
    this.object = object;
    this.object.dragItem = this;
    this.touchSupport = 'ontouchend' in document;
    this.dragging = false;
    this.draginit = false;
    this.dragAnchor = null;
    this.dragCoordinates = {
        ox: 0, oy: 0, dx: 0, dy: 0, width: 0, height: 0
    }

    this.init();
};

Nabu.DragAndDrop.DragItem.prototype = {

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
        if (this.object !== false) {
            if (this.touchSupport) {
                $(this.object).on('touchstart', function(e) {
                    console.log('DragItem.touchstart');
                });
                $(this.object).on('touchmove', function(e) {
                    console.log('DragItem.touchmove');
                });
                $(this.object).on('touchend', function(e) {
                    console.log('DragItem.touchend');
                });
            } else {
                $(this.object).on('mousedown', function(e) {
                    return Self.dragStart(e);
                });
                $(this.object).on('mousemove', function(e) {
                    return Self.dragMove(e);
                });
                $(this.object).on('mouseup', function(e) {
                    return Self.dragEnd(e);
                });
            }
        }
    },

    dragStart: function(e)
    {
        this.draginit = true;
        var bounds = this.object.getBoundingClientRect();
        this.dragCoordinates.ox = bounds.left;
        this.dragCoordinates.oy = bounds.top;
        this.dragCoordinates.dx = e.clientX - bounds.left;
        this.dragCoordinates.dy = e.clientY - bounds.top;
        this.dragCoordinates.width = bounds.width;
        this.dragCoordinates.height = bounds.height;
        console.log(e);
        console.log(e.clientX);
        console.log(e.clientY);
        console.log(bounds);
        console.log(this.dragCoordinates);

        this.dragging = true;
    },

    dragMove: function(e)
    {
        if (this.dragging) {
            if (this.draginit) {
                $(this.object).addClass('dragging');
                this.dragAnchor = document.createElement('SPAN');
                this.dragAnchor.style.display='hidden';
                this.object.parentNode.replaceChild(this.dragAnchor, this.object);
                document.body.appendChild(this.object);
                this.object.style.width = this.dragCoordinates.width + 'px';
                this.object.style.height = this.dragCoordinates.height + 'px';
                this.draginit = false;
            }
            this.object.style.left = (e.clientX - this.dragCoordinates.dx) + 'px';
            this.object.style.top = (e.clientY - this.dragCoordinates.dy) + 'px';
        }

        return true;
    },

    dragEnd: function(e)
    {
        if (this.dragging) {
            if (this.dragAnchor !== null) {
                var parent = this.dragAnchor.parentNode;
                document.body.removeChild(this.object);
                parent.replaceChild(this.object, this.dragAnchor);
                this.dragAnchor = null;
            }
            $(this.object).removeClass('dragging');
            $(this.object).removeAttr('style');
            this.dragging = false;
            e.preventDefault();
            e.stopPropagation();
        }
    }

};

Nabu.DragAndDrop.DropContainer = function(object, params)
{
    console.log("new DropContainer object");
    this.events = new Nabu.EventPool();
    this.object = object;
    this.touchSupport = 'ontouchend' in document;

    this.init();
};

Nabu.DragAndDrop.DropContainer.prototype = {

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
        if (this.object !== false) {
            if (this.touchSupport) {

            } else {
                $(this.object).on('mousemove', function(e) {
                    console.log('mousemove');
                    return true;
                });
                $(this.object).on('mouseout', function(e) {
                    console.log('mouseout');
                });
            }
        }
    },

    dragOver: function(e) {

    }
};

nabu.registerLibrary('DragAndDrop', ['Event']);

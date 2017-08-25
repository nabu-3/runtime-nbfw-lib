try {
    if (!Nabu) throw "Nabu Manager not loaded";
} catch (e) {
    throw "Nabu Manager not loaded";
}

if (!Nabu.prototype.DragAndDrop) {
    Nabu.DragAndDrop = function() {};
}

Nabu.DragAndDrop.Container = function(object, params)
{
    this.events = new Nabu.EventPool();
    this.object = object;
    this.inner = $(object).find('.tree-inner').get(0);
    this.object.dadContainer = this;
    this.touchSupport = 'ontouchend' in document;
    this.dropObjects = new Array();
    this.dragObject = null;

    this.init();
};

Nabu.DragAndDrop.Container.prototype = {

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
                $(this.object).on('touchmove', function(e) {
                    console.log('DragItem.touchmove');
                    return Self.dragMove(e);
                });
                $(document.body).on('touchend', function(e) {
                    console.log('DragItem.touchend');
                    return Self.dragEnd(e);
                });
            } else {
                $(this.object).on('mousemove', function(e) {
                    return Self.dragMove(e);
                });
                $(document.body).on('mouseup', function(e) {
                    return Self.dragEnd(e);
                });
            }
        }

    },

    addDropContainer: function(dropContainer)
    {
        this.dropObjects.push(dropContainer);
    },

    translateCoordinates: function(x, y)
    {
        var bounds = this.inner.getBoundingClientRect();

        return { "x": x - bounds.left, "y": y - bounds.top };
    },

    setDragObject: function(object)
    {
        this.dragObject = object;
    },

    dragMove: function(e)
    {
        if (this.dragObject !== null) {
            this.dragObject.dragMove(e);
            var dropObject = this.getBestQualifiedDropObject(e);
            console.log(dropObject);
        }

        return true;
    },

    dragEnd: function(e)
    {
        if (this.dragObject !== null) {
            var retval = this.dragObject.dragEnd(e);
            this.dragObject = null;
            return retval;
        }

        return true;
    },

    getBestQualifiedDropObject: function(e)
    {
        var x = e.clientX;
        var y = e.clientY;
        var current = null;

        for (i in this.dropObjects) {
            var dropObject = this.dropObjects[i];
            var bounds = dropObject.object.getBoundingClientRect();
            if (bounds.left <= x && bounds.right >= x && bounds.top <= y && bounds.bottom >= y) {
                if (current === null || $.contains(current.object, dropObject.object)) {
                    current = dropObject;
                }
            }
        }

        return current;
    }
};

Nabu.DragAndDrop.DragItem = function(container, object, params)
{
    this.events = new Nabu.EventPool();
    this.container = container;
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
                    return Self.dragStart(e);
                });
            } else {
                $(this.object).on('mousedown', function(e) {
                    return Self.dragStart(e);
                });
            }
        }
    },

    dragStart: function(e)
    {
        this.draginit = true;
        var bounds = this.object.getBoundingClientRect();
        var transcoord = this.container.translateCoordinates(bounds.left, bounds.top);
        this.dragCoordinates.ox = transcoord.x;
        this.dragCoordinates.oy = transcoord.y;
        this.dragCoordinates.dx = e.clientX - bounds.left;
        this.dragCoordinates.dy = e.clientY - bounds.top;
        this.dragCoordinates.width = bounds.width;
        this.dragCoordinates.height = bounds.height;

        this.dragging = true;

        this.container.setDragObject(this);
    },

    dragMove: function(e)
    {
        if (this.dragging) {
            if (this.draginit) {
                $(this.object).addClass('dragging');
                this.dragAnchor = document.createElement('SPAN');
                this.dragAnchor.style.display='hidden';
                this.object.parentNode.replaceChild(this.dragAnchor, this.object);
                this.container.inner.appendChild(this.object);
                this.object.style.width = this.dragCoordinates.width + 'px';
                this.object.style.height = this.dragCoordinates.height + 'px';
                this.draginit = false;
            }
            var transcoord = this.container.translateCoordinates(e.clientX, e.clientY);
            this.object.style.left = (transcoord.x - this.dragCoordinates.dx) + 'px';
            this.object.style.top = (transcoord.y - this.dragCoordinates.dy) + 'px';
        }

        return true;
    },

    dragEnd: function(e)
    {
        if (this.dragging) {
            if (this.dragAnchor !== null) {
                var parent = this.dragAnchor.parentNode;
                this.container.inner.removeChild(this.object);
                parent.replaceChild(this.object, this.dragAnchor);
                this.dragAnchor = null;
            }
            $(this.object).removeClass('dragging');
            $(this.object).removeAttr('style');
            this.dragging = false;
            e.preventDefault();
            e.stopPropagation();
        }
    },
};

Nabu.DragAndDrop.DropContainer = function(container, object, params)
{
    this.events = new Nabu.EventPool();
    this.container = container;
    this.container.addDropContainer(this);
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

            }
        }
    },

    dragOver: function(e) {

    }
};

nabu.registerLibrary('DragAndDrop', ['Event']);

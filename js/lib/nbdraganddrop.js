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
    this.inner = $(object).find('.drag-caret').get(0);
    this.object.dadContainer = this;
    this.touchSupport = 'ontouchend' in document;
    this.dropObjects = new Array();
    this.dragObject = null;
    this.dropContainer = null;

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

    setDragObject: function(object, x, y)
    {
        this.dragObject = object;
        var dropObject = $(this.dragObject.object).parent('.drop-container');
        if (dropObject.length > 0) {
            var element = dropObject.get(0);
            if (element.dropContainer) {
                this.dropContainer = element.dropContainer;
            } else {
                this.cancelDropContainer();
            }
        }
    },

    dragMove: function(e)
    {
        if (this.dragObject !== null) {
            this.dragObject.dragMove(e);
            var dropObject = this.getBestQualifiedDropObject(e.clientX, e.clientY);
            if (dropObject instanceof Nabu.DragAndDrop.DropContainer) {
                if (this.dropContainer instanceof Nabu.DragAndDrop.DropContainer && this.dropContainer !== dropObject) {
                    console.log('remove Drop Container');
                    this.dropContainer.dragOut(e);
                    this.dropContainer = dropObject;
                }
                this.dropContainer.dragOver(e);
            }
        }

        return true;
    },

    dragEnd: function(e)
    {
        if (this.dragObject !== null) {
            var retval = this.dragObject.dragEnd(e);
            if (this.dropContainer !== null) {
                this.dropContainer.drop(this.dragObject, e.clientX, e.clientY);
            }
            this.dragObject = null;
            return retval;
        }

        return true;
    },

    getBestQualifiedDropObject: function(x, y)
    {
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
    },

    cancelDropContainer: function()
    {
        if (this.dropContainer instanceof Nabu.DragAndDrop.DropContainer) {
            this.dropContainer.dragOut();
        }
    }
};

Nabu.DragAndDrop.DragItem = function(container, object, params)
{
    this.events = new Nabu.EventPool();
    this.container = container;
    this.object = object;
    this.object.dragItem = this;
    this.item = null;
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
            var find = $(this.object).find('.drag-item');
            if (find.length > 0) {
                this.item = find.get(0);
            } else {
                this.item = this.object;
            }
            if (this.touchSupport) {
                $(this.item).on('touchstart', function(e) {
                    console.log('DragItem.touchstart');
                    return Self.dragStart(e);
                });
            } else {
                $(this.item).on('mousedown', function(e) {
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

        this.container.setDragObject(this, e.clientX, e.clientY);

        e.preventDefault();
        e.stopPropagation();

        return false;
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
                if (this.container.dropContainer instanceof Nabu.DragAndDrop.DropContainer) {
                    this.container.dropContainer.moveInterstitial(e.clientX, e.clientY);
                }
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
    this.object.dropContainer = this;
    this.touchSupport = 'ontouchend' in document;
    this.interstitial = null;

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

    dragOver: function(e)
    {
        this.moveInterstitial(e.clientX, e.clientY);
    },

    dragOut: function(e)
    {
        if (this.interstitial !== null) {
            this.object.removeChild(this.interstitial);
            this.interstitial = null;
        }
    },

    drop: function(dragObject, x, y)
    {
        if (this.interstitial !== null) {
            var before = $(dragObject)
            if (dragObject instanceof Nabu.DragAndDrop.DragItem && dragObject.object !== null) {
                var before = $(this.interstitial).next('[draggable="true"]');
                var after = $(this.interstitial).prev('[draggable="true"]');
                var parent = $(this.interstitial).closest('.drag-item');
                var eventParams = {
                    "drag": dragObject.object,
                    "drop": this.object,
                    "parent": parent.length > 0 ? parent[0] : null,
                    "before": before.length > 0 ? before[0] : null,
                    "after": after.length > 0 ? after[0] : null
                };
                if (this.container.events.fireEvent('onBeforeDrop', this.container, eventParams)) {
                    this.object.replaceChild(dragObject.object, this.interstitial);
                    this.interstitial = null;
                    this.container.events.fireEvent('onDrop', this.container, eventParams);
                }
            }
            if (this.interstitial !== null) {
                this.object.removeChild(this.interstitial);
                this.interstitial = null;
                this.container.events.fireEvent('onError', this.container);
            }
        } else {
            this.container.events.fireEvent('onError', this.container);
        }
    },

    moveInterstitial: function(x, y)
    {
        if (this.interstitial === null) {
            this.interstitial = document.createElement('DIV');
            this.interstitial.className = 'interstitial';
            var drag = this.container.dragObject;
            var bounds = drag.object.getBoundingClientRect();
            this.interstitial.style.width = "100%";
            this.interstitial.style.height = bounds.height + "px";
            $(this.object).prepend(this.interstitial);
        }
        var items = this.object.children;
        var best_before = {
            object: null,
            bounds: null
        };
        var best_after = {
            object: null,
            bounds: null
        };
        var best_match = {
            object: null,
            bounds: null
        };
        for (var i = 0; i < items.length; i++) {
            var child = items.item(i);
            var bounds = child.getBoundingClientRect();
            if (bounds.left <= x && bounds.right >= x && bounds.top <= y && bounds.bottom >= y) {
                best_match.object = child;
                best_match.bounds = bounds;
                break;
            }
            if (bounds.top > y) {
                if (best_after.object === null || best_after.bounds.top > bounds.top) {
                    best_after.object = child;
                    best_after.bounds = bounds;
                }
            }
            if (bounds.bottom < y) {
                if (best_before.object === null || best_before.bounds.bottom < bounds.bottom) {
                    best_before.object = child;
                    best_before.bounds = bounds;
                }
            }
        }

        if (best_match.object !== null) {
            if (best_match.object !== this.interstitial) {
                this.object.insertBefore(this.interstitial, best_match.object.nextSibling);
            }
        } else if (best_before.object !== null) {
            this.object.insertBefore(this.interstitial, best_before.object.nextSibling);
        } else if (best_after.object !== null) {
            this.object.insertBefore(this.interstitial, best_after.object);
        }
    }
};

nabu.registerLibrary('DragAndDrop', ['Event']);

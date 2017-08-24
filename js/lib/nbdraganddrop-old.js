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
    this.touchSupport = 'ontouchend' in document;
    this.touchHandled = false;
    this.touchCaret = null;
    this.touchCaretDelta = {x: 0, y: 0};
    this.touchMoved = false;
    this.mouseupOldEvent = false;
    this.object = object;

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

    /*
    isDraggableObject: function(object)
    {
        return (object !== null && object.hasAttributes && object.hasAttributes() &&
                object.attributes['draggable'] && object.attributes['draggable'].value === 'true'
        );
    },
    */

    init: function()
    {
        var Self = this;
        if (this.object !== false && Nabu.DragAndDrop.isDraggableObject(this.object)) {
            this.object.dragControl = this;
            if (this.touchSupport) {
                this.object.ontouchstart = this.onTouchStart;
                this.object.ontouchmove = this.onTouchMove;
                this.object.ontouchend = this.onTouchEnd;
            } else {
                this.object.onselectstart = this.onSelectStart;
                this.object.ondragstart = this.onDragStart;
                this.object.ondrag = this.onDrag;
                this.object.onmousemove = this.onMouseMove;
                this.object.ondragend = this.onDragEnd;
                $(this.object).on('mouseup', function(e) {
                    return Self.onMouseUp(e);
                });
            }
        }
    },

    onMouseUp: function(e)
    {
        console.log('DragItem.onMouseUp');
        if (this.touchCaret !== null) {
            console.log("mouseup prevented");
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        return true;
    },

    onSelectStart: function(e)
    {
        console.log('DragItem.onSelectStart');
        if (!e) var e = window.event;

        if (e.currentTarget.dragDrop) {
            e.currentTarget.dragDrop();
            return false;
        }
    },

    onDragStart: function(e)
    {
        console.log("DragItem.onDragStart");
        if (!e) var e = window.event;

        var control = Nabu.DragAndDrop.getControlObject(this);

        if (control !== null) {
            control.dragStart(e, e.target, e.clientX, e.clientY, e.pageX, e.pageY);
        }
    },

    dragStart: function(e, target, mouseX, mouseY, pageX, pageY)
    {
        console.log('DragItem.dragStart');
        console.log(this.events.fireEvent('beforeDragStart', { draggable: target }));
        if (!this.events.isEventTargeted('beforeDragStart') || this.events.fireEvent('beforeDragStart', { draggable: target }) === true) {
            Nabu.DragAndDrop.draggingObject = target;
            //if (this.touchSupport) {
                this.touchCaret = target.cloneNode(true);
                document.body.appendChild(this.touchCaret);
                $(this.touchCaret).addClass('dragcaret');
                document.body.dragControl = this;
                var elemRect = target.getBoundingClientRect();
                this.touchCaretDelta.x = elemRect.left - mouseX;
                this.touchCaretDelta.y = elemRect.top - mouseY;
                this.touchCaret.style.top = pageY + this.touchCaretDelta.y + 'px';
                this.touchCaret.style.left = pageX + this.touchCaretDelta.x + 'px';
            //}
            try {
                e.dataTransfer.setData('Text', $(e.target).data('id'));
            } catch (e) { console.log(e); }
            $(target).addClass('dragging');
            //this.draggingObject = index;
            this.events.fireEvent('onDragStart', {
                draggable: target
            });
        }

        return true;
    },

    onDrag: function(e)
    {
        console.log('DragItem.onDrag');
    },

    onDragEnd: function(e)
    {
        console.log('DragItem.onDragEnd');
        if (!e) var e = window.event;

        var control = Nabu.DragAndDrop.getControlObject(this);

        if (control !== null) {
            control.dragEnd(e);
        }
    },

    dragEnd: function(e)
    {
        console.log("DragItem.dragEnd");
        //this.removeInterstitial(null);

        $(this.object).removeClass('dragging');
        this.events.fireEvent('onDragEnd', {
            draggable: this.object
        });

        Nabu.DragAndDrop.draggingObject = null;

        if (e.currentTarget !== e.originalTarget) {
            this.draggingObject = null;
        }

        if (this.touchCaret !== null) {
            this.touchCaret.remove();
            this.touchCaret = null;
        }

        document.body.dragControl = null;
    },

};

Nabu.DragAndDrop.DropContainer = function(object, params)
{
    console.log("new DropContainer object");
    this.events = new Nabu.EventPool();
    this.object = object;
    this.interstitialObject = null;
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
        if (this.object !== false) {
            this.object.dragControl = this;
            this.interstitialObject = document.createElement('div');
            if (this.interstitialClass !== null) this.interstitialObject.className = this.interstitialClass;
            if (this.touchSupport) {

            } else {
                //this.interstitialObject.ondragover = this.onDragOver;
                //this.interstitialObject.ondragend = this.onDragEnd;
                //this.interstitialObject.ondrop = this.onDrop;
            }

            this.object.ondragover = this.onDragOver;
            this.object.ondragleave = this.onDragLeave;
            this.object.ondrop = this.onDrop;

            document.body.addEventListener('dragover', this.onMouseMove);
        }
    },

    onMouseMove: function(e)
    {
        console.log("DropContainer.onMouseMove");
        if (!e) var e = window.event;

        var control = Nabu.DragAndDrop.getControlObject(this);

        if (control !== null && control.touchCaret) {
            control.touchCaret.style.left = (e.clientX + control.touchCaretDelta.x) + 'px';
            control.touchCaret.style.top = (e.clientY + control.touchCaretDelta.y) + 'px';
        }
    },

    onDragOver: function(e)
    {
        console.log("DropContainer.onDragOver");
        if (!e) var e = window.event;
        var control = Nabu.DragAndDrop.getControlObject(this);

        if (control !== null) {
            control.dragOver(e, e.clientX, e.clientY);
        }
    },

    dragOver: function(e, mouseX, mouseY)
    {
        console.log("DropContainer.dragOver");
        if (this.object !== null && Nabu.DragAndDrop.isDraggableObject(e.target)) {
            var draggable = e.target;
            if (Nabu.DragAndDrop.areCompatibles(draggable, this.object)) {
                e.preventDefault();
                $(this.object).addClass('drag-enter');
                //this.insertInterstitial(this.object, draggable, mouseX, mouseY);
                this.events.fireEvent('onDragOver', {
                    draggable: e.target
                });
                return true;
            }
        }

        return false;
    },

    onDragLeave: function(e)
    {
        console.log("DropContainer.onDragLeave");
        if (!e) var e = window.event;

        var control = Nabu.DragAndDrop.getControlObject(this);
        if (control !== null && control.object !== null && Nabu.DragAndDrop.isDraggableObject(e.target)) {
            var draggable = e.target;
            //control.removeInterstitial(null);
            if (Nabu.DragAndDrop.areCompatibles(draggable, control.object)) {
                e.preventDefault();
                $(control.object).removeClass('drag-enter');
                //if (!nabu.isAncestorOf(droppable, e.target)) control.removeInterstitial(droppable);
                control.events.fireEvent('onDragLeave', {
                    draggable: draggable,
                    droppable: this.object
                });
            }
        }
    },

    onDrop: function(e)
    {
        console.log("DropContainer.onDrop");
        if (!e) var e = window.event;

        var control = Nabu.DragAndDrop.getControlObject(this);

        if (control !== null && Nabu.DragAndDrop.draggingObject !== null) {
            e.preventDefault();
            control.drop(e, Nabu.DragAndDrop.draggingObject);
        }
    },

    drop: function(e, draggable)
    {
        console.log("DropContainer.drop");
        if (this.object !== null && Nabu.DragAndDrop.isDraggableObject(draggable)) {
            e.preventDefault();
            var dragGroup = this.matchingGroup(draggable, this.object);
            if (dragGroup !== false) {
                $(this.object).removeClass('drag-enter');
                $(draggable).removeClass('dragging');
                var action = (draggable.attributes['drag-action'] ? draggable.attributes['drag-action'].value : null);
                var mode = (draggable.attributes['drag-mode'] ? draggable.attributes['drag-mode'].value : 'move');
                var dragId = (draggable.attributes['data-id'] ? draggable.attributes['data-id'].value : null);
                var dropId = (this.object.attributes['data-drop-id'] ? this.object.attributes['data-drop-id'].value : null);
                var dragNext = this.getNextSiblingDraggable(this.interstitialObject);
                var dragNextId = (dragNext !== null && dragNext.attributes['data-id'] ? dragNext.attributes['data-id'].value : null);
                var dragPrior = this.getPreviousSiblingDraggable(this.interstitialObject);
                var dragPriorId = (dragPrior !== null && dragPrior.attributes['data-id'] ? dragPrior.attributes['data-id'].value : null);
                var dragFrom = this.object;
                var dragFromId = (dragFrom !== null && dragFrom.attributes['data-drop-id'] ? dragFrom.attributes['data-drop-id'].value : null);
                var result = this.events.fireEvent('onDrop', this, {
                    draggable: draggable,
                    droppable: this.object,
                    draggableFrom: dragFrom,
                    draggableFromId: dragFromId,
                    dragAction: action,
                    dragMode: mode,
                    dragId: dragId,
                    dropId: dropId,
                    dragGroup: dragGroup,
                    dragPriorId: dragPriorId,
                    dragNextId: dragNextId
                });

                if (mode === 'move') {
                    if (result === true) {
                        this.insertDroppedElement(this.object, draggable);
                    } else if (result !== false) {
                        if (typeof result === 'object') {
                            this.insertDroppedElement(this.object, result);
                            //this.appendDraggableObject(result, false);
                        } else {
                            this.insertDroppedElement(this.object, draggable);
                        }
                    }
                }

                return true;
            }

        }

        return false;
    },

    insertDroppedElement: function(droppable, draggable)
    {
        console.log("DropContainer.insertDroppedElement");
        if (droppable.sortable === true && draggable.attributes['drag-order']) {
            var dro = draggable.attributes['drag-order'].value * 1;
            for (var obj = droppable.firstChild; obj !== null; obj = this.getNextSiblingDraggable(obj)) {
                if (obj instanceof HTMLElement && obj.attributes['drag-order']) {
                    var obo = obj.attributes['drag-order'].value * 1;
                    if (dro < obo) {
                        droppable.insertBefore(draggable, obj);
                        return true;
                    }
                }
            }
        }

        if (this.interstitialObject.parentElement === droppable) {
            droppable.replaceChild(draggable, this.interstitialObject);
        } else {
            droppable.appendChild(draggable);
        }
    },

    appendDraggableObject: function(element, cascade)
    {
        console.log("DropContainer.appendDraggableObject");
        var obj = nabu.get(element);

        if (obj !== false) {
            if (Nabu.DragAndDrop.isDraggableObject(obj)) {
                if (this.draggableObjects.indexOf(obj) < 0) {
                    obj.dragControl = this;
                    if (this.touchSupport) {
                        obj.ontouchstart = this.onTouchStart;
                        obj.ontouchmove = this.onTouchMove;
                        obj.ontouchend = this.onTouchEnd;
                    } else {
                        obj.onselectstart = this.onSelectStart;
                        obj.ondragstart = this.onDragStart;
                        obj.ondragover = this.onDragOver;
                        obj.ondragend = this.onDragEnd;
                        obj.ondrop = this.onDrop;
                    }
                    this.draggableObjects.push(obj);
                }
            } else {
                if (cascade !== undefined && cascade === true) {
                    for (obj = obj.firstElementChild; obj !== null; obj = obj.nextSibling) {
                        if (obj instanceof HTMLElement) this.appendDraggableObject(obj, true);
                    }
                }
            }
        }
    },

    getPreviousSiblingDraggable: function(object)
    {
        console.log("DropContainer.getPreviousSiblingDraggable");
        if (object === null) return null;

        for (var obj = object.previousSibling; obj !== null; obj = obj.previousSibling) {
            if (Nabu.DragAndDrop.isDraggableObject(obj)) return obj;
        }

        return null;
    },

    getNextSiblingDraggable: function(object)
    {
        console.log("DropContainer.getNextSiblingDraggable");
        if (object === null) return null;

        for (var obj = object.nextSibling; obj !== null; obj = obj.nextSibling) {
            if (Nabu.DragAndDrop.isDraggableObject(obj)) return obj;
        }

        return null;
    },

    matchingGroup: function(draggable, droppable)
    {
        console.log("DropContainer.matchingGroup");
        var dropgroup = droppable.attributes['drag-group'] ? droppable.attributes['drag-group'].value.split(" ") : null;
        var draggroup = draggable.attributes['drag-group'] ? draggable.attributes['drag-group'].value.split(" ") : null;

        if (dropgroup === null && draggroup === null) return true;
        if (dropgroup === null || draggroup === null) return false;

        for (var i = 0; i < dropgroup.length; i++) {
            for (var j = 0; j < draggroup.length; j++) {
                if (dropgroup[i] === draggroup[j]) return dropgroup[i];
            }
        }

        return false;
    }

};

Nabu.DragAndDrop.draggingObject = null;

Nabu.DragAndDrop.getControlObject = function(source)
{
    if (source instanceof Nabu.DragAndDrop.DragItem || source instanceof Nabu.DragAndDrop.DropContainer) {
        return source;
    }
    if (source.dragControl) {
        return source.dragControl;
    }
    if (source.parentElement !== null) {
        return Nabu.DragAndDrop.getControlObject(source.parentElement);
    }

    return null;
};

Nabu.DragAndDrop.areCompatibles = function(draggable, droppable)
{
    var dropgroup = droppable.attributes['drag-group'] ? droppable.attributes['drag-group'].value.split(",") : null;
    var draggroup = draggable.attributes['drag-group'] ? draggable.attributes['drag-group'].value.split(",") : null;

    if (dropgroup === null && draggroup === null) return true;
    if (dropgroup === null || draggroup === null) return false;

    for (var i = 0; i < dropgroup.length; i++) {
        for (var j = 0; j < draggroup.length; j++) {
            if (dropgroup[i] === draggroup[j]) return true;
        }
    }

    return false;
};

Nabu.DragAndDrop.isDraggableObject = function(object)
{
    return (object !== null &&
            object.hasAttributes &&
            object.hasAttributes() &&
            object.attributes['draggable'] &&
            object.attributes['draggable'].value === 'true'
    );
};

nabu.registerLibrary('DragAndDrop', ['Event']);

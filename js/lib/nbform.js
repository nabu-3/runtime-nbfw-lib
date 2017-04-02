try {
    if (!Nabu) throw "Nabu Manager not loaded";
} catch (e) {
    throw "Nabu Manager not loaded";
}

if (typeof Nabu.UI === 'undefined') {
    Nabu.UI = function() {};
}

Nabu.UI.Form = function(object, params)
{
    this.events = new Nabu.EventPool();
    this.container = object;
    this.params = params;
    this.form = null;
    this.fields = new Array();
    this.formaction = null;
    this.maskActions = {id: null, name: null};
    this.submit_object = null;
    this.validate = true;

    this.init();
};

Nabu.UI.Form.prototype = {

    addEventListener: function(event)
    {
        this.events.addEventListener(event);
    },

    removeEventListener: function(event)
    {
        this.events.removeEventListener(event);
    },

    init: function(recall)
    {
        var Self = this;
        var frm = null;

        if (this.container.tagName === 'FORM') {
            frm = this.container;
        } else if ($(this.container).find('form').length > 0) {
            frm = $(this.container).find('form').get(0);
        } else if ($(this.container).closest('form').length > 0) {
            frm = $(this.container).closest('form').get(0);
        }

        if (typeof recall === 'undefined') {
            recall = false;
        }

        if (frm) {
            this.form = frm;
            frm.nabuForm = this;
            if (!recall) {
                $(frm).on('submit', function(e) {
                    return Self.onSubmit(e.originalEvent);
                });
            }

            this.locateFields(recall);

            if (!recall) {
                setTimeout(function() { Self.init(true) }, 1000);
            }
        }
    },

    locateFields: function(recall)
    {
        for (var field in this.form.elements) {
            var append_field = null;
            if (field !== 'attributes' && field !== 'elements' && field !== 'childNodes' && field !== 'children' && field !== 'properties' && field !== 'all') {
                var obj = this.form[field];
                if (obj !== null && obj !== "" && obj !== true && typeof obj === "object" && (obj instanceof Element || obj instanceof NodeList || obj instanceof HTMLCollection)) {
                    if (obj instanceof HTMLInputElement || obj instanceof HTMLSelectElement || obj instanceof HTMLTextAreaElement) {
                        append_field = obj;
                    } else if (obj instanceof HTMLButtonElement) {
                        append_field = obj;
                    } else if (obj instanceof NodeList) {
                        append_field = obj;
                    } else if (obj instanceof HTMLCollection) {
                        append_field = obj;
                    }
                    if (append_field !== null) {
                        var key = (obj['name'] && obj['name'].length > 0 ? obj['name'] : field);
                        if (recall !== true) {
                            obj.nabuForm = false;
                        }
                        this.appendField(key, obj);
                    }
                }
            }
        }
    },

    appendField: function(field, obj)
    {
        var i, conn = false;

        if (obj instanceof NodeList) {
            for (i = 0; i < obj.length; i++)
                if (!obj.nabuForm) {
                    this.connectFieldObject(obj[i]);
                    conn = true;
                }
        } else if (obj instanceof HTMLCollection) {
            for (i = 0; i < obj.length; i++)
                if (!obj.nabuForm) {
                    this.connectFieldObject(obj.item(i));
                    conn = true;
                }
        } else {
            if (!obj.nabuForm) {
                this.connectFieldObject(obj);
                conn = true;
            }
        }

        if (conn === true) {
            if (this.fields[field]) {
                if (this.fields[field].object instanceof Array) {
                    if (this.fields[field].object.indexOf(obj) < 0) {
                        this.fields[field].object.push(obj);
                    }
                } else {
                    if (this.fields[field].object !== obj) {
                        this.fields[field].object = [ this.fields[field].object];
                        if (this.fields[field].object.indexOf(obj) < 0) {
                            this.fields[field].object.push(obj);
                        }
                    }
                }
            } else {
                this.fields[field] = {object: obj, trigger: 3, actions: null, touched: false, visible: true, enabled: true};
            }
            if (!(obj instanceof HTMLButtonElement) && !(obj instanceof HTMLInputElement && (obj.type==='button' || obj.type==='submit' || obj.type==='image' || obj.type==='hidden'))) {
                var trigger = this.validateField(field);
                this.setFieldStatusClass(field, trigger);
            }
            this.resetActionsFlag();
            this.applyActionsForField(field);
            this.validateSameFields(field);
            this.validateForm();
        }
    },

    connectFieldObject: function(obj)
    {
        var Self = this;
        obj.nabuForm = this;

        if (obj instanceof HTMLSelectElement) {
            $(obj).on('change', function(e) { return Self.onChangeField(e.originalEvent)});
        } else if (obj instanceof HTMLInputElement) {
            var type = obj.type.toLowerCase();
            switch (type) {
                case "text":
                case "number":
                case "date":
                case "time":
                case "datetime":
                case "email":
                case "password":
                case "file":
                    $(obj).on('change', function(e) { return Self.onChangeField(e.originalEvent); })
                          .on('blur', function(e) { return Self.onBlurField(e.originalEvent); })
                          .on('focus', function(e) { return Self.onFocusField(e.originalEvent); })
                    ;
                    this.applyPlaceholder(obj, false);
                    break;
                case "button":
                case "submit":
                case "image":
                case "checkbox":
                    $(obj).on('click', function(e) { return Self.onClickField(e.originalEvent); });
                    break;
                case "radio":
                    $(obj).on('click', function(e) { return Self.onClickField(e.originalEvent); });
                    if (obj.checked) {
                        $(obj.parentElement).addClass(this.active_class);
                    }
                    break;
                case "hidden":
                    $(obj).on('change', function(e) { return Self.onChangeField(e.originalEvent); });
                    break;
                default:
                    $(obj).on('blur', function(e) { return Self.onBlurField(e.originalEvent); });
            }
            if (this.params.validation === 'live') {
                $(obj).on('keyup', function(e) { return Self.onKeyUp(e.originalEvent); });
            }
        } else if (obj instanceof HTMLTextAreaElement) {
            $(obj).on('change', function(e) { return Self.onChangeField(e.originalEvent); })
                  .on('blur', function(e) { return Self.onBlurField(e.originalEvent); })
                  .on('focus', function(e) { return Self.onFocusField(e.originalEvent); })
            ;
            if (this.params.validation === 'live') {
                $(obj).on('keyup', function(e) { return Self.onKeyUp(e.originalEvent); });
            }
        } else if (obj instanceof HTMLButtonElement) {
            $(obj).on('click', function(e) { return Self.onClickField(e.originalEvent); });
        } else {
            $(obj).on('blur', function(e) { return Self.onBlurField(e.originalEvent); });
        }
    },

    isAvailableField: function(name)
    {
        var visible = (this.params.evaluate === 'visible' ? false : true);

        if (this.fields[name]) {
            if (this.fields[name].object instanceof NodeList || this.fields[name].object instanceof Array) {
                for (var obj in this.fields[name].object) {
                    visible = visible || nabu.isObjectVisible(this.fields[name].object[obj].parentElement);
                }
            } else if (this.fields[name].object instanceof HTMLCollection) {
                for (var i = 0; i < this.fields[name].object.length; i++) {
                    visible = visible || nabu.isObjectVisible(this.fields[name].object.item(i).parentElement);
                }
            } else {
                visible = visible || nabu.isObjectVisible(this.fields[name].object.parentElement);
            }
        }

        return visible;
    },

    getFieldValue: function(name)
    {
        var value = null;

        if (this.fields[name]) {
            var field = this.fields[name];
            if (field.object instanceof NodeList || field.object instanceof Array) {
                value = new Array();
                for (var i = 0; i < field.object.length; i++) {
                    if (field.object[i].checked || field.object[i].selected) {
                        value.push(field.object[i].value);
                    }
                }
                if (value.length === 0) {
                    value = null;
                } else if (value.length === 1) {
                    value = value.shift();
                }
            } else if (field.object instanceof HTMLCollection) {
                value = new Array();
                for (var i = 0; i < field.object.length; i++) {
                    if (field.object.item(i).checked || field.object.item(i).selected) {
                        value.push(field.object.item(i).value);
                    }
                }
                if (value.length === 0) {
                    value = null;
                } else if (value.length === 1) {
                    value = value.shift();
                }
            } else if (field.object instanceof HTMLSelectElement) {
                if (field.object.selectedIndex > -1) {
                    value = field.object[field.object.selectedIndex].value;
                }
            } else if (field.object instanceof HTMLInputElement || field.object instanceof HTMLTextAreaElement) {
                if (field.object.attributes['type'] && field.object.attributes['type'].value==='radio' && field.object.attributes['name'] && this.form!==null) {
                    value = this.getRadioValue(this.form[field.object.attributes['name'].value], null);
                } else {
                    value = field.object.value;
                }
                if (nabu.getNavigatorName() === 'MSIE' && field.object.attributes['placeholder'] && field.object.attributes['placeholder'] === value) {
                    value = '';
                }
            }
        }

        return value;
    },

    getRadioValue: function(radioList, defValue)
    {
        for (i = 0; i < radioList.length; i++) {
            if (radioList[i].checked) return radioList[i].value;
        }

        return defValue;
    },

    evaluateField: function(name)
    {
        if (this.fields[name]) {
            var trigger = this.validateField(name);
            this.setFieldStatusClass(name, trigger);
            this.resetActionsFlag();
            this.applyActionsForField(name);
            this.validateSameFields(name);
            this.validateForm();
            if (trigger===0) return false;
        }
        return true;
    },

    fieldFollowsForm: function(obj, type, status)
    {
        if (obj === null) return true;

        switch (type) {
            case 'active': this.applyMask(obj, {enabled: status, visible: null}); break;
            case 'visible': this.applyMask(obj, {enabled: null, visible: status}); break;
            default: throw "Unknown formfollow type [" + type + "]";
        }

        return true;
    },

    validateField: function(name)
    {
        var trigger = 3;

        if (this.fields[name]) {
            if (this.fields[name].object instanceof NodeList || this.fields[name].object instanceof Array) {
                trigger = 0;
                for (var i = 0; i < this.fields[name].object.length; i++) {
                    var field = this.fields[name].object[i];
                    var aux = this.validateFieldPart(field);
                    if (aux > trigger) trigger = aux;
                }
            } else if (this.fields[name].object instanceof HTMLCollection) {
                trigger = 0;
                for (var i = 0; i < this.fields[name].object.length; i++) {
                    var field = this.fields[name].object.item(i);
                    var aux = this.validateFieldPart(field);
                    if (aux > trigger) trigger = aux;
                }
            } else {
                var field = this.fields[name].object;
                trigger = this.validateFieldPart(field);
            }

            this.fields[name].trigger = trigger;
        }

        return trigger;
    },

    validateFieldPart: function(field)
    {
        var trigger = 3;
        var mandatory = (field.attributes && field.attributes['data-mandatory'] ? field.attributes['data-mandatory'].value : 'none');
        var rule = (field.attributes && field.attributes['data-rule'] ? field.attributes['data-rule'].value : 'none');
        var rule_param = (field.attributes && field.attributes['data-rule-param'] ? field.attributes['data-rule-param'].value : null);
        var value = field.value;
        if (nabu.getNavigatorName() === 'MSIE' && field.attributes['placeholder'] && field.attributes['placeholder'].value === value) value = '';

        if (rule !== 'none') {
            if (mandatory === 'yes')
                trigger = 0;
            else
                trigger = (value.length === 0 ? 1 : 0);
            var parts = rule.split(":");
            var type = parts === null ? rule : parts[0];
            switch (type) {
                case 'filled':
                    if (value.length > 0 && (!field.attributes['data-unselected-value'] || field.attributes['data-unselected-value'].value !== value)) trigger = 2;
                    break;
                case 'regex':
                    if (value.length > 0) {
                        parts = RegExp("(" + rule_param + ")").exec(value);
                        if (parts !== null && parts.length >= 2 && parts[1].length === value.length) trigger = 2;
                    }
                    break;
                case 'uri':
                    if (parts.length === 2) {
                        switch (parts[1]) {
                            case 'web':if (nabu.isValidURL(value)) trigger = 2; break;
                            case 'email':if (nabu.isValidEmail(value)) trigger = 2; break;
                            case 'ipv4':if (nabu.isValidIPv4(value)) trigger = 2; break;
                            case 'phone':if (nabu.isValidPhoneNumber(value)) trigger = 2; break;
                        }
                    }
                    break;
                case 'same':
                    if (parts.length === 2) {
                        var reflex = this.getFieldValue(parts[1]);
                        if ((reflex===null || reflex===false || reflex==='') && (value===null || value===false || value==='')) {
                            trigger = (mandatory ? 0 : 1);
                        } else if (reflex === value) {
                            trigger = 2;
                        }
                    }
                    break;
                case 'checked':
                    if (!(field instanceof NodeList) && !(field instanceof HTMLCollection) && !(field instanceof Array) && field.checked && field.checked === true) trigger = 2;
                    break;
                case 'unchecked':
                    if (!(field instanceof NodeList) && !(field instanceof HTMLCollection) && !(field instanceof Array) && field.checked  && field.checked!== true) trigger = 2;
                    break;
            }
        }

        return trigger;
    },

    validateSameFields: function(name)
    {
        var field, i;

        for (var key in this.fields) {
            if (key !== name) {
                field = this.fields[key];
                var rule = (field.object.attributes && field.object.attributes['data-rule'] ? field.object.attributes['data-rule'].value : 'none');
                if (rule !== null && rule !== 'none') {
                    var parts = rule.split(":");
                    if (parts!==null && parts.length === 2 && parts[0] === 'same' && parts[1] === name) {
                        this.evaluateField(key);
                    }
                }
            }
        }
    },

    validateForm: function()
    {
        if (this.fields !== null) {

            this.validate = true;

            for (var key in this.fields) {
                field = this.fields[key];
                if (field.trigger === 0) {
                    if (field.object instanceof NodeList || field.object instanceof Array) {
                        for (i = 0; i < field.object.length; i++) {
                            if (this.isAvailableField(key) && !field.object[i].disabled) {
                                this.validate = false;
                            }
                        }
                    } else if (field.object instanceof HTMLCollection) {
                        for (i = 0; i < field.object.length; i++) {
                            if (this.isAvailableField(key) && !field.object.item(i).disabled) {
                                this.validate = false;
                            }
                        }
                    } else {
                        if (this.isAvailableField(key) && !field.object.disabled) {
                            this.validate = false;
                        }
                    }
                }
            }

            for (var key in this.fields) {
                field = this.fields[key];
                if (field.object instanceof NodeList || field.object instanceof Array) {
                    for (i = 0; i < field.object.length; i++) {
                        if (field.object[i].attributes && field.object[i].attributes !== null && field.object[i].attributes['formfollow'] && this.isAvailableField(key)) {
                            this.fieldFollowsForm(field.object[i], field.object[i].attributes['formfollow'].value, form.validate);
                        }
                    }
                } else if (field.object instanceof HTMLCollection) {
                    for (i = 0; i < field.object.length; i++) {
                        if (field.object.item(i).attributes && field.object.item(i).attributes !== null && field.object.item(i).attributes['formfollow'] && this.isAvailableField(key)) {
                            this.fieldFollowsForm(field.object.item(i), field.object.item(i).attributes['formfollow'].value, form.validate);
                        }
                    }
                } else {
                    if (field.object.attributes !== null && field.object.attributes['formfollow'] && this.isAvailableField(key)) {
                        this.fieldFollowsForm(field.object, field.object.attributes['formfollow'].value, this.validate);
                    }
                }
            }

            return this.validate;
        }

        return false;
    },

    setFieldStatusClass: function(name, trigger)
    {
        if (this.fields[name]) {
            if (this.fields[name].object instanceof NodeList || this.fields[name].object instanceof Array) {
                for (var i = 0; i < this.fields[name].object.length; i++) {
                    var field = this.fields[name].object[i];
                    this.setFieldStatusClassInternal(field, trigger);
                }
            } else if (this.fields[name].object instanceof HTMLCollection) {
                for (var i = 0; i < this.fields[name].object.length; i++) {
                    var field = this.fields[name].object.item(i);
                    this.setFieldStatusClassInternal(field, trigger);
                }
            } else {
                var field = this.fields[name].object;
                this.setFieldStatusClassInternal(field, trigger);
            }
        }
    },

    setFieldStatusClassInternal: function (field, trigger)
    {
        var ref = null;
        if (!(field instanceof NodeList) && !(field instanceof HTMLCollection) && !(field instanceof Array)) {

            if (field.attributes['data-reflection'])
                ref = field.attributes['data-reflection'].value;
            else
                ref = this.params.reflection;

            if (ref !== null) {
                var ptr = $(field).closest('.' + ref);
                if (ptr.length > 0) {
                    field = ptr.get(0);
                }
            }
        }

        var cls = field.className;
        if ((typeof cls !== 'undefined') && cls !== null && cls.length > 0) {
            $(field).removeClass(this.success_class);
            $(field).removeClass(this.warning_class);
            $(field).removeClass(this.error_class);
        }

        switch (trigger) {
            case 0: $(field).addClass(this.error_class); break;
            case 1: $(field).addClass(this.warning_class); break;
            case 2: $(field).addClass(this.success_class); break;
        }
    },

    applyPlaceholder: function(obj, focus)
    {
        if (nabu.getNavigatorName() === 'MSIE') {
            if (obj.attributes['placeholder']) {
                var ph = obj.attributes['placeholder'].value;
                if (focus) {
                    $(obj).removeClass('placeholder');
                    if (obj.value === ph) {
                        obj.value = '';
                        obj.focus();
                    }
                } else {
                    if (obj.value.length === 0 || obj.value === ph) {
                        obj.value = ph;
                        $(obj).addClass('placeholder');
                    } else {
                        $(obj).removeClass('placeholder');
                    }
                }
            }
        }
    },

    addAction: function(source, status, target, action)
    {
        if (this.fields[source]) {
            var action_arr = {status: status, target: target, action: action, loop: 0};
            if (this.fields[source].actions === null) {
                this.fields[source].actions = new Array();
                this.fields[source].actions.push(action_arr);
            } else {
                for (var i = 0; i < this.fields[source].actions.length; i++) {
                    if (this.fields[source].actions[i].status === status &&
                        this.fields[source].actions[i].target === target)
                    {
                        this.fields[source].actions.splice(i, 1);
                        break;
                    }
                }
                this.fields[source].actions.push(action_arr);
            }
            this.resetActionsFlag();
            this.applyActionsForField(source);
            this.validateSameFields(source);
            this.validateForm();
        }
    },

    addActions: function(list)
    {
        if (list !== null & list.length > 0) {
            for (var action in list)
                this.addAction(list[action][0], list[action][1], list[action][2], list[action][3]);
        }
    },

    resetActionsFlag: function()
    {
        this.maskActions.id = new Array();
        this.maskActions.name = new Array();
    },

    maskAction: function(name, object, visible, enabled)
    {
        var mask = null;

        if (this.fields[name]) {
            if (!this.maskActions.name[name]) {
                this.maskActions.name[name] = {visible: null, enabled: null};
            }
            if (visible !== null) {
                this.maskActions.name[name].visible = (this.maskActions.name[name].visible === null
                                                    ? visible
                                                    : this.maskActions.name[name].visible & visible
                );
            }
            if (enabled !== null) {
                this.maskActions.name[name].enabled = (this.maskActions.name[name].enabled === null
                                                    ? enabled
                                                    : this.maskActions.name[name].enabled & enabled
                );
            }
            mask = this.maskActions.name[name];
        } else if (document.getElementById(name)) {
            if (!this.maskActions.id[name]) {
                this.maskActions.id[name] = {visible: null, enabled: null};
            }
            if (visible !== null) {
                this.maskActions.id[name].visible = (this.maskActions.id[name].visible === null
                                                  ? visible
                                                  : this.maskActions.id[name].visible & visible
                );
            }
            if (enabled !== null) {
                this.maskActions.id[name].enabled = (this.maskActions.id[name].enabled === null
                                                  ? enabled
                                                  : this.maskActions.id[name].enabled & enabled
                );
            }
            mask = this.maskActions.id[name];
        }

        if (mask !== null) {
            if (object instanceof NodeList || object instanceof Array) {
                for (var i = 0; i < object.length; i++) {
                    this.applyMask(object[i], mask);
                }
            } else if (object instanceof HTMLCollection) {
                for (var i = 0; i < object.length; i++) {
                    this.applyMask(object.item(i), mask);
                }
            } else if (object !== null) {
                this.applyMask(object, mask);
            }
        }
    },

    applyMask: function(object, mask)
    {
        if (object !== null) {
            if (mask.enabled !== null) {
                object.disabled = !mask.enabled;
                if (!mask.enabled) {
                    object.setAttribute('disabled', '');
                    $(object).addClass('disabled');
                } else {
                    object.removeAttribute('disabled');
                    $(object).removeClass('disabled');
                }
            }
            if (mask.visible !== null) {
                if (mask.visible === true) {
                    $(object).removeClass('hidden');
                    $(object).addClass('visible');
                } else {
                    $(object).removeClass('visible');
                    $(object).addClass('hidden');
                }
            }
        }
    },

    applyActionsForField: function(name)
    {
        if (this.fields[name] && this.fields[name].actions !== null) {

            for (var i = 0; i < this.fields[name].actions.length; i++) {

                var action = this.fields[name].actions[i];
                if (action.loop === 0) {

                    var parts = action.status.split(":");
                    var type = parts === null ? action.status : parts[0];
                    var target = (this.fields[action.target] ? this.fields[action.target].object : document.getElementById(action.target));

                    if (target && target !== null) {

                        this.prependActionsForTarget(action);
                        if (this.evalActions(type, name, action.status)) {

                            this.fields[name].actions[i].loop = 1;
                            parts = action.action.split(":");
                            type = parts === null ? action.action : parts[0];

                            this.applyActions(type, action, target);

                            if (this.fields[action.target]) this.applyActionsForField(action.target);

                            this.fields[name].actions[i].loop = 0;
                        }
                    }
                }
            }
        }
    },

    applyActions: function(type, action, target)
    {
        switch (type) {
            case "hidden":this.applyHiddenAction(action.target, target);break;
            case "visible":this.applyVisibleAction(action.target, target);break;
            case "disabled":this.applyDisabledAction(action.target, target);break;
            case "enabled":this.applyEnabledAction(action.target, target);break;
            case "javascript":this.applyJavascriptAction(action);break;
            case "none":break;
            default:alert("Unkown action '" + type + "'");return;
        }
    },

    applyHiddenAction: function(name, object)
    {
        if (object !== null) this.maskAction(name, object, false, null);
    },

    applyVisibleAction: function(name, object)
    {
        if (object !== null) this.maskAction(name, object, true, null);
    },

    applyDisabledAction: function(name, object)
    {
        if (object !== null)
            this.maskAction(name, object, null, false);
    },

    applyEnabledAction: function(name, object)
    {
        if (object !== null) this.maskAction(name, object, null, true);
    },

    applyJavascriptAction: function(action)
    {
        var p = action.action.indexOf(":");
        if (p >= 0) {
            var js = action.action.substr(p + 1);
            window.eval(js);
        }
    },

    evalActions: function(type, name, status)
    {
        var visible = this.isAvailableField(name);

        switch (type) {

            case "unselected": return visible ? this.evalUnselectedAction(name) : true;
            case "selected": return visible ? this.evalSelectedAction(name) : true;
            case "value": return visible ? this.evalValueAction(name, status) : true;
            case "valid": return visible ? this.evalValidAction(name) : true;
            case "invalid": return visible ? !this.evalValidAction(name) : false;
            case "checked": return visible ? this.evalCheckedAction(name) : true;
            case "unchecked": return visible ? !this.evalCheckedAction(name) : false;
            case "filled": return visible ? !this.evalFilledAction(name) : true;
            case "empty": return visible ? !this.evalEmptyAction(name) : false;
        }

        throw "Unkown status [" + type + "]";
        return false;
    },

    prependActionsForTarget: function(action)
    {
        var evaluate = false;

        for (var i in this.fields) {
            if (this.fields[i].actions !== null && this.fields[i].actions.length > 0) {
                for (var j = 0; j < this.fields[i].actions.length; j++) {
                    var target_action = this.fields[i].actions[j];
                    if (target_action.target === action.target && (target_action.status !== action.status || target_action.action !== action.action)) {
                        var parts = action.status.split(":");
                        var type = parts === null ? action.status : parts[0];
                        if (this.evalActions(type, i, target_action.status)) {
                            evaluate = true;
                            parts = target_action.action.split(":");
                            type = parts === null ? target_action.action : parts[0];
                        }
                    }
                }
            }
        }

        return evaluate;
    },

    evalUnselectedAction: function(name)
    {
        if (this.fields[name].object.tagName.toLowerCase() === "select" &&
            this.fields[name].object.attributes['data-unselected-value'])
        {
            var value = this.fields[name].object.attributes['data-unselected-value'].value;
            var src_val = this.fields[name].object.options[this.fields[name].object.selectedIndex].value;

            return value === src_val;
        }

        return false;
    },

    evalSelectedAction: function(name)
    {
        if (this.fields[name].object.tagName.toLowerCase() === "select" &&
            this.fields[name].object.attributes['data-unselected-value'])
        {
            var value = this.fields[name].object.attributes['data-unselected-value'].value;
            var src_val = this.fields[name].object.options[this.fields[name].object.selectedIndex].value;

            return value !== src_val;
        }

        return false;
    },

    evalValueAction: function(name, check)
    {
        var p = check.indexOf(":");
        if (p >= 0) {
            var match = check.substr(p + 1);
            var value = this.getFieldValue(name);
            if (value instanceof Array) {
                for (var i = 0; i < value.length; i++) {
                    if (value[i] === match) return true;
                }
                return false;
            } else {
                return (value !== null && value === match);
            }
        }

        return false;
    },

    evalValidAction: function(name)
    {
        return this.fields[name]
               ? (this.fields[name].trigger > 0)
               : true
        ;
    },

    evalCheckedAction: function(name)
    {
        return this.fields[name] && this.fields[name].object !== null && this.fields[name].object.checked !== undefined
               ? this.fields[name].object.checked
               : true
        ;
    },

    evalEmptyAction: function(name)
    {
        var value = this.getFieldValue(name);
        if (value instanceof Array) {
            for (var i = 0; i < value.length; i++) {
                if (value[i].length === 0) return false;
            }
            return false;
        } else {
            return !(value === null || value.length === 0);
        }

        return true;
    },

    evalFilledAction: function(name)
    {
        var value = this.getFieldValue(name);
        if (value instanceof Array) {
            for (var i = 0; i < value.length; i++) {
                if (value[i].length > 0) return true;
            }
            return false;
        } else {
            return (value !== null && value.length > 0);
        }

        return false;
    },

    refresh: function()
    {
        this.form.submit();
    },

    trigger: function(obj)
    {
        if (obj !== null && obj.attributes['action']) {
            var action = obj.attributes['action'].value;
            var parts = action.split(":");
            if (parts !== null && parts.length > 0) {
                switch (parts[0]) {
                    case 'javascript': this.triggerJavascript(obj, action); break;
                    case 'url': this.triggerHTTP(obj, action); break;
                }
            }
        }
    },

    triggerJavascript: function(obj, action)
    {
        var p = action.indexOf(":");
        if (p >= 0) {
            var js = action.substr(p + 1);
            eval(js);
        }
    },

    triggerHTTP: function(obj, action)
    {
        var p = action.indexOf(":");
        if (p >= 0) {
            var url = action.substr(p + 1);
            document.location = url;
        }
    },

    submitByAjax: function(btn_submit)
    {
        var i, stream = "";
        var Self = this;

        if (this.form !== null && this.params.ajax === true) {

            if (this.params.ajax_target !== null) {
                var obj = document.getElementById(this.params.ajax_target);
                if (obj) {
                    $(obj).addClass('sending');
                } else {
                    $(this.form).addClass('sending');
                }
            } else {
                $(this.form).addClass('sending');
            }

            var contentType = "application/x-www-form-urlencoded";
            if (this.params.enctype) {
                contentType = this.params.enctype;
            } else if (this.form.encoding) {
                contentType = this.form.encoding;
            } else if (this.form.contentType) {
                contentType = this.form.enctype;
            }

            var multipart = (contentType === 'multipart/form-data');
            var json = (contentType === 'application/json' || contentType === 'text/json');

            if (multipart) {
                var fd = new FormData();

                for (i in this.fields) {
                    var obj = this.fields[i].object;
                    if (obj !== null) {
                        if (obj instanceof HTMLInputElement) {
                            if (obj.attributes['type']) {
                                var t = obj.attributes['type'].value;
                                if (t === 'file') {
                                    var files = (obj.final_files ? obj.final_files : obj.files);
                                    for (var j = 0; j < files.length; j++) {
                                        fd.append(i + '[' + j + ']', files[j]);
                                    }
                                } else if (t !== 'submit' && t !== 'image') {
                                    if ((t !== 'checkbox' && t !== 'radio') || obj.checked) {
                                        fd.append(i, this.getFieldValue(i));
                                    }
                                }
                            }
                        } else if (obj instanceof HTMLSelectElement || obj instanceof HTMLTextAreaElement || obj instanceof NodeList || obj instanceof HTMLCollection || obj instanceof Array) {
                            fd.append(i, this.getFieldValue(i));
                        } else if (!(obj instanceof HTMLButtonElement)) {
                            throw "Object not found [" + obj + " " + i + "]";
                        }
                    }
                }

                if ((typeof btn_submit !== 'undefined') && btn_submit !== null && btn_submit.attributes && btn_submit.attributes['name']) {
                    fd.append(btn_submit.attributes['name'].value, null);
                }
            /*} else if (json) {
                var list = {};
                for (i in this.fields) {
                    var obj = this.fields[i].object;
                    if (obj !== null) {
                        if (obj instanceof HTMLInputElement) {
                            if (obj.attributes['type']) {
                                var t = obj.attributes['type'].value;
                                /*if (t === 'file') {
                                    var files = (obj.final_files ? obj.final_files : obj.files);
                                    for (var j = 0; j < files.length; j++) {
                                        fd.append(i + '[' + j + ']', files[j]);
                                    }
                                } else*//* if (t !== 'submit' && t !== 'image') {
                                    if ((t !== 'checkbox' && t !== 'radio') || obj.checked) {
                                        stream += (stream.length === 0 ? "" : "&") + i + "=" + encodeURIComponent(this.getFieldValue(i));
                                    }
                                }
                            }
                        } else if (obj instanceof HTMLSelectElement || obj instanceof HTMLTextAreaElement || obj instanceof NodeList || obj instanceof HTMLCollection || obj instanceof Array) {
                            stream += (stream.length === 0 ? "" : "&") + i + "=" + encodeURIComponent(this.getFieldValue(i));
                        } else if (!(obj instanceof HTMLButtonElement)) {
                            throw "Object not found [" + obj + " " + i + "]";
                        }
                    }
                }

                if (btn_submit !== undefined && btn_submit !== null && btn_submit.attributes && btn_submit.attributes['name']) {
                    stream += (stream.length === 0 ? "" : "&") + btn_submit.attributes['name'].value + "=";
                }*/
            } else {
                for (i in this.fields) {
                    var obj = this.fields[i].object;
                    if (obj !== null) {
                        if (obj instanceof HTMLInputElement) {
                            if (obj.attributes['type']) {
                                var t = obj.attributes['type'].value;
                                /*if (t === 'file') {
                                    var files = (obj.final_files ? obj.final_files : obj.files);
                                    for (var j = 0; j < files.length; j++) {
                                        fd.append(i + '[' + j + ']', files[j]);
                                    }
                                } else*/ if (t !== 'submit' && t !== 'image') {
                                    if ((t !== 'checkbox' && t !== 'radio') || obj.checked) {
                                        stream += (stream.length === 0 ? "" : "&") + i + "=" + encodeURIComponent(this.getFieldValue(i));
                                    }
                                }
                            }
                        } else if (obj instanceof HTMLSelectElement || obj instanceof HTMLTextAreaElement || obj instanceof NodeList || obj instanceof HTMLCollection || obj instanceof Array) {
                            stream += (stream.length === 0 ? "" : "&") + i + "=" + encodeURIComponent(this.getFieldValue(i));
                        } else if (!(obj instanceof HTMLButtonElement)) {
                            throw "Object not found [" + obj + " " + i + "]";
                        }
                    }
                }

                if (btn_submit !== undefined && btn_submit !== null && btn_submit.attributes && btn_submit.attributes['name']) {
                    stream += (stream.length === 0 ? "" : "&") + btn_submit.attributes['name'].value + "=";
                }
            }

            var data = $(this.form).data();

            var uri = (btn_submit.attributes && btn_submit.attributes['formaction'])
                    ? (btn_submit.attributes['formaction'].value)
                    : (data.actionTemplate && data.actionTemplate.length > 0
                       ? ((data.id)
                          ? $.sprintf(data.actionTemplate, data.id)
                          : data.actionTemplate
                         )
                       : this.form.action
                      )
            ;

            var method = this.form.method.toUpperCase();
            if (method === 'GET') {
                uri += (uri !== null && uri.indexOf('?') >= 0 ? "&" : "?") + stream;
            }

            var query = new Nabu.Ajax.Connector(uri, method, {
                withCredentials: true,
                contentType: (multipart ? null : contentType)
            });
            query.addEventListener(new Nabu.Event({
                onLoad: function(response) {
                    if (Self.params.ajax_target !== null) {
                        var obj = document.getElementById(Self.params.ajax_target);
                        if (obj) {
                            $(obj).removeClass('sending');
                            obj.innerHTML = response;
                            nabu.callJavaScript(obj);
                        }
                    }
                    if (Self.params.ajax_onload !== null) {
                        window[Self.params.ajax_onload]({
                            "form": Self,
                            "response": response
                        });
                    }
                    $(Self.form).removeClass('sending');
                    Self.events.fireEvent("onSubmit", Self, { "response" : response.params});
                },
                onError: function() {
                    var obj = document.getElementById(Self.params.ajax_target);
                    if (obj) {
                        $(obj).removeClass('sending');
                    }
                    Self.events.fireEvent("onError", Self);
                },
                onUploadProgress: function(source, params) {
                    if (Self.params.ajax_on_upload_progress !== null) {
                        window[Self.params.ajax_on_upload_progress]({
                            form: Self,
                            response: params
                        });
                    }
                }
            }));

            if (multipart) {
                query.setPostStream(fd);
            } else {
                query.setPostStream(stream);
            }
            query.execute();
        }
    },

    onSubmit: function(e)
    {
        if (this.formaction !== null && nabu.getNavigatorName() === 'MSIE') {
            this.form.action = this.formaction;
        }
        this.formaction = null;
        if (this.params.ajax === true) {
            var submit_object = this.submit_object !== null ? this.submit_object : (e.explicitOriginalTarget ? e.explicitOriginalTarget : null);
            if (submit_object === null || (submit_object.attributes['type'] && submit_object.attributes['type'].value !== 'submit')) {
                for (var field in this.fields) {
                    var field = this.fields[field].object;
                    if ((field.attributes['type'] && field.attributes['type'].value==='submit') ||
                        //(!field.attributes['type'] && field.tagName.toLowerCase()==='button') ||
                        (field.attributes['action'] && field.attributes['action'].value==='submit')
                       )
                    {
                        submit_object = field;
                        break;
                    }
                }
            }
            this.submitByAjax(submit_object);
            e.stopPropagation();
            return false;
        } else {
            $(this.container).addClass('sending');
            return true;
        }
    },

    onChangeField: function(e)
    {
        var field = e.target;
        var trigger = this.validateField(field.name);

        this.setFieldStatusClass(field.name, trigger);
        this.resetActionsFlag();
        this.applyActionsForField(field.name);

        if (field.attributes['refresh'] && field.attributes['refresh'].value === 'yes') {
            this.refresh();
            trigger = 0;
        } else {
            this.validateSameFields(field.name);
            this.validateForm();
        }

        this.events.fireEvent('onFieldChange', this, {
            'field': field.name,
            'value': $(field).val()
        });

        return (trigger!==0);
    },

    onFocusField: function(e)
    {
        var field = e.target;
        this.applyPlaceholder(field, true);
    },

    onBlurField: function(e)
    {
        var field = e.target;
        var trigger = this.validateField(field.name);

        this.setFieldStatusClass(field.name, trigger);
        this.resetActionsFlag();
        this.applyActionsForField(field.name);
        this.validateSameFields(field.name);
        this.validateForm();
        this.applyPlaceholder(field, false);

        return (trigger!==0);
    },

    onClickField: function(e)
    {
        var field = e.target;

        if (!field.inClickForm) {
            field.inClickForm = true;
            if (field.attributes['type'] && field.attributes['type'].value.toLowerCase() === 'submit') this.submit_object = field;

            //if (field.form_onclick_old && field.form_onclick_old !== null && (typeof field.form_onclick_old) === 'function') field.form_onclick_old();

            var trigger = this.validateField(field.name);
            this.setFieldStatusClass(field.name, trigger);
            this.resetActionsFlag();
            this.applyActionsForField(field.name);

            if (trigger!==0) if (field.attributes['action']) this.trigger(field);

            if (field.attributes['formaction']) this.formaction = field.attributes['formaction'].value;
            this.validateSameFields(field.name);
            this.validateForm();

            if (field.attributes['type']) {
                var ftype = field.attributes['type'].value.toLowerCase();
                console.log(ftype);
                if (ftype === 'checkbox') {
                    console.log(field.attributes);
                    console.log(field.name);
                    this.events.fireEvent('onFieldChange', this, {
                        'field': field.name,
                        'value': field.checked ? $(field).val() : $(field).data('value-unchecked')
                    });
                }
            }

            field.inClickForm = false;
        }

        return true;
    },

    onKeyUp: function(e)
    {
        var field = e.target;
        var trigger = this.validateField(field.name);

        this.setFieldStatusClass(field.name, trigger);
        this.resetActionsFlag();
        this.applyActionsForField(field.name);

        if (field.attributes['refresh'] && field.attributes['refresh'].value === 'yes') {
            this.refresh();
            return false;
        }
        this.validateSameFields(field.name);
        this.validateForm();

        return (trigger!==0);
    }
};

nabu.registerLibrary('Form', ['Event', 'Ajax']);

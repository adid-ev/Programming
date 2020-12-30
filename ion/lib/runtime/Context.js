void (function(){var _ion_runtime_Context_ = function(module,exports,require){'use strict';
var ion = require('../'), Factory = require('./Factory'), Literal = require('./Literal'), noop = function () {
    };
var createObjectInserter = function (container) {
    return {
        isOrdered: function (value) {
            return false;
        },
        convert: function (value) {
            return value;
        },
        getLength: function () {
            return 0;
        },
        add: function (value, index) {
            var current = container[value];
            var insert = (current != null ? current : 0) + 1;
            container[value] = insert;
        },
        remove: function (index, value, moving) {
            var current = container[value];
            if (!(current != null)) {
                throw new Error('Removing value \'' + value + '\' that was not present in container: ' + container);
            }
            var insert = current - 1;
            if (insert === 0) {
                delete container[value];
            } else {
                container[value] = insert;
            }
        }
    };
};
var createMapInserter = function (container) {
    var touch = function () {
        container.touch = container.touch != null ? container.touch : 0;
        container.touch += 1;
    };
    return {
        isOrdered: function (value) {
            return false;
        },
        convert: function (value) {
            return value;
        },
        getLength: function () {
            return container.size;
        },
        add: function (value, index) {
            var current = container.get(value);
            var insert = (current != null ? current : 0) + 1;
            container.set(value, insert);
            touch();
        },
        remove: function (index, value, moving) {
            var current = container.get(value);
            if (!(current != null)) {
                throw new Error('Removing value \'' + value + '\' that was not present in container: ' + container);
            }
            var insert = current - 1;
            if (insert === 0) {
                container.delete(value);
            } else {
                container.set(value, insert);
            }
            touch();
        }
    };
};
var createArrayInserter = function (container) {
    return {
        isOrdered: function (value) {
            if (container.sortCompareFunction != null) {
                return false;
            }
            return container.unordered !== true;
        },
        convert: function (value) {
            return value;
        },
        getLength: function () {
            return container.length;
        },
        add: function (value, index) {
            if (index != null) {
                container.splice(index, 0, value);
            } else {
                container.push(value);
            }
        },
        remove: function (index, value, moving) {
            index = index != null ? index : container.indexOf(value);
            container.splice(index, 1);
        }
    };
};
var isNode = function (value) {
    return typeof (value != null ? value.nodeType : void 0) === 'number';
};
var isWebComponent = function (value) {
    return (value != null ? value.nodeName != null ? value.nodeName.indexOf('-') : void 0 : void 0) > 0;
};
var createHtmlInserter = function (container) {
    return {
        isOrdered: function (value) {
            if (typeof value === 'function') {
                return false;
            }
            if (container.unordered) {
                return false;
            }
            return true;
        },
        convert: function (value) {
            if (typeof value === 'function') {
                var name = value.id != null ? value.id : value.name;
                if (!(name != null)) {
                    throw new Error('Functions added to an Element must be named');
                }
                var capture = false;
                var captureSuffix = '_capture';
                if (name.endsWith(captureSuffix)) {
                    capture = true;
                    name = name.substring(0, name.length - captureSuffix.length);
                }
                value.id = name;
                value.capture = capture;
            } else if (!isNode(value)) {
                value = document.createTextNode(value);
            }
            return value;
        },
        getLength: function () {
            return container.childNodes.length;
        },
        add: function (value, index, sourceNode) {
            if (typeof value === 'function') {
                if (value.toString().indexOf('ion.sync') < 0) {
                    value.wrapper = value.wrapper != null ? value.wrapper : function () {
                        value.apply(this, arguments);
                        ion.sync(value.id != null ? value.id : value.name);
                    };
                }
                container.addEventListener(value.id, value.wrapper != null ? value.wrapper : value, value.capture);
            } else {
                if (global.Polymer) {
                    var polymerContainer = Polymer.dom(container);
                    if (index != null) {
                        var after = polymerContainer.childNodes[index];
                        if (after != null) {
                            polymerContainer.insertBefore(value, after);
                            return;
                        }
                    }
                    polymerContainer.appendChild(value);
                } else {
                    if (index != null) {
                        var after = container.childNodes[index];
                        if (after != null) {
                            container.insertBefore(value, after);
                            return;
                        }
                    }
                    container.appendChild(value);
                }
            }
        },
        remove: function (index, value, moving) {
            if (typeof value === 'function') {
                container.removeEventListener(value.id, value.wrapper != null ? value.wrapper : value);
            } else if (!moving) {
                if (global.Polymer) {
                    var polymerContainer = Polymer.dom(container);
                    try {
                        polymerContainer.removeChild(value);
                    } catch (e) {
                        if (!warnedOfRemovalBug) {
                            warnedOfRemovalBug = true;
                            console.log('TODO: FIX!!! Polymer error: Cannot remove child. It may not exist anymore/yet.');
                        }
                    }
                } else {
                    if (value.parentElement === container) {
                        container.removeChild(value);
                    } else {
                        console.log('Context is trying to remove an element from a container that it is not in.');
                    }
                }
            }
        }
    };
};
var warnedOfRemovalBug = false;
function isDomAncestor(ancestor, child, debug) {
    var realAncestor = child;
    while (realAncestor.parentElement != null) {
        realAncestor = realAncestor.parentElement;
        if (realAncestor === ancestor) {
            return true;
        }
    }
    return false;
}
var createOrderManager = function (container) {
    var inserter;
    if (Array.isArray(container)) {
        inserter = createArrayInserter(container);
    } else if ((container != null ? container.constructor : void 0) === Map) {
        inserter = createMapInserter(container);
    } else if (isNode(container)) {
        inserter = createHtmlInserter(container);
    } else if ((container != null ? container.constructor : void 0) === Object) {
        inserter = createObjectInserter(container);
    } else {
        return {
            insert: function (value, order, fastInsert, sourceNode) {
                return ion.add(container, value, sourceNode);
            },
            update: function (oldOrder, newOrder) {
            }
        };
    }
    var baseLength = inserter.getLength();
    var insertionOrders = [];
    var insertionValues = {};
    var pendingOrderChanges = {};
    var insertInternal = function (value, order, fastInsert, sourceNode) {
        if (insertionValues[order] != null) {
            throw new Error('Cannot add a new item with the same order as an existing item: ' + JSON.stringify({
                order: order,
                previousValue: insertionValues[order],
                newValue: value
            }));
        }
        if (inserter.isOrdered(value)) {
            insertionValues[order] = value;
            insertionOrders.push(order);
        } else {
            fastInsert = true;
        }
        if (fastInsert) {
            inserter.add(value, null, sourceNode);
        } else {
            insertionOrders.sort();
            var index = insertionOrders.indexOf(order);
            inserter.add(value, baseLength + index, sourceNode);
        }
    };
    var removeInternal = function (value, order, moving) {
        if (!inserter.isOrdered(value)) {
            inserter.remove(null, value);
        } else {
            if (insertionValues[order] !== value) {
                order = null;
                for (var key in insertionValues) {
                    var insertedValue = insertionValues[key];
                    if (insertedValue === value) {
                        order = key;
                        break;
                    }
                }
                if (order === null) {
                    throw new Error('Could not find value in insertionValues ' + value);
                }
            }
            var index = insertionOrders.indexOf(order);
            if (index < 0) {
                throw new Error('Insertion order ' + JSON.stringify(order) + ' not found ' + JSON.stringify(insertionOrders));
            }
            insertionOrders.splice(index, 1);
            inserter.remove(baseLength + index, value, moving);
            delete insertionValues[order];
        }
    };
    return {
        insert: function (value, order, fastInsert, sourceNode) {
            value = inserter.convert(value);
            insertInternal(value, order, fastInsert, sourceNode);
            return function () {
                return removeInternal(value, order);
            };
        },
        update: function (oldOrder, newOrder) {
            if (oldOrder != null && newOrder != null) {
                pendingOrderChanges[oldOrder] = newOrder;
            } else {
                var reinsertValues = {};
                for (var i = insertionOrders.length - 1; i >= 0; i--) {
                    var order = insertionOrders[i];
                    for (var oldOrderValue in pendingOrderChanges) {
                        var newOrderValue = pendingOrderChanges[oldOrderValue];
                        if (order.startsWith(oldOrderValue)) {
                            var insertedValue = insertionValues[order];
                            reinsertValues[newOrderValue + order.substring(oldOrderValue.length)] = insertedValue;
                            removeInternal(insertedValue, order, true);
                        }
                    }
                }
                for (var order in reinsertValues) {
                    var value = reinsertValues[order];
                    insertInternal(value, order);
                }
                pendingOrderChanges = {};
            }
        }
    };
};
var Context = ion.defineClass({
        name: 'Context',
        constructor: function Context(parent, output, order) {
            this.output = output;
            this.parent = parent;
            this.depth = parent != null ? parent.depth + 1 : 0;
            this.variables = {};
            this.root = (parent != null ? parent.root : void 0) != null ? parent.root : this;
            this._runtimes = {};
            this.returnExpression = parent != null ? parent.returnExpression : void 0;
            this.inserter = output === (parent != null ? parent.output : void 0) ? parent != null ? parent.inserter : void 0 : createOrderManager(output);
            this.order = order;
        },
        properties: {
            newContext: function (output, order) {
                if (output == null)
                    output = this.output;
                return new Context(this, output, order);
            },
            createRuntime: function (node) {
                return Factory.createRuntime(this, node);
            },
            setFastInsert: function (value) {
                if (this.inserter != null) {
                    this.inserter.fastInsert = value;
                }
            },
            order: {
                get: function () {
                    var value = this._order != null ? this._order : '';
                    if (this.output != null && this.output === (this.parent != null ? this.parent.output : void 0)) {
                        value = this.parent.order + value;
                    }
                    return value;
                },
                set: function (value) {
                    var _order = this._order;
                    var oldValue = this.order;
                    this._order = value != null ? value : '';
                    var newValue = this.order;
                    if (_order != null && newValue !== oldValue) {
                        this.inserter != null ? this.inserter.update(oldValue, newValue) : void 0;
                    }
                }
            },
            insert: function (value, order, sourceNode) {
                order = this.order + (order != null ? order : '');
                return this.inserter.insert(value, order, this.inserter.fastInsert, sourceNode);
            },
            get: function (name) {
                var variable = this.getVariable(name);
                if (!(variable != null)) {
                    throw new Error('Variable not found: \'' + name + '\'');
                }
                return variable.value;
            },
            getVariable: function (ast) {
                var name = typeof ast === 'string' ? ast : ast.name;
                var context = this, value;
                while (context != null) {
                    var variable = context.variables[name];
                    if (variable != null) {
                        return variable;
                    }
                    context = context.parent;
                }
                value = global[name];
                if (value === void 0) {
                    var message = 'Variable not found: \'' + name + '\'';
                    if (typeof ast === 'object') {
                        message += ' at (' + ast.loc.start.source + ':' + ast.loc.start.line + ':' + (ast.loc.start.column + 1) + ')';
                    }
                    throw new Error(message);
                }
                var cachedGlobals = this.root.globals = this.root.globals != null ? this.root.globals : {};
                return cachedGlobals[name] = cachedGlobals[name] != null ? cachedGlobals[name] : new Literal({
                    value: value,
                    mutable: true
                });
            },
            setVariableFromAst: function (name, node) {
                if (name != null) {
                    return this.setVariableExpression(name, this.createRuntime(node));
                }
            },
            setVariableLiteral: function (name, value) {
                if (name != null) {
                    return this.setVariableExpression(name, new Literal({
                        value: value,
                        mutable: true
                    }));
                }
            },
            setVariableExpression: function (name, expression) {
                if (name != null) {
                    if (this.variables[name] != null) {
                        throw new Error('Variable ' + name + ' is already defined');
                    }
                    this.variables[name] = expression;
                    return expression;
                }
            }
        }
    });
module.exports = exports = Context;
  }
  if (typeof require === 'function') {
    if (require.register)
      require.register('ion/runtime/Context',_ion_runtime_Context_);
    else
      _ion_runtime_Context_.call(this, module, exports, require);
  }
  else {
    _ion_runtime_Context_.call(this);
  }
}).call(this)
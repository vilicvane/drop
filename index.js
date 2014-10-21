var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Drop;
(function (Drop) {
    'use strict';

    

    var hop = Object.prototype.hasOwnProperty;
    var slice = Array.prototype.slice;
    var splice = Array.prototype.splice;

    var nextTick = (function () {
        // linked list of tasks (single, with head node)
        var head = {
            task: null,
            next: null
        };
        var tail = head;
        var flushing = false;
        var requestTick = null;

        function flush() {
            while (head.next) {
                head = head.next;
                var task = head.task;
                head.task = null;

                try  {
                    task();
                } catch (e) {
                    setTimeout(function () {
                        throw e;
                    }, 0);
                }
            }

            flushing = false;
        }

        var nextTick = function (task) {
            tail = tail.next = {
                task: task,
                next: null
            };

            if (!flushing) {
                flushing = true;
                requestTick();
            }
        };

        if (typeof setImmediate === 'function') {
            // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
            if (typeof window !== 'undefined') {
                requestTick = setImmediate.bind(window, flush);
            } else {
                requestTick = function () {
                    setImmediate(flush);
                };
            }
        } else if (typeof MessageChannel !== 'undefined') {
            // modern browsers
            // http://www.nonblocking.io/2011/06/windownexttick.html
            var channel = new MessageChannel();

            // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
            // working message ports the first time a page loads.
            channel.port1.onmessage = function () {
                requestTick = requestPortTick;
                channel.port1.onmessage = flush;
                flush();
            };
            var requestPortTick = function () {
                // Opera requires us to provide a message payload, regardless of
                // whether we use it.
                channel.port2.postMessage(0);
            };
            requestTick = function () {
                setTimeout(flush, 0);
                requestPortTick();
            };
        } else {
            // old browsers
            requestTick = function () {
                setTimeout(flush, 0);
            };
        }

        return nextTick;
    })();

    var StringHash = (function () {
        function StringHash() {
            this.map = {};
        }
        Object.defineProperty(StringHash.prototype, "keys", {
            get: function () {
                return Object.keys(this.map);
            },
            enumerable: true,
            configurable: true
        });

        StringHash.prototype.exists = function (key) {
            return hop.call(this.map, key);
        };

        StringHash.prototype.set = function (key) {
            this.map[key] = null;
        };

        StringHash.prototype.unset = function (key) {
            delete this.map[key];
        };

        StringHash.prototype.clear = function () {
            this.map = {};
        };
        return StringHash;
    })();

    var StringMap = (function () {
        function StringMap() {
            this.map = {};
        }
        Object.defineProperty(StringMap.prototype, "keys", {
            get: function () {
                return Object.keys(this.map);
            },
            enumerable: true,
            configurable: true
        });

        StringMap.prototype.exists = function (key) {
            return hop.call(this.map, key);
        };

        StringMap.prototype.get = function (key, defaultValue) {
            if (hop.call(this.map, key)) {
                return this.map[key];
            } else if (arguments.length > 1) {
                this.map[key] = defaultValue;
                return defaultValue;
            } else {
                return undefined;
            }
        };

        StringMap.prototype.set = function (key, value) {
            this.map[key] = value;
        };

        StringMap.prototype.remove = function (key) {
            delete this.map[key];
        };

        StringMap.prototype.clear = function () {
            this.map = {};
        };
        return StringMap;
    })();

    var UniqueObjectArray = (function () {
        function UniqueObjectArray(items) {
            if (typeof items === "undefined") { items = []; }
            var _this = this;
            this.items = [];
            items.forEach(function (item) {
                _this.add(item);
            });
        }
        Object.defineProperty(UniqueObjectArray.prototype, "length", {
            get: function () {
                return this.items.length;
            },
            enumerable: true,
            configurable: true
        });

        UniqueObjectArray.prototype.exists = function (item) {
            return this.items.indexOf(item) >= 0;
        };

        UniqueObjectArray.prototype.add = function (item) {
            if (this.items.indexOf(item) < 0) {
                this.items.push(item);
            }
        };

        UniqueObjectArray.prototype.remove = function (item) {
            var index = this.items.indexOf(item);

            if (index >= 0) {
                this.items.splice(index, 1);
            }
        };

        UniqueObjectArray.prototype.toArray = function () {
            return this.items;
        };
        return UniqueObjectArray;
    })();

    var EventHost = (function () {
        function EventHost() {
            this._events = new StringMap();
            this._onceEvents = new StringMap();
        }
        EventHost.prototype.on = function (type, listener) {
            //console.log('on("' + type + '")');
            var listeners = this._events.get(type);

            if (!listeners) {
                listeners = new UniqueObjectArray();
                this._events.set(type, listeners);
            }

            listeners.add(listener);
        };

        EventHost.prototype.once = function (type, listener) {
            var listeners = this._events.get(type);

            if (listeners) {
                listeners.remove(listener);
            }

            listeners = this._onceEvents.get(type);

            if (!listeners) {
                listeners = new UniqueObjectArray();
                this._onceEvents.set(type, listeners);
            }

            listeners.add(listener);
        };

        EventHost.prototype.off = function (type, listener) {
            //console.log('off("' + type + '")');
            var listeners = this._events.get(type);

            if (listeners) {
                listeners.remove(listener);
            }

            listeners = this._onceEvents.get(type);

            if (listeners) {
                listeners.remove(listener);
            }
        };

        EventHost.prototype.trigger = function (type, data) {
            var _this = this;
            if (typeof data === "undefined") { data = {}; }
            data['type'] = type;

            var listeners = this._events.get(type);

            if (listeners) {
                return listeners.toArray().every(function (listener) {
                    return listener.call(_this, data) !== false;
                });
            } else {
                return true;
            }
        };
        return EventHost;
    })();
    Drop.EventHost = EventHost;

    //#endregion
    var XArray = (function () {
        function XArray(array) {
            if (typeof array === "undefined") { array = []; }
            this._array = array;
            this._nextId = array.length;

            var indexToId = [];
            for (var i = 0; i < array.length; i++) {
                indexToId[i] = i;
            }

            this._indexToId = indexToId;
        }
        Object.defineProperty(XArray.prototype, "length", {
            get: function () {
                return this._indexToId.length;
            },
            enumerable: true,
            configurable: true
        });

        XArray.prototype.id = function (index) {
            return this._indexToId[index];
        };

        XArray.prototype.existsId = function (id) {
            return id in this._array;
        };

        XArray.prototype.item = function (index) {
            var id = this._indexToId[index];
            if (typeof id == 'number') {
                return this._array[id];
            }
        };

        XArray.prototype.itemById = function (id) {
            var array = this._array;
            if (id in array) {
                return array[id];
            }
        };

        XArray.prototype.range = function (index, length) {
            if (typeof index === "undefined") { index = 0; }
            if (typeof length === "undefined") { length = Infinity; }
            var ids = [];
            var indexToId = this._indexToId;

            length = Math.min(length, indexToId.length - index);

            for (var i = 0; i < length; i++) {
                ids.push(indexToId[index++]);
            }

            var array = this._array;

            return ids.map(function (id) {
                return array[id];
            });
        };

        XArray.prototype.add = function (item) {
            var id = this._nextId;
            this._array[id] = item;
            this._indexToId.push(id);
            this._nextId++;
            return id;
        };

        XArray.prototype.set = function (index, value) {
            var id = this._indexToId[index];
            if (typeof id == 'number') {
                this._array[id] = value;
                return id;
            }
        };

        XArray.prototype.setById = function (id, value) {
            var array = this._array;
            if (id in array) {
                array[id] = value;
                return true;
            } else {
                return false;
            }
        };

        XArray.prototype.insert = function (items, index) {
            if (typeof index === "undefined") { index = Infinity; }
            var ids = [];
            var array = this._array;
            var nextId = this._nextId;

            var arraySpliceArgs = [Infinity, 0].concat(items);

            var indexToIdSpliceArgs = [index, 0];
            for (var i = 0; i < items.length; i++) {
                ids.push(nextId);
                indexToIdSpliceArgs.push(nextId);
                nextId++;
            }

            splice.apply(array, arraySpliceArgs);
            splice.apply(this._indexToId, indexToIdSpliceArgs);

            this._nextId = nextId;
            return ids;
        };

        XArray.prototype.remove = function (index, length) {
            if (typeof length === "undefined") { length = 1; }
            var ids = this._indexToId.splice(index, length);
            var array = this._array;

            ids.forEach(function (id) {
                delete array[id];
            });

            return ids;
        };

        XArray.prototype.clear = function () {
            var ids = this._indexToId.concat();
            this._indexToId.length = 0;
            this._array.length = 0;
            return ids;
        };
        return XArray;
    })();
    Drop.XArray = XArray;

    //#region compoundExpressionRegex source
    //var operatorsRegex = /\b(?:typeof|instanceof|new)\b/;
    //var nullLiteralRegex = /\bnull\b/;
    //var booleanLiteralRegex = /\b(?:true|false)\b/;
    //var stringLiteralRegex = /(?:(["'])(?:(?!\2|[\r\n\u2028\u2029\\])[\s\S]|\\(?:['"\\bfnrtv]|[^'"\\bfnrtv\dxu\r\n\u2028\u2029]|0|x[\da-fA-F]{2}|u[\da-fA-F]{4})|\\(?:[\r\n\u2028\u2029]|\r\n))*\2)/;
    //var numericLiteralRegex = /(?:(?:(?:0|[1-9]\d*)(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|0[xX][\da-fA-F]+)/;
    //var regexLiteralRegex = /(?:\/(?:[^\r\n\u2028\u2029*/\[\\]|\\[^\r\n\u2028\u2029]|\[(?:[^\r\n\u2028\u2029\]\\]|\\[^\r\n\u2028\u2029])*\])(?:[^\r\n\u2028\u2029/\[\\]|\\[^\r\n\u2028\u2029]|\[(?:[^\r\n\u2028\u2029\]\\]|\\[^\r\n\u2028\u2029])*\])*\/[gimy]{0,4})/;
    //var expressionRegex = /(\.\s*)?([a-zA-Z$_][\w$_]*(?:\s*\.\s*[a-zA-Z$_][\w$_]*)*)\s*(?:(\[)|(?![\(\w$_]))/;
    //var invalidCharsRegex = /(\{)/;
    //var compoundExpressionRegex = new RegExp(
    //    [
    //        '(' + [
    //            operatorsRegex.source,
    //            nullLiteralRegex.source,
    //            booleanLiteralRegex.source,
    //            stringLiteralRegex.source,
    //            numericLiteralRegex.source,
    //            regexLiteralRegex.source
    //        ].join('|') + ')',
    //        expressionRegex.source,
    //        invalidCharsRegex.source
    //    ].join('|'), 'g');
    //#endregion
    var preprocessRegex = /(<!--(?:(?!-->)[\s\S])*-->)|(\\\\|\\\{)|\{(?:([@#%])([a-z](?:-?[\w]+)*)\s+|(=)?)(?:((?:\\\\|\\\}|(["'])(?:(?!\7|[\r\n\u2028\u2029\\])[\s\S]|\\(?:['"\\bfnrtv]|[^'"\\bfnrtv\dxu\r\n\u2028\u2029]|0|x[\da-fA-F]{2}|u[\da-fA-F]{4})|\\(?:[\r\n\u2028\u2029]|\r\n))*\7|[^}])*))?\}/ig;
    var indexOrIdRegex = /^:?\d+$/;
    var keyPathTailRegex = /(?:\.|^)[^.]+$/;

    var expressionInStringRegex = /(\\\\|\\\{|\\\})|\{((?:[a-z$_][\w$]*|:\d+)(?:\.(?:[a-z$_][\w$]*|:\d+)|\[\d+\])*)\}/ig;

    var isExpressionRegex = /^(?:[a-z$_][\w$]*)(?:\.[a-z$_][\w$]*)*$/i;
    var compoundExpressionRegex = /(\b(?:typeof|instanceof|new|null|true|false)\b|(["'])(?:(?!\2|[\r\n\u2028\u2029\\])[\s\S]|\\(?:['"\\bfnrtv]|[^'"\\bfnrtv\dxu\r\n\u2028\u2029]|0|x[\da-fA-F]{2}|u[\da-fA-F]{4})|\\(?:[\r\n\u2028\u2029]|\r\n))*\2|(?:(?:(?:0|[1-9]\d*)(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|0[xX][\da-fA-F]+)|(?:\/(?:[^\r\n\u2028\u2029*/\[\\]|\\[^\r\n\u2028\u2029]|\[(?:[^\r\n\u2028\u2029\]\\]|\\[^\r\n\u2028\u2029])*\])(?:[^\r\n\u2028\u2029/\[\\]|\\[^\r\n\u2028\u2029]|\[(?:[^\r\n\u2028\u2029\]\\]|\\[^\r\n\u2028\u2029])*\])*\/[gimy]{0,4}))|(\.\s*)?([a-zA-Z$_][\w$_]*(?:\s*\.\s*[a-zA-Z$_][\w$_]*)*)(?!\s*[\(\w$_])|(\{)/g;
    var expressionInParsedCompoundRegex = /(["'])(?:(?!\1|[\r\n\u2028\u2029\\])[\s\S]|\\(?:['"\\bfnrtv]|[^'"\\bfnrtv\dxu\r\n\u2028\u2029]|0|x[\da-fA-F]{2}|u[\da-fA-F]{4})|\\(?:[\r\n\u2028\u2029]|\r\n))*\1|\{((?:[\w$]+|:\d+)(?:\.(?:[\w$]+|:\d+))*)\}/ig;
    var escapedRegex = /\\(\\|\{|\})/g;

    (function (DataChangeType) {
        DataChangeType[DataChangeType["set"] = 0] = "set";
        DataChangeType[DataChangeType["insert"] = 1] = "insert";
        DataChangeType[DataChangeType["remove"] = 2] = "remove";
        DataChangeType[DataChangeType["clear"] = 3] = "clear";
    })(Drop.DataChangeType || (Drop.DataChangeType = {}));
    var DataChangeType = Drop.DataChangeType;

    function expressionToKeys(expression) {
        return expression.replace(/\s+/g, '').split('.');
    }

    function getKeysLength(keys) {
        var length = keys.length;
        keys.some(function (key) {
            if (key == 'this') {
                length--;
            } else {
                return true;
            }
        });
        return length;
    }

    function removePreThis(keys) {
        var hasPreThis = false;
        while (keys[0] == 'this') {
            keys.shift();
            hasPreThis = true;
        }
        return hasPreThis;
    }

    var Data = (function (_super) {
        __extends(Data, _super);
        function Data(data) {
            _super.call(this);
            this._data = Data._wrap(data);
        }
        Data.prototype.getIdKeysInfo = function (keys) {
            return Data._getIdKeysInfo(this._data, keys);
        };

        Data.prototype.get = function (keys) {
            return Data._unwrap(Data._get(this._data, keys, true));
        };

        Data.prototype.existsKeyInScope = function (scopeKeys, key) {
            return Data._existsKey(Data._get(this._data, scopeKeys), key);
        };

        Data._existsKey = function (data, key) {
            if (data == null) {
                return false;
            }

            if (data instanceof XArray && indexOrIdRegex.test(key)) {
                if (key[0] == ':') {
                    var id = Number(key.substr(1));
                    return data.existsId(id);
                }

                var index = Number(key);
                return data.id(index) != null;
            } else if (data instanceof Object) {
                return key in data;
            } else {
                return data[key] !== undefined;
            }
        };

        Data._getIdKeysInfo = function (data, keys) {
            var idKeys = [];
            var key;
            var i = 0;

            for (i; i < keys.length - 1; i++) {
                key = keys[i];
                if (data instanceof XArray && indexOrIdRegex.test(key)) {
                    var index;
                    var id;

                    if (key[0] == ':') {
                        id = Number(key.substr(1));
                    } else {
                        index = Number(key);
                        id = data.id(index);
                    }

                    if (id == null) {
                        data = null;
                        idKeys.push(key);
                    } else {
                        data = data.itemById(id);
                        idKeys.push(':' + id);
                    }
                } else {
                    data = data[key];
                    idKeys.push(key);
                }

                if (data == null) {
                    return {
                        keys: i == 0 ? null : idKeys.concat(keys.slice(i + 1)),
                        value: undefined
                    };
                }
            }

            var value;
            key = keys[i];

            if (data instanceof XArray && indexOrIdRegex.test(key)) {
                var index;
                var id;

                if (key[0] == ':') {
                    id = Number(key.substr(1));
                } else {
                    index = Number(key);
                    id = data.id(index);
                }

                if (id == null) {
                    idKeys.push(key);
                    value = undefined;
                } else {
                    idKeys.push(':' + id);
                    value = data.itemById(id);
                }
            } else {
                idKeys.push(key);
                value = data[key];
            }

            return {
                keys: idKeys,
                value: value
            };
        };

        Data._get = function (data, keys, getInGlobal) {
            if (typeof getInGlobal === "undefined") { getInGlobal = false; }
            var key = keys[0];
            var i = 0;

            if (getInGlobal && !(data instanceof XArray && indexOrIdRegex.test(key)) && !(key in data)) {
                data = window;
                for (i; i < keys.length - 1; i++) {
                    var key = keys[i];
                    data = data[key];

                    if (data == null) {
                        return undefined;
                    }
                }

                key = keys[i];
                return data[key];
            }

            for (i; i < keys.length - 1; i++) {
                key = keys[i];
                if (data instanceof XArray && indexOrIdRegex.test(key)) {
                    var index;
                    var id;

                    if (key[0] == ':') {
                        id = Number(key.substr(1));
                        if (!data.existsId(id)) {
                            id = null;
                        }
                    } else {
                        index = Number(key);
                        id = data.id(index);
                    }

                    if (id == null) {
                        return undefined;
                    } else {
                        data = data.itemById(id);
                    }
                } else {
                    data = data[key];
                }

                if (data == null) {
                    return undefined;
                }
            }

            key = keys[i];

            if (data instanceof XArray && indexOrIdRegex.test(key)) {
                var index;
                var id;

                if (key[0] == ':') {
                    id = Number(key.substr(1));
                    if (!data.existsId(id)) {
                        id = null;
                    }
                } else {
                    index = Number(key);
                    id = data.id(index);
                }

                if (id == null) {
                    return undefined;
                }

                return data.itemById(id);
            } else {
                return data[key];
            }
        };

        Data.prototype.set = function (keys, value) {
            var _this = this;
            var data = this._data;

            var pathsHash = new StringHash();
            var paths = [];

            var indexPath = '';
            var idPath = '';

            var key;
            var i = 0;

            for (i; i < keys.length - 1; i++) {
                key = keys[i];
                if (data instanceof XArray) {
                    if (!indexOrIdRegex.test(key)) {
                        throw new TypeError('[drop] can not set "' + key + '" on array "' + keys.slice(0, i) + '"');
                    }

                    var index;
                    var id;

                    if (key[0] == ':') {
                        id = Number(key.substr(1));
                        if (!data.existsId(id)) {
                            id = null;
                        }
                    } else {
                        index = Number(key);
                        id = data.id(index);
                    }

                    indexPath += '[]';
                    idPath += '.:' + id;

                    if (id == null) {
                        data = null;
                    } else {
                        data = data.item(id);
                    }
                } else {
                    data = data[key];

                    indexPath += indexPath ? '.' + key : key;
                    idPath += idPath ? '.' + key : key;
                }

                if (data == null) {
                    throw new TypeError('[drop] can not set value because "' + keys.slice(0, i).join('.') + '" is null or undefined');
                }
                //if (!pathsHash.exists(indexPath)) {
                //    pathsHash.set(indexPath);
                //    paths.unshift(indexPath);
                //}
                //if (!pathsHash.exists(idPath)) {
                //    pathsHash.set(idPath);
                //    paths.unshift(idPath);
                //}
            }

            var oldValue;
            key = keys[i];

            if (data instanceof XArray) {
                if (!indexOrIdRegex.test(key)) {
                    throw new Error('[drop] can not set "' + key + '" on array "' + keys.slice(0, i) + '"');
                }

                var index;
                var id;

                if (key[0] == ':') {
                    id = Number(key.substr(1));
                    if (!data.existsId(id)) {
                        throw new TypeError('[drop] can not set because "' + keys.slice(0, i) + '" does not have item with id ' + id);
                    }
                } else {
                    index = Number(key);
                    id = data.id(index);
                }

                if (id == null) {
                    throw new TypeError('[drop] can not set because "' + keys.slice(0, i) + '" does not have item with index ' + key);
                }

                oldValue = data.itemById(id);
                data.setById(id, Data._wrap(value));

                indexPath += '[]';
                idPath += '.:' + id;
            } else {
                oldValue = data[key];
                data[key] = Data._wrap(value);

                indexPath += indexPath ? '.' + key : key;
                idPath += idPath ? '.' + key : key;
            }

            if (!pathsHash.exists(indexPath)) {
                pathsHash.set(indexPath);
                paths.unshift(indexPath);
            }

            if (!pathsHash.exists(idPath)) {
                pathsHash.set(idPath);
                paths.unshift(idPath);
            }

            oldValue = Data._unwrap(oldValue);

            var changeEventData;

            paths.forEach(function (path) {
                changeEventData = {
                    changeType: 0 /* set */,
                    keys: keys,
                    oldValue: oldValue,
                    value: value
                };
                _this.trigger('change:' + path, changeEventData);
            });

            changeEventData = {
                changeType: 0 /* set */,
                keys: keys,
                oldValue: oldValue,
                value: value
            };
            this.trigger('change', changeEventData);
        };

        Data._wrap = function (data) {
            if (data instanceof Array) {
                var xArr = new XArray(data);

                xArr.range().forEach(function (item, i) {
                    xArr.set(i, Data._wrap(item));
                });

                return xArr;
            }

            if (data instanceof Object && typeof data != 'function') {
                var wrapped = {};

                for (var key in data) {
                    if (hop.call(data, key)) {
                        wrapped[key] = Data._wrap(data[key]);
                    }
                }

                return wrapped;
            }

            return data;
        };

        Data._unwrap = function (data) {
            if (data instanceof XArray) {
                var arr = data.range();
                return arr.map(function (item) {
                    return Data._unwrap(item);
                });
            }

            if (data instanceof Object && typeof data != 'function') {
                var unwrapped = {};

                for (var key in data) {
                    if (hop.call(data, key)) {
                        unwrapped[key] = Data._unwrap(data[key]);
                    }
                }

                return unwrapped;
            }

            return data;
        };
        return Data;
    })(EventHost);
    Drop.Data = Data;

    var DecoratorDefinition = (function () {
        function DecoratorDefinition(type, name, oninitialize, onchange, ondispose) {
            this.type = type;
            this.name = name;
            this.oninitialize = oninitialize;
            this.onchange = onchange;
            this.ondispose = ondispose;
        }
        DecoratorDefinition.prototype.initialize = function (decorator) {
            if (decorator.initialized && decorator.type == 'modifier') {
                decorator.scope.dispose(true);
            }

            if (this.oninitialize) {
                this.oninitialize(decorator);
            } else {
                this.onchange(decorator, null);
            }
            decorator.initialized = true;
        };

        DecoratorDefinition.prototype.change = function (decorator, args) {
            this.onchange(decorator, args);
        };

        DecoratorDefinition.prototype.invoke = function (decorator, args) {
            if (decorator.initialized) {
                this.change(decorator, args);
            } else {
                this.initialize(decorator);
            }
        };

        DecoratorDefinition.prototype.dispose = function (decorator) {
            if (this.ondispose) {
                this.ondispose(decorator);
            }
        };

        DecoratorDefinition.register = function (decorator) {
            switch (decorator.type) {
                case 'modifier':
                    DecoratorDefinition._modifiersMap.set(decorator.name, decorator);
                    break;
                case 'processor':
                    DecoratorDefinition._processorsMap.set(decorator.name, decorator);
                    break;
                case 'attribute':
                    DecoratorDefinition._attribute = decorator;
                    break;
                case 'html':
                    DecoratorDefinition._html = decorator;
                    break;
                case 'text':
                    DecoratorDefinition._text = decorator;
                    break;
                default:
                    throw new Error('[drop] invalid decorator type "' + decorator.type + '"');
            }
        };

        DecoratorDefinition.getDefinition = function (type, name) {
            switch (type) {
                case 'modifier':
                    return DecoratorDefinition._modifiersMap.get(name);
                case 'processor':
                    return DecoratorDefinition._processorsMap.get(name);
                case 'attribute':
                    return DecoratorDefinition._attribute;
                case 'html':
                    return DecoratorDefinition._html;
                case 'text':
                    return DecoratorDefinition._text;
                default:
                    throw new Error('[drop] invalid decorator type "' + type + '"');
            }
        };
        DecoratorDefinition._modifiersMap = new StringMap();
        DecoratorDefinition._processorsMap = new StringMap();

        DecoratorDefinition.typeToMark = {
            'modifier': '#',
            'processor': '%',
            'attribute': '@',
            'html': '=',
            'text': ''
        };
        return DecoratorDefinition;
    })();
    Drop.DecoratorDefinition = DecoratorDefinition;

    var ModifierDefinition = (function (_super) {
        __extends(ModifierDefinition, _super);
        function ModifierDefinition(name, oninitialize, onchange) {
            _super.call(this, 'modifier', name, oninitialize, onchange);
            this.oninitialize = oninitialize;
            this.onchange = onchange;
        }
        ModifierDefinition.prototype._onscopechange = function (decorator, args) {
            var scope = decorator.scope;
            scope.dispose(true);
            //scope.modifier.invoke(null);
            //scope.decorators.forEach(decorator => {
            //    decorator.invoke(null);
            //});
        };

        ModifierDefinition.prototype.change = function (decorator, args) {
            this._onscopechange(decorator, args);
            this.onchange(decorator, args);
        };
        return ModifierDefinition;
    })(DecoratorDefinition);
    Drop.ModifierDefinition = ModifierDefinition;

    var ProcessorDefinition = (function (_super) {
        __extends(ProcessorDefinition, _super);
        function ProcessorDefinition(name, oninitialize, onchange) {
            _super.call(this, 'processor', name, oninitialize, onchange);
            this.oninitialize = oninitialize;
            this.onchange = onchange;
        }
        return ProcessorDefinition;
    })(DecoratorDefinition);
    Drop.ProcessorDefinition = ProcessorDefinition;

    var DecoratorTarget = (function () {
        function DecoratorTarget(nodes) {
            if (typeof nodes === "undefined") { nodes = []; }
            this.nodes = nodes;
            this._comment = document.createComment('decorator target');
        }
        DecoratorTarget.prototype.each = function (handler) {
            this.nodes.forEach(function (node, index) {
                return handler(node, index);
            });
        };

        DecoratorTarget.prototype.replaceWith = function (nodes) {
            var prevNodes = this.nodes;

            var replaceTarget;

            if (prevNodes.length) {
                for (var i = 1; i < prevNodes.length; i++) {
                    var node = prevNodes[i];
                    node.parentNode.removeChild(node);
                }

                replaceTarget = prevNodes[0];
            } else {
                replaceTarget = this._comment;
            }

            var fragment;

            if (nodes instanceof DocumentFragment) {
                this.nodes = slice.call(nodes.childNodes);
                fragment = nodes;
            } else {
                if (!(nodes instanceof Array || nodes instanceof NodeList)) {
                    nodes = nodes ? [nodes] : [];
                }

                fragment = document.createDocumentFragment();

                this.nodes = slice.call(nodes);
                this.each(function (node) {
                    fragment.appendChild(node);
                });
            }

            if (!this.nodes.length) {
                fragment = this._comment;
            }

            replaceTarget.parentNode.replaceChild(fragment, replaceTarget);
        };
        return DecoratorTarget;
    })();
    Drop.DecoratorTarget = DecoratorTarget;

    var Decorator = (function () {
        function Decorator(target, type, name, scope, expression) {
            this.target = target;
            this.type = type;
            this.name = name;
            this.scope = scope;
            this.initialized = false;
            this._scopeListenerTypes = [];
            this._listenerTypes = [];
            this._prepared = false;
            this.definition = DecoratorDefinition.getDefinition(type, name);

            if (!this.definition) {
                throw new TypeError('[drop] unknown decorator "' + DecoratorDefinition.typeToMark[type] + name + '" (' + type + ')');
            }

            this._expression = expression;

            try  {
                this._value = JSON.parse(expression);
                this._isValue = true;
            } catch (e) {
                this._isValue = false;
                if (isExpressionRegex.test(expression)) {
                    var expKeys = expressionToKeys(this._expression);
                    this._expressionKeys = expKeys;
                } else {
                    this._isCompound = true;
                }
            }

            if (scope) {
                this.prepareDependencies();
            }
        }
        Object.defineProperty(Decorator.prototype, "expression", {
            get: function () {
                return this._expression;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Decorator.prototype, "expressionKeys", {
            get: function () {
                return this._expressionKeys;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Decorator.prototype, "expressionFullIdKeys", {
            get: function () {
                return this._expressionFullIdKeys;
            },
            enumerable: true,
            configurable: true
        });

        Decorator.prototype.prepareDependencies = function () {
            var _this = this;
            if (this._prepared) {
                return;
            }

            this._prepared = true;

            var scope = this.scope;
            var data = scope.data;

            var scopeDependencies = [];
            var dependencies = [];

            if (this._isValue) {
                var value = this._value;

                if (typeof value == 'string') {
                    var sInfo = this._getStringDependenciesInfo(value);
                    this._value = sInfo.stringWithFullKeys;

                    //console.log(this._value);
                    scopeDependencies = sInfo.scopeDependencies;
                    dependencies = sInfo.dependencies;
                }
            } else if (this._isCompound) {
                var expression = this._expression;

                var value;
                try  {
                    value = eval('(' + expression + ')');
                } catch (e) {
                    if (e instanceof SyntaxError) {
                        throw new Error('[drop] expression syntax error: ' + e.message);
                    }
                }

                var eInfo = this._getExpressionDependenciesInfo(expression);
                this._compoundExpression = eInfo.expressionWithFullKeys;
                scopeDependencies = eInfo.scopeDependencies;
                dependencies = eInfo.dependencies;

                if (!dependencies.length && !scopeDependencies.length) {
                    this._isValue = true;
                    this._value = value;
                }
            } else {
                var expKeys = this._expressionKeys.concat();
                var keysLength = getKeysLength(expKeys);

                var fullIdKeys = scope.getFullIdKeys(expKeys);

                if (fullIdKeys) {
                    this._expressionFullIdKeys = fullIdKeys;

                    if (fullIdKeys[0] == 'this') {
                        scopeDependencies.push(fullIdKeys[1]);
                    } else {
                        for (var i = 0; i < keysLength; i++) {
                            dependencies.push(fullIdKeys.slice(0, fullIdKeys.length - i).join('.'));
                        }
                    }
                } else {
                    this._isValue = true;

                    try  {
                        this._value = eval('(' + this._expression + ')');
                    } catch (e) {
                    }
                }
            }

            var listener = function (arg) {
                _this.invoke(arg, false);
            };

            var listenerTypes;

            if (scopeDependencies.length) {
                listenerTypes = this._scopeListenerTypes;

                scopeDependencies.forEach(function (dependency) {
                    var type = 'change:' + dependency;
                    scope.on(type, listener);
                    listenerTypes.push(type);
                });
            }

            if (dependencies.length) {
                listenerTypes = this._listenerTypes;

                dependencies.forEach(function (dependency) {
                    var type = 'change:' + dependency;
                    data.on(type, listener);
                    listenerTypes.push(type);
                });
            }

            this._listener = listener;
        };

        Decorator.prototype.invoke = function (arg, sync) {
            var _this = this;
            if (typeof sync === "undefined") { sync = true; }
            if (sync) {
                var definition = this.definition;
                definition.invoke(this, args);
                return;
            }

            var args = this._pendingChangeDataArgs;
            if (args) {
                args.push(arg);
            } else {
                var args = [arg];
                this._pendingChangeDataArgs = args;

                nextTick(function () {
                    var definition = _this.definition;
                    definition.invoke(_this, args);
                    _this._pendingChangeDataArgs = null;
                });
            }
        };

        Decorator.prototype.initialize = function () {
            this.definition.initialize(this);
        };

        Decorator.prototype.dispose = function () {
            var definition = this.definition;

            definition.dispose(this);

            var listener = this._listener;

            // scope data
            var scope = this.scope;

            this._scopeListenerTypes.forEach(function (type) {
                scope.off(type, listener);
            });

            this._scopeListenerTypes = [];

            // data
            var data = scope.data;

            this._listenerTypes.forEach(function (type) {
                data.off(type, listener);
            });

            this._listenerTypes = [];
        };

        Object.defineProperty(Decorator.prototype, "expressionValue", {
            get: function () {
                if (this._isValue) {
                    var value = this._value;
                    if (typeof value == 'string') {
                        if (this._listenerTypes.length) {
                            return this.scope.evaluateString(value, true);
                        } else {
                            return value.replace(escapedRegex, '$1');
                        }
                    } else {
                        return value;
                    }
                } else if (this._isCompound) {
                    return this.scope.evaluateExpression(this._compoundExpression, true);
                } else {
                    return this.scope.evaluate(this._expressionFullIdKeys, true);
                }
            },
            enumerable: true,
            configurable: true
        });

        Decorator.prototype._getStringDependenciesInfo = function (str) {
            var scopeHash = new StringHash();
            var hash = new StringHash();

            var scope = this.scope;

            str = str.replace(expressionInStringRegex, function (m, escapedToSkip, expression) {
                if (escapedToSkip) {
                    return m;
                }

                var keys = expressionToKeys(expression);
                var keysLength = getKeysLength(keys) || 1;

                var fullIdKeys = scope.getFullIdKeys(keys);

                if (fullIdKeys) {
                    var fullExpression = fullIdKeys.join('.');

                    if (fullIdKeys[0] == 'this') {
                        scopeHash.set(fullIdKeys[1]);
                    } else {
                        for (var i = 0; i < keysLength; i++) {
                            hash.set(fullIdKeys.slice(0, fullIdKeys.length - i).join('.'));
                        }
                    }

                    return '{' + fullExpression + '}';
                } else {
                    return eval('(' + expression + ')');
                }
            });

            return {
                scopeDependencies: scopeHash.keys,
                dependencies: hash.keys,
                stringWithFullKeys: str
            };
        };

        Decorator.prototype._getExpressionDependenciesInfo = function (compoundExpression) {
            var scopeHash = new StringHash();
            var hash = new StringHash();
            var scope = this.scope;

            var parsed = compoundExpression.replace(compoundExpressionRegex, function (m, literal, quote, previous, expression, curlyBra) {
                if (literal || previous) {
                    return m;
                }

                if (curlyBra) {
                    throw new SyntaxError('[drop] expression does not support object notation');
                }

                var keys = expressionToKeys(expression);
                var keysLength = getKeysLength(keys) || 1;

                var fullIdKeys = scope.getFullIdKeys(keys);

                if (fullIdKeys) {
                    var fullExpression = fullIdKeys.join('.');

                    if (fullIdKeys[0] == 'this') {
                        scopeHash.set(fullIdKeys[1]);
                    } else {
                        for (var i = 0; i < keysLength; i++) {
                            hash.set(fullIdKeys.slice(0, fullIdKeys.length - i).join('.'));
                        }
                    }

                    return '{' + fullExpression + '}';
                } else {
                    // global scope
                    return m;
                }
            });

            //console.log(parsed);
            return {
                scopeDependencies: scopeHash.keys,
                dependencies: hash.keys,
                expressionWithFullKeys: parsed
            };
        };
        return Decorator;
    })();
    Drop.Decorator = Decorator;

    var Scope = (function (_super) {
        __extends(Scope, _super);
        function Scope(fragmentTemplate, modifier, parentScope, data, scopeKeys, scopeData) {
            if (typeof scopeData === "undefined") { scopeData = {}; }
            _super.call(this);
            this.fragmentTemplate = fragmentTemplate;
            this.modifier = modifier;
            this.parentScope = parentScope;
            this.childScopes = [];
            this.decorators = [];
            this._fullScopeKeysSet = false;

            if (parentScope) {
                this._data = parentScope._data;
                parentScope.childScopes.push(this);
            } else {
                this._data = data;
            }

            if (scopeKeys) {
                this._setFullScopeKeys(scopeKeys);
            }

            if (scopeData) {
                this._scopeData = scopeData;
            }

            if (modifier) {
                modifier.scope = this;

                var expKeys = modifier.expressionKeys;

                if (!expKeys) {
                    throw new TypeError('[drop] the expression passing to a modifier has to be a scope, can not be "' + modifier.expression + '"');
                }

                this._setFullScopeKeys(expKeys);

                modifier.prepareDependencies();
                modifier.invoke(null);
            } else {
                this._setFullScopeKeys();
                this.initialize();
            }
        }
        Object.defineProperty(Scope.prototype, "data", {
            get: function () {
                return this._data;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Scope.prototype, "fragment", {
            get: function () {
                var fragment = document.createDocumentFragment();
                var div = this._fragmentDiv;

                var nodes = div ? slice.call(div.childNodes) : [];

                nodes.forEach(function (node) {
                    fragment.appendChild(node);
                });

                return fragment;
            },
            enumerable: true,
            configurable: true
        });

        Scope.prototype.initialize = function () {
            var fragmentDiv = this.fragmentTemplate.cloneNode(true);

            var decorators = [];

            var dropEles = fragmentDiv.getElementsByTagName('drop');

            while (dropEles.length) {
                var dropEle = dropEles[0];
                var decoratorName = dropEle.getAttribute('name');
                var type = dropEle.getAttribute('type');

                switch (type) {
                    case 'modifier':
                        var nested = document.createElement('div');

                        var target = dropEle;

                        while (true) {
                            target = dropEle.nextElementSibling;

                            if (!target) {
                                throw new SyntaxError('[drop] expecting decorator target');
                            }

                            nested.appendChild(target);
                            if (target.tagName != 'DROP') {
                                break;
                            }
                        }

                        var commentEle = document.createComment('{#' + decoratorName + '}');

                        var parentNode = dropEle.parentNode;

                        parentNode.replaceChild(commentEle, dropEle);

                        var modifier = new Decorator(new DecoratorTarget([commentEle]), type, decoratorName, null, dropEle.textContent);

                        var scope = new Scope(nested, modifier, this);
                        break;
                    default:
                        var target = dropEle;

                        var decoratorTarget;

                        if ('decoratorTarget' in target) {
                            decoratorTarget = target['decoratorTarget'];
                            delete target['decoratorTarget'];
                        } else {
                            decoratorTarget = new DecoratorTarget();

                            while (true) {
                                target = target.nextElementSibling;

                                if (!target) {
                                    throw new SyntaxError('[drop] expecting decorator target');
                                }

                                if (target.tagName == 'DROP') {
                                    if (target.getAttribute('type') == 'modifier') {
                                        throw new SyntaxError('[drop] modifier ({#...}) has to be the first decorator');
                                    }

                                    if (!('decoratorTarget' in target)) {
                                        target['decoratorTarget'] = decoratorTarget;
                                    }
                                } else {
                                    if (!decoratorTarget.nodes.length) {
                                        decoratorTarget.nodes.push(target);
                                    }
                                    break;
                                }
                            }
                        }

                        dropEle.parentNode.removeChild(dropEle);

                        decorators.push(new Decorator(decoratorTarget, type, dropEle.getAttribute('name'), this, dropEle.textContent));

                        break;
                }
            }

            this._fragmentDiv = fragmentDiv;

            this.decorators = decorators;

            decorators.forEach(function (decorator) {
                decorator.invoke(null);
            });
        };

        Object.defineProperty(Scope.prototype, "fullScopeKeys", {
            get: function () {
                return this._fullScopeKeys.concat();
            },
            enumerable: true,
            configurable: true
        });

        Scope.prototype._setFullScopeKeys = function (scopeKeys) {
            if (this._fullScopeKeysSet) {
                return;
            }

            this._fullScopeKeysSet = true;

            if (scopeKeys) {
                removePreThis(scopeKeys);

                if (scopeKeys.length) {
                    var data = this._data;
                    var key = scopeKeys[0];

                    var scope = this;

                    while (scope = scope.parentScope) {
                        var fullScopeKeys = scope._fullScopeKeys;

                        if (!fullScopeKeys) {
                            continue;
                        }

                        if (data.existsKeyInScope(fullScopeKeys, key)) {
                            var info = data.getIdKeysInfo(fullScopeKeys.concat(scopeKeys));
                            if (info.value != null) {
                                this._fullScopeKeys = info.keys;
                                return;
                            }
                        }
                    }

                    var info = data.getIdKeysInfo(scopeKeys);
                    if (info.value != null) {
                        this._fullScopeKeys = info.keys;
                        return;
                    }
                }
            }

            this._fullScopeKeys = null;
        };

        Scope.prototype.setScopeData = function (key, value) {
            var scopeData = this._scopeData;
            if (!hop.call(scopeData, key) || scopeData[key] != value) {
                scopeData[key] = value;
                this.trigger('change:' + key);
            }
        };

        Scope.prototype.getFullIdKeys = function (keys) {
            keys = keys.concat();

            var hasPreThis = removePreThis(keys);
            var key = keys[0];

            var scopeData = this._scopeData;

            if (keys.length == 1) {
                if (hop.call(scopeData, key)) {
                    return ['this', key];
                }
            }

            var scope = this;
            var data = this.data;

            if (!keys.length) {
                do {
                    var fullScopeKeys = scope._fullScopeKeys;
                    if (fullScopeKeys) {
                        return fullScopeKeys;
                    }
                } while(scope = scope.parentScope);

                return [];
            }

            do {
                var fullScopeKeys = scope._fullScopeKeys;

                if (!fullScopeKeys) {
                    continue;
                }

                if (data.existsKeyInScope(fullScopeKeys, key)) {
                    return data.getIdKeysInfo(fullScopeKeys.concat(keys)).keys;
                }

                if (hasPreThis) {
                    return fullScopeKeys.concat(keys);
                }
            } while(scope = scope.parentScope);

            return data.getIdKeysInfo(keys).keys;
        };

        Scope.prototype.evaluate = function (keys, isFullKeys) {
            if (typeof isFullKeys === "undefined") { isFullKeys = false; }
            var key = keys[0];

            if (isFullKeys) {
                if (key == 'this') {
                    return this._scopeData[keys[1]];
                }
                return this.data.get(keys);
            }

            keys = keys.concat();

            var hasPreThis = removePreThis(keys);

            var scope = this;
            var data = this.data;

            if (!keys.length) {
                do {
                    var fullScopeKeys = scope._fullScopeKeys;
                    if (fullScopeKeys) {
                        return data.get(fullScopeKeys);
                    }
                } while(scope = scope.parentScope);

                return undefined;
            }

            do {
                var fullScopeKeys = scope._fullScopeKeys;
                if (!fullScopeKeys) {
                    continue;
                }

                if (data.existsKeyInScope(fullScopeKeys, key)) {
                    return data.get(fullScopeKeys.concat(keys));
                }

                if (hasPreThis) {
                    return undefined;
                }
            } while(scope = scope.parentScope);

            return data.get(keys);
        };

        Scope.prototype.evaluateString = function (str, isFullKeys) {
            var _this = this;
            if (typeof isFullKeys === "undefined") { isFullKeys = false; }
            return str.replace(expressionInStringRegex, function (m, escapedToSkip, expression) {
                if (escapedToSkip) {
                    return escapedToSkip[1];
                }

                var value = _this.evaluate(expressionToKeys(expression), isFullKeys);
                if (value == null) {
                    return m;
                } else {
                    return value;
                }
            });
        };

        Scope.prototype.evaluateExpression = function (expression, isFullKeys) {
            var _this = this;
            if (typeof isFullKeys === "undefined") { isFullKeys = false; }
            expression = expression.replace(expressionInParsedCompoundRegex, function (m, quotePlaceHolder, expression) {
                if (!expression) {
                    return m;
                }

                var value = _this.evaluate(expressionToKeys(expression), isFullKeys);
                var json = JSON.stringify(value);

                if (!json) {
                    json = 'undefined';
                } else if (json[0] == '{') {
                    json = '(' + json + ')';
                }

                return json;
            });

            //console.log('eval:', expression);
            return eval('(' + expression + ')');
        };

        Scope.prototype.dispose = function (skipModifier) {
            if (typeof skipModifier === "undefined") { skipModifier = false; }
            if (!skipModifier) {
                var modifier = this.modifier;
                if (modifier) {
                    modifier.dispose();
                }
            }

            this.decorators.forEach(function (decorator) {
                decorator.dispose();
            });

            this.childScopes.forEach(function (scope) {
                scope.dispose();
            });
        };
        return Scope;
    })(EventHost);
    Drop.Scope = Scope;

    var Template = (function () {
        function Template(tpl, data) {
            var fragmentDivsMap = Template._fragmentDivsMap;
            var fragmentDiv = fragmentDivsMap.get(tpl);

            if (!fragmentDiv) {
                fragmentDiv = Template.parse(tpl);
                fragmentDivsMap.set(tpl, fragmentDiv);
            }

            fragmentDiv = fragmentDiv.cloneNode(true);

            this.scope = new Scope(fragmentDiv, null, null, data);
        }
        Template.prototype.appendTo = function (node) {
            node.appendChild(this.scope.fragment);
        };

        Template._htmlEncode = function (text) {
            return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        };

        Template.apply = function (templateId, data, target) {
            var templateText = document.getElementById(templateId).textContent;
            var template = new Drop.Template(templateText, data);
            template.appendTo(target);
            return template;
        };

        Template.parse = function (tpl) {
            tpl = tpl.replace(preprocessRegex, function (m, commentToSkip, escapedToSkip, typeMarker, name, typeMarker2, expansion) {
                if (commentToSkip) {
                    return commentToSkip;
                }

                if (escapedToSkip) {
                    return escapedToSkip[1];
                }

                expansion = expansion ? expansion.replace(/\{\{/g, '{').replace(/\}\}/g, '}').trim() : '';

                var expression = Template._htmlEncode(expansion);

                switch (typeMarker) {
                    case '@':
                        // attribute
                        return '<drop type="attribute" name="' + name + '">' + expression + '</drop>';
                    case '#':
                        // modifier
                        return '<drop type="modifier" name="' + name + '">' + expression + '</drop>';
                    case '%':
                        // processor
                        return '<drop type="processor" name="' + name + '">' + expression + '</drop>';
                    default:
                        if (typeMarker2) {
                            // html
                            return '<drop type="html">' + expression + '</drop><drop:wrapper></drop:wrapper>';
                        } else {
                            // text
                            return '<drop type="text">' + expression + '</drop><drop:wrapper></drop:wrapper>';
                        }
                }
            });

            var fragment = document.createElement('div');
            fragment.innerHTML = tpl;

            //console.log(fragment);
            return fragment;
        };
        Template._fragmentDivsMap = new StringMap();
        return Template;
    })();
    Drop.Template = Template;
})(Drop || (Drop = {}));
var Drop;
(function (Drop) {
    // @attribute
    var attributeDefinition = new Drop.DecoratorDefinition('attribute', null);

    attributeDefinition.onchange = function (decorator, args) {
        decorator.target.each(function (target) {
            if (target.setAttribute) {
                target.setAttribute(decorator.name, decorator.expressionValue);
            }
        });
    };

    Drop.DecoratorDefinition.register(attributeDefinition);

    // =html
    var htmlDefinition = new Drop.DecoratorDefinition('html', null);

    htmlDefinition.onchange = function (decorator, args) {
        var value = decorator.expressionValue;
        if (value === undefined) {
            value = '';
        }

        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = value;

        decorator.target.replaceWith(tempDiv.childNodes);
    };

    Drop.DecoratorDefinition.register(htmlDefinition);

    // text
    var textDefinition = new Drop.DecoratorDefinition('text', null);

    textDefinition.onchange = function (decorator, args) {
        var value = decorator.expressionValue;
        if (value === undefined) {
            value = '';
        }
        var textNode = document.createTextNode(value);
        decorator.target.replaceWith(textNode);
    };

    Drop.DecoratorDefinition.register(textDefinition);

    // #scope
    var scopeDefinition = new Drop.ModifierDefinition('scope');

    scopeDefinition.onchange = function (modifier) {
        var scope = modifier.scope;
        scope.initialize();
        modifier.target.replaceWith(scope.fragment);
    };

    Drop.DecoratorDefinition.register(scopeDefinition);

    // #each
    var eachDefinition = new Drop.ModifierDefinition('each');

    eachDefinition.oninitialize = function (modifier) {
        var scope = modifier.scope;

        var fragmentTemplate = scope.fragmentTemplate;

        var items = modifier.expressionValue;
        if (!items) {
            return;
        }

        var fragment = document.createDocumentFragment();

        for (var i = 0; i < items.length; i++) {
            var subScope = new Drop.Scope(fragmentTemplate.cloneNode(true), null, scope, null, [i.toString()], {
                index: i
            });
            fragment.appendChild(subScope.fragment);
        }

        modifier.target.replaceWith(fragment);
    };

    eachDefinition.onchange = function (modifier, args) {
        modifier.initialize();
        return;

        args.forEach(function (arg) {
            switch (arg.changeType) {
                case 0 /* set */:
                case 3 /* clear */:
                    modifier.initialize();
                    return;
            }
            // insert
            // remove
            // maybe move, etc...
        });
    };

    Drop.DecoratorDefinition.register(eachDefinition);

    // %bind-value
    // target limitation in the future?
    var bindValueDefinition = new Drop.ProcessorDefinition('bind-value');

    bindValueDefinition.oninitialize = function (processor) {
        var value = processor.expressionValue;
        var idKeys = processor.expressionFullIdKeys;

        processor.target.each(function (ele) {
            ele.value = value;
            ele.addEventListener('change', onchange);
            ele.addEventListener('input', onchange);
            ele.addEventListener('paste', onchange);
        });

        processor.data = {
            onchange: onchange
        };

        function onchange() {
            processor.scope.data.set(idKeys, this.value);
        }
    };

    bindValueDefinition.onchange = function (processor, args) {
        var value = processor.expressionValue;

        processor.target.each(function (ele) {
            ele.value = value;
        });
    };

    bindValueDefinition.ondispose = function (processor) {
        var onchange = processor.data.onchange;

        processor.target.each(function (ele) {
            ele.removeEventListener('change', onchange);
            ele.removeEventListener('input', onchange);
            ele.removeEventListener('paste', onchange);
        });
    };

    Drop.DecoratorDefinition.register(bindValueDefinition);

    // %click
    var clickDefinition = new Drop.ProcessorDefinition('click');

    clickDefinition.onchange = function (processor, args) {
        var onclick = processor.expressionValue;
        processor.target.each(function (ele) {
            ele.addEventListener('click', onclick);
        });
    };

    clickDefinition.ondispose = function (processor) {
        var onclick = processor.expressionValue;
        processor.target.each(function (ele) {
            ele.removeEventListener('click', onclick);
        });
    };

    Drop.DecoratorDefinition.register(clickDefinition);

    // %show
    var showDefinition = new Drop.ProcessorDefinition('show');

    showDefinition.onchange = function (processor, args) {
        var value = processor.expressionValue;
        processor.target.each(function (ele) {
            ele.style.display = value ? '' : 'none';
        });
    };

    Drop.DecoratorDefinition.register(showDefinition);
})(Drop || (Drop = {}));
/// <reference path="lib/drop.ts" />
/// <reference path="lib/decorators.ts" />
//# sourceMappingURL=index.js.map

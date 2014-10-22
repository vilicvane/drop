interface DropElement extends HTMLElement { }

interface Element {
    getElementsByTagName(name: 'drop'): NodeListOf<DropElement>;
}

'use strict';

module Drop {
    export var globalEval = eval;

    //#region Utils
    interface IDictionary<Value> {
        [key: string]: Value;
    }

    var hop = Object.prototype.hasOwnProperty;
    var slice = Array.prototype.slice;
    var splice = Array.prototype.splice;

    declare var setImmediate;

    interface INextTickTask {
        task: () => void;
        next: INextTickTask;
    }

    var nextTick = (() => {
        // linked list of tasks (single, with head node)
        var head: INextTickTask = {
            task: null,
            next: null
        };
        var tail = head;
        var flushing = false;
        var requestTick: () => void = null;

        function flush() {
            while (head.next) {
                head = head.next;
                var task = head.task;
                head.task = null;

                try {
                    task();
                } catch (e) {
                    setTimeout(function () {
                        throw e;
                    }, 0);
                }
            }

            flushing = false;
        }

        var nextTick = (task: () => void) => {
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
                requestTick = () => {
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

    function errorNextTick(e) {
        setTimeout(() => {
            throw e;
        }, 0);
    }

    class StringHash {
        private map: {
            [key: string]: void;
        } = {};

        get keys(): string[] {
            return Object.keys(this.map);
        }

        exists(key: string): boolean {
            return hop.call(this.map, key);
        }

        set(key: string) {
            this.map[key] = null;
        }

        unset(key: string) {
            delete this.map[key];
        }

        clear() {
            this.map = {};
        }
    }

    class StringMap<T> {
        private map: {
            [key: string]: T;
        } = {};

        get keys(): string[] {
            return Object.keys(this.map);
        }

        exists(key: string): boolean {
            return hop.call(this.map, key);
        }

        get(key: string, defaultValue?: T): T {
            if (hop.call(this.map, key)) {
                return this.map[key];
            } else if (arguments.length > 1) {
                this.map[key] = defaultValue;
                return defaultValue;
            } else {
                return undefined;
            }
        }

        set(key: string, value: T) {
            this.map[key] = value;
        }

        remove(key: string) {
            delete this.map[key];
        }

        clear() {
            this.map = {};
        }
    }

    class UniqueObjectArray<T> {
        private items: T[] = [];

        constructor(items: T[]= []) {
            items.forEach(item => {
                this.add(item);
            });
        }

        get length(): number {
            return this.items.length;
        }

        exists(item: T): boolean {
            return this.items.indexOf(item) >= 0;
        }

        add(item: T) {
            if (this.items.indexOf(item) < 0) {
                this.items.push(item);
            }
        }

        remove(item: T) {
            var index = this.items.indexOf(item);

            if (index >= 0) {
                this.items.splice(index, 1);
            }
        }

        toArray(): T[] {
            return this.items;
        }

    }

    export interface IEventListener<T> {
        (event: IEventData): T;
    }

    export interface IEventData {
        type?: string;
    }

    export class EventHost {
        private _events = new StringMap<UniqueObjectArray<IEventListener<any>>>();
        private _onceEvents = new StringMap<UniqueObjectArray<IEventListener<any>>>();

        on(type: string, listener: IEventListener<any>) {
            //console.log('on("' + type + '")');

            var listeners = this._events.get(type);

            if (!listeners) {
                listeners = new UniqueObjectArray<IEventListener<any>>();
                this._events.set(type, listeners);
            }

            listeners.add(listener);
        }

        once(type: string, listener: IEventListener<any>) {
            var listeners = this._events.get(type);

            if (listeners) {
                listeners.remove(listener);
            }

            listeners = this._onceEvents.get(type);

            if (!listeners) {
                listeners = new UniqueObjectArray<IEventListener<any>>();
                this._onceEvents.set(type, listeners);
            }

            listeners.add(listener);
        }

        off(type: string, listener: IEventListener<any>) {
            //console.log('off("' + type + '")');
            var listeners = this._events.get(type);

            if (listeners) {
                listeners.remove(listener);
            }

            listeners = this._onceEvents.get(type);

            if (listeners) {
                listeners.remove(listener);
            }
        }

        trigger(type: string, data: any = {}): boolean {
            data['type'] = type;

            var listeners = this._events.get(type);

            if (listeners) {
                return listeners.toArray()
                    .every(listener => listener.call(this, data) !== false);
            } else {
                return true;
            }
        }
    }
    //#endregion

    export class XArray {
        private _indexToId: number[];
        private _array: any[];
        private _nextId: number;

        constructor(array: any[] = []) {
            this._array = array;
            this._nextId = array.length;

            var indexToId = [];
            for (var i = 0; i < array.length; i++) {
                indexToId[i] = i;
            }

            this._indexToId = indexToId;
        }

        get length(): number {
            return this._indexToId.length;
        }

        id(index: number): number {
            return this._indexToId[index];
        }

        existsId(id: number): boolean {
            return id in this._array;
        }

        item(index: number): any {
            var id = this._indexToId[index];
            if (typeof id == 'number') {
                return this._array[id];
            }
        }

        itemById(id: number): any {
            var array = this._array;
            if (id in array) {
                return array[id];
            }
        }

        range(index = 0, length = Infinity): any[] {
            var ids: number[] = [];
            var indexToId = this._indexToId;

            length = Math.min(length, indexToId.length - index);

            for (var i = 0; i < length; i++) {
                ids.push(indexToId[index++]);
            }

            var array = this._array;

            return ids.map(id => array[id]);
        }

        add(item: any): number {
            var id = this._nextId;
            this._array[id] = item;
            this._indexToId.push(id);
            this._nextId++;
            return id;
        }

        set(index: number, value: any): number {
            var id = this._indexToId[index];
            if (typeof id == 'number') {
                this._array[id] = value;
                return id;
            }
        }

        setById(id: number, value: any): boolean {
            var array = this._array;
            if (id in array) {
                array[id] = value;
                return true;
            } else {
                return false;
            }
        }

        insert(items: any[], index = Infinity): number[]{
            var ids: number[] = [];
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
        }

        remove(index: number, length = 1): number[] {
            var ids = this._indexToId.splice(index, length);
            var array = this._array;

            ids.forEach(id => {
                delete array[id];
            });

            return ids;
        }

        /**
         * return index
         */
        removeById(id: number): number {
            var index = this._indexToId.indexOf(id);

            if (index >= 0) {
                this._indexToId.splice(index, 1);
                delete this._array[id];
            }

            return index;
        }

        clear(): number[]{
            return this.remove(0, Infinity);
        }
    }

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


    var preprocessRegex =
        /(<!--(?:(?!-->)[\s\S])*-->)|(\\\\|\\\{)|\{(?:([@#%])([a-z](?:-?[\w]+)*)(?:\s+|(?=\}))|(=)?)(?:((?:\\\\|\\\}|(["'])(?:(?!\7|[\r\n\u2028\u2029\\])[\s\S]|\\(?:['"\\bfnrtv]|[^'"\\bfnrtv\dxu\r\n\u2028\u2029]|0|x[\da-fA-F]{2}|u[\da-fA-F]{4})|\\(?:[\r\n\u2028\u2029]|\r\n))*\7|(?:\/(?:[^\r\n\u2028\u2029*/\[\\]|\\[^\r\n\u2028\u2029]|\[(?:[^\r\n\u2028\u2029\]\\]|\\[^\r\n\u2028\u2029])*\])(?:[^\r\n\u2028\u2029/\[\\]|\\[^\r\n\u2028\u2029]|\[(?:[^\r\n\u2028\u2029\]\\]|\\[^\r\n\u2028\u2029])*\])*\/[gimy]{0,4})|[^}])*))?\}/ig;
    var indexOrIdRegex = /^:?\d+$/;
    var indexRegex = /\[([^\]]*)\]/g;
    var keyPathTailRegex = /(?:\.|^)[^.]+$/;

    var expressionInStringRegex = /(\\\\|\\\{|\\\})|\{((?:[a-z$_][\w$]*|:\d+)(?:\.(?:[a-z$_][\w$]*|:\d+)|\[\d+\])*)\}/ig;

    var isExpressionRegex = /^(?:[a-z$_][\w$]*)(?:\.[a-z$_][\w$]*)*$/i;
    var compoundExpressionRegex = /(\b(?:typeof|instanceof|new|null|true|false)\b|(["'])(?:(?!\2|[\r\n\u2028\u2029\\])[\s\S]|\\(?:['"\\bfnrtv]|[^'"\\bfnrtv\dxu\r\n\u2028\u2029]|0|x[\da-fA-F]{2}|u[\da-fA-F]{4})|\\(?:[\r\n\u2028\u2029]|\r\n))*\2|(?:(?:(?:0|[1-9]\d*)(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|0[xX][\da-fA-F]+)|(?:\/(?:[^\r\n\u2028\u2029*/\[\\]|\\[^\r\n\u2028\u2029]|\[(?:[^\r\n\u2028\u2029\]\\]|\\[^\r\n\u2028\u2029])*\])(?:[^\r\n\u2028\u2029/\[\\]|\\[^\r\n\u2028\u2029]|\[(?:[^\r\n\u2028\u2029\]\\]|\\[^\r\n\u2028\u2029])*\])*\/[gimy]{0,4}))|(\.\s*)?([a-zA-Z$_][\w$_]*(?:\s*\.\s*[a-zA-Z$_][\w$_]*)*)(?!\s*[\(\w$_])|(\{)/g;
    var expressionInParsedCompoundRegex = /(["'])(?:(?!\1|[\r\n\u2028\u2029\\])[\s\S]|\\(?:['"\\bfnrtv]|[^'"\\bfnrtv\dxu\r\n\u2028\u2029]|0|x[\da-fA-F]{2}|u[\da-fA-F]{4})|\\(?:[\r\n\u2028\u2029]|\r\n))*\1|\{((?:[\w$]+|:\d+)(?:\.(?:[\w$]+|:\d+))*)\}/ig;
    var escapedRegex = /\\(\\|\{|\})/g;

    export enum DataChangeType {
        set,
        insert,
        remove,
        clear
    }

    export interface IDataChangeData<Value> {
        changeType: DataChangeType
        ids?: number[];
        oldValue?: Value;
        value?: Value;
        values?: Value[];
        index?: number;
    }

    export interface IDataChangeEventData<Value> extends IDataChangeData<Value>, IEventData {
        keys: string[];
    }

    export interface IKeysInfo<Value> {
        keys: string[];
        value: Value;
    }

    function expressionToKeys(expression: string): string[] {
        return expression.replace(/\s+/g, '').replace(indexRegex, '.$1').split('.');
    }

    function getKeysLength(keys: string[]) {
        var length = keys.length;
        keys.some(key => {
            if (key == 'this') {
                length--;
            } else {
                return true;
            }
        });
        return length;
    }

    function removePreThis(keys: string[]): boolean {
        var hasPreThis = false;
        while (keys[0] == 'this') {
            keys.shift();
            hasPreThis = true;
        }
        return hasPreThis;
    }

    export class Data extends EventHost {
        private _data: any;

        constructor(data: any) {
            super();
            this._data = Data.wrap(data);
        }

        get helper() {
            return createDataHelper(this._data, []);
        }

        getIdKeysInfo(keys: string[]): IKeysInfo<any> {
            return Data._getIdKeysInfo(this._data, keys);
        }

        get<Value>(keys: string[], getInGlobal = false): Value {
            return Data.unwrap(Data._get<Value>(this._data, keys, true));
        }

        existsKeyInScope(scopeKeys: string[], key: string): boolean {
            return Data._existsKey(Data._get(this._data, scopeKeys), key);
        }

        getObjectKeys(keys: string[]): string[] {
            return Object.keys(Data._get(this._data, keys));
        }

        private static _existsKey(data: any, key: string): boolean {
            if (data == null) {
                return false;
            }

            if (data instanceof XArray && indexOrIdRegex.test(key)) {
                if (key[0] == ':') {
                    var id = Number(key.substr(1));
                    return (<XArray>data).existsId(id);
                }

                var index = Number(key);
                return (<XArray>data).id(index) != null;
            } else if (data instanceof Object) {
                return key in data;
            } else {
                return data[key] !== undefined;
            }
        }

        private static _getIdKeysInfo<Value>(data: any, keys: string[]): IKeysInfo<Value>{
            // logic below should be identical to _get

            var idKeys: string[] = [];
            var key: string;
            var i = 0;

            for (i; i < keys.length - 1; i++) {
                key = keys[i];
                if (data instanceof XArray && indexOrIdRegex.test(key)) {
                    var index: number;
                    var id: number;

                    if (key[0] == ':') {
                        id = Number(key.substr(1));
                    } else {
                        index = Number(key);
                        id = (<XArray>data).id(index);
                    }

                    if (id == null) {
                        data = null;
                        idKeys.push(key);
                    } else {
                        data = (<XArray>data).itemById(id);
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

            var value: any;
            key = keys[i];

            if (data instanceof XArray && indexOrIdRegex.test(key)) {
                var index: number;
                var id: number;

                if (key[0] == ':') {
                    id = Number(key.substr(1));
                } else {
                    index = Number(key);
                    id = (<XArray>data).id(index);
                }

                if (id == null) {
                    idKeys.push(key);
                    value = undefined;
                } else {
                    idKeys.push(':' + id);
                    value = (<XArray>data).itemById(id);
                }
            } else if (hop.call(data, key)) {
                idKeys.push(key);
                value = data[key];
            } else {
                return {
                    keys: null,
                    value: undefined
                };
            }

            return {
                keys: idKeys,
                value: value
            };
        }

        private static _get<Value>(data: any, keys: string[], getInGlobal = false): Value {
            if (!keys.length) {
                return data;
            }

            var key = keys[0];
            var i = 0;

            if (
                getInGlobal &&
                !(data instanceof XArray && indexOrIdRegex.test(key)) &&
                !(key in data)
                ) {
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

            // logic below should be identical to logic in _getIdKeysInfo
            for (i; i < keys.length - 1; i++) {
                key = keys[i];
                if (data instanceof XArray && indexOrIdRegex.test(key)) {
                    var index: number;
                    var id: number;

                    if (key[0] == ':') {
                        id = Number(key.substr(1));
                    } else {
                        index = Number(key);
                        id = (<XArray>data).id(index);
                    }

                    if (id == null) {
                        return undefined;
                    } else {
                        data = (<XArray>data).itemById(id);
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
                var index: number;
                var id: number;

                if (key[0] == ':') {
                    id = Number(key.substr(1));
                    if (!(<XArray>data).existsId(id)) {
                        id = null;
                    }
                } else {
                    index = Number(key);
                    id = (<XArray>data).id(index);
                }

                if (id == null) {
                    return undefined;
                }

                return (<XArray>data).itemById(id);
            } else {
                return data[key];
            }
        }

        insert<Value>(keys: string[], values: Value[], index = Infinity): number[]{
            var info = Data._getIdKeysInfo<XArray>(this._data, keys);
            var xarr = info.value;
            var idKeys = info.keys;

            if (!(xarr instanceof XArray)) {
                throw new TypeError('[drop] can not insert on a non-array object (' + keys.join('.') + ')');
            }

            index = Math.min(index, xarr.length);
            var ids = xarr.insert(values, index);

            var changeEventData: IDataChangeEventData<any> = {
                changeType: DataChangeType.insert,
                ids: ids,
                keys: idKeys,
                index: index,
                value: values[0],
                values: values
            };

            this.trigger('change:' + idKeys.join('.'), changeEventData);

            changeEventData = {
                changeType: DataChangeType.insert,
                ids: ids,
                keys: idKeys,
                index: index,
                value: values[0],
                values: values
            };

            this.trigger('change', changeEventData);

            return ids;
        }

        /**
         * return index
         */
        removeByKeys(keys: string[]): number {
            keys = keys.concat();
            var idStr = keys.pop();

            if (!indexOrIdRegex.test(idStr) || idStr[0] != ':') {
                throw new TypeError('[drop] the last key when use removeByKeys should be a string presenting a number preceding a colon');
            }

            var id = Number(idStr.substr(1));

            var info = Data._getIdKeysInfo<XArray>(this._data, keys);
            var xarr = info.value;
            var idKeys = info.keys;

            if (!(xarr instanceof XArray)) {
                throw new TypeError('[drop] can not remove on a non-array object (' + keys.join('.') + ')');
            }

            var index = xarr.removeById(id);

            if (index >= 0) {
                var changeEventData: IDataChangeEventData<any> = {
                    changeType: DataChangeType.remove,
                    ids: [id],
                    keys: idKeys,
                    index: index
                };

                this.trigger('change:' + idKeys.join('.'), changeEventData);

                changeEventData = {
                    changeType: DataChangeType.remove,
                    ids: [id],
                    keys: idKeys,
                    index: index
                };

                this.trigger('change', changeEventData);
            }

            return index;
        }

        remove(keys: string[], index: number, length = 1): number[] {
            var info = Data._getIdKeysInfo<XArray>(this._data, keys);
            var xarr = info.value;
            var idKeys = info.keys;

            if (!(xarr instanceof XArray)) {
                throw new TypeError('[drop] can not remove on a non-array object (' + keys.join('.') + ')');
            }

            var ids = xarr.remove(index, length);

            var changeEventData: IDataChangeEventData<any> = {
                changeType: DataChangeType.remove,
                ids: ids,
                keys: idKeys,
                index: index
            };

            this.trigger('change:' + idKeys.join('.'), changeEventData);

            changeEventData = {
                changeType: DataChangeType.remove,
                ids: ids,
                keys: idKeys,
                index: index
            };

            this.trigger('change', changeEventData);

            return ids;
        }

        clear(keys: string[]): number[] {
            var info = Data._getIdKeysInfo<XArray>(this._data, keys);
            var xarr = info.value;
            var idKeys = info.keys;

            if (!(xarr instanceof XArray)) {
                throw new TypeError('[drop] can not clear on a non-array object (' + keys.join('.') + ')');
            }

            var ids = xarr.clear();

            var changeEventData: IDataChangeEventData<any> = {
                changeType: DataChangeType.clear,
                ids: ids,
                keys: idKeys
            };

            this.trigger('change:' + idKeys.join('.'), changeEventData);

            changeEventData = {
                changeType: DataChangeType.clear,
                ids: ids,
                keys: idKeys
            };

            this.trigger('change', changeEventData);

            return ids;
        }

        set<Value>(keys: string[], value: Value): string[] {
            var data = this._data;

            var idKeys: string[] = [];

            var key: string;
            var i = 0;

            for (i; i < keys.length - 1; i++) {
                key = keys[i];
                if (data instanceof XArray) {
                    if (!indexOrIdRegex.test(key)) {
                        throw new TypeError('[drop] can not set "' + key + '" on array "' + keys.slice(0, i) + '"');
                    }

                    var index: number;
                    var id: number;

                    if (key[0] == ':') {
                        id = Number(key.substr(1));
                    } else {
                        index = Number(key);
                        id = (<XArray>data).id(index);
                    }

                    if (id == null) {
                        idKeys.push(key);
                        data = null;
                    } else {
                        idKeys.push(':' + id);
                        data = (<XArray>data).item(id);
                    }
                } else {
                    idKeys.push(key);
                    data = data[key];
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

            var oldValue: any;
            key = keys[i];

            if (data instanceof XArray) {
                if (!indexOrIdRegex.test(key)) {
                    throw new Error('[drop] can not set "' + key + '" on array "' + keys.slice(0, i) + '"');
                }

                var index: number;
                var id: number;

                if (key[0] == ':') {
                    id = Number(key.substr(1));
                    if (!(<XArray>data).existsId(id)) {
                        throw new TypeError('[drop] can not set because "' + keys.slice(0, i) + '" does not have item with id ' + id);
                    }
                } else {
                    index = Number(key);
                    id = (<XArray>data).id(index);
                }

                if (id == null) {
                    throw new TypeError('[drop] can not set because "' + keys.slice(0, i) + '" does not have item with index ' + key);
                }

                oldValue = (<XArray>data).itemById(id);
                (<XArray>data).setById(id, Data.wrap(value));

                idKeys.push(':' + id);
            } else {
                idKeys.push(key);
                oldValue = data[key];
                data[key] = Data.wrap(value);
            }

            oldValue = Data.unwrap(oldValue);

            var changeEventData: IDataChangeEventData<any> = {
                changeType: DataChangeType.set,
                keys: keys,
                oldValue: oldValue,
                value: value
            };

            this.trigger('change:' + idKeys.join('.'), changeEventData);

            changeEventData = {
                changeType: DataChangeType.set,
                keys: keys,
                oldValue: oldValue,
                value: value
            };

            this.trigger('change', changeEventData);

            return idKeys;
        }

        static wrap(data: any): any {
            if (data instanceof Array) {
                var xArr = new XArray(data);

                xArr.range().forEach((item, i) => {
                    xArr.set(i, Data.wrap(item));
                });

                return xArr;
            }

            if (data instanceof Object && typeof data != 'function') {
                var wrapped = {};

                for (var key in data) {
                    if (hop.call(data, key)) {
                        wrapped[key] = Data.wrap(data[key]);
                    }
                }

                return wrapped;
            }

            return data;
        }

        static unwrap(data: any): any {
            if (data instanceof XArray) {
                var arr: any[] = (<XArray>data).range();
                return arr.map(item => Data.unwrap(item));
            }

            if (data instanceof Object && typeof data != 'function') {
                var unwrapped = {};

                for (var key in data) {
                    if (hop.call(data, key)) {
                        unwrapped[key] = Data.unwrap(data[key]);
                    }
                }

                return unwrapped;
            }

            return data;
        }
    }

    export class DecoratorDefinition {
        private static _modifiersMap = new StringMap<DecoratorDefinition>();
        private static _processorsMap = new StringMap<DecoratorDefinition>();
        private static _attribute: DecoratorDefinition;
        private static _text: DecoratorDefinition;
        private static _html: DecoratorDefinition;

        constructor(
            public type: string,
            public name: string,
            public oninitialize?: (decorator: Decorator) => void,
            public onchange?: (decorator: Decorator, args: IDataChangeEventData<any>[]) => void,
            public ondispose?: (decorator: Decorator) => void
            ) {

        }

        initialize(decorator: Decorator) {
            if (decorator.initialized && decorator.type == 'modifier') {
                decorator.scope.dispose(true);
            }

            try {
                if (this.oninitialize) {
                    this.oninitialize(decorator);
                } else {
                    this.onchange(decorator, null);
                }
            } catch (e) {
                errorNextTick(e);
            }

            decorator.initialized = true;
        }

        change(decorator: Decorator, args: IDataChangeEventData<any>[]) {
            try {
                this.onchange(decorator, args);
            } catch (e) {
                errorNextTick(e);
            }
        }

        invoke(decorator: Decorator, args?: IDataChangeEventData<any>[]) {
            if (decorator.initialized) {
                this.change(decorator, args);
            } else {
                this.initialize(decorator);
            }
        }

        dispose(decorator: Decorator) {
            try {
                if (this.ondispose) {
                    this.ondispose(decorator);
                }
            } catch (e) {
                errorNextTick(e);
            }
        }

        static register(decorator: DecoratorDefinition) {
            if (!decorator.onchange) {
                throw new TypeError('[drop] the onchange handler is required for a decorator');
            }

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
        }

        static getDefinition(type: string, name?: string): DecoratorDefinition {
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
        }

        static typeToMark: IDictionary<string> = {
            'modifier': '#',
            'processor': '%',
            'attribute': '@',
            'html': '=',
            'text': ''
        };
    }

    export class ModifierDefinition extends DecoratorDefinition {
        constructor(
            name: string,
            public oninitialize?: (decorator: Decorator) => void,
            public onchange?: (decorator: Decorator, args: IDataChangeEventData<any>[]) => void
            ) {
            super('modifier', name, oninitialize, onchange);
        }

        private _onscopechange(decorator: Decorator, args: IDataChangeEventData<any>[]) {
            var scope = decorator.scope;
            scope.dispose(true);
        }

        change(decorator: Decorator, args: IDataChangeEventData<any>[]) {
            try {
                if (args.some(arg => arg.changeType == DataChangeType.set)) {
                    this._onscopechange(decorator, args);
                }
                this.onchange(decorator, args);
            } catch (e) {
                errorNextTick(e);
            }
        }
    }

    export class ProcessorDefinition extends DecoratorDefinition {
        constructor(
            name: string,
            public oninitialize?: (decorator: Decorator) => void,
            public onchange?: (decorator: Decorator, args: IDataChangeEventData<any>[]) => void
            ) {
            super('processor', name, oninitialize, onchange);
        }
    }

    export class DecoratorTarget {
        private _start = document.createComment('start');
        private _end = document.createComment('end');

        get start(): Node {
            return this._start;
        }

        get end(): Node {
            return this._end;
        }

        constructor(startNode?: Node, endNode?: Node) {
            if (startNode) {
                this.initialize(startNode, endNode);
            }
        }

        initialized = false;

        initialize(startNode: Node, endNode = startNode) {
            var parentNode = startNode.parentNode;
            parentNode.insertBefore(this._start, startNode);
            parentNode.insertBefore(this._end, endNode.nextSibling);
            this.initialized = true;
        }

        dispose() {
            var node: Node = this._start;
            var parentNode = node.parentNode;
            if (!parentNode) {
                return;
            }

            var nodes: Node[] = [];

            do {
                nodes.push(node);

                if (node == this._end) {
                    break;
                }
            } while (node = node.nextSibling);

            nodes.forEach(node => parentNode.removeChild(node));
        }

        each(handler: (node: HTMLElement, index: number) => void) {
            var i = 0;
            var node: Node = this._start;

            while (node = node.nextSibling) {
                if (node == this._end) {
                    break;
                }

                if (node instanceof Comment) {
                    continue;
                }

                handler(<any>node, i++);
            }
        }

        replaceWith(fragment: DocumentFragment);
        replaceWith(node: Node);
        replaceWith(nodes: NodeList);
        replaceWith(nodes: Node[]);
        replaceWith(nodes: any) {
            var prevNodes: Node[] = [];
            var node: Node = this._start;
            var parentNode = node.parentNode;

            while (node = node.nextSibling) {
                if (node == this._end) {
                    break;
                }

                prevNodes.push(node);
            }

            prevNodes.forEach(node => parentNode.removeChild(node));

            var fragment: Node;

            if (nodes instanceof DocumentFragment) {
                fragment = nodes;
            } else {
                if (!(nodes instanceof Array || nodes instanceof NodeList)) {
                    nodes = nodes ? [nodes] : [];
                }

                fragment = document.createDocumentFragment();

                nodes = slice.call(nodes);
                (<Node[]>nodes).forEach(node => {
                    fragment.appendChild(node);
                });
            }

            parentNode.insertBefore(fragment, this._end);
        }

        insertBefore(newChild: Node, refChild: Node) {
            var parentNode = this._start.parentNode;

            if (refChild && refChild.parentNode != parentNode) {
                refChild = null;
            }

            parentNode.insertBefore(newChild, refChild || this._end);
        }


    }

    interface IStringDependenciesInfo {
        scopeDependencies: string[];
        dependencies: string[];
        stringWithFullKeys: string;
    }

    interface IExpressionDependenciesInfo {
        scopeDependencies: string[];
        dependencies: string[];
        expressionWithFullKeys: string;
    }

    export class Decorator {
        definition: DecoratorDefinition;
        initialized = false;

        data: any;

        private _value: any;
        private _isValue: boolean;
        private _compoundExpression: string;
        private _isCompound: boolean;

        private _expression: string;
        get expression(): string {
            return this._expression;
        }

        private _expressionKeys: string[];
        get expressionKeys(): string[]{
            return this._expressionKeys;
        }

        private _expressionFullIdKeys: string[];
        get expressionFullIdKeys(): string[]{
            return this._expressionFullIdKeys;
        }

        private _scopeListenerTypes: string[] = [];
        private _listenerTypes: string[] = [];
        private _listener: (arg: IDataChangeEventData<any>) => void;

        get hasDependency(): boolean {
            return !!(this._scopeListenerTypes.length || this._listenerTypes.length);
        }

        constructor(
            public target: DecoratorTarget,
            public type: string,
            public name: string,
            public scope: Scope,
            expression: string
            ) {

            this.definition = DecoratorDefinition.getDefinition(type, name);

            if (!this.definition) {
                throw new TypeError('[drop] unknown decorator "' + DecoratorDefinition.typeToMark[type] + name + '" (' + type + ')');
            }

            if (expression) {
                this._expression = expression;

                try {
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
            } else {
                this._expression = undefined;
                this._isValue = true;
                this._value = undefined;
            }

            if (scope) {
                this.prepareDependencies();
            }
        }

        private _prepared = false;

        prepareDependencies() {
            if (this._prepared) {
                return;
            }

            this._prepared = true;

            var scope = this.scope;
            var data = scope.data;

            var scopeDependencies: string[] = [];
            var dependencies: string[] = [];

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

                var value: any;
                try {
                    value = globalEval('"use strict";(' + expression + ')');
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

                    try {
                        this._value = globalEval('"use strict";(' + this._expression + ')');
                    } catch (e) { }
                }
            }

            var listener = arg => {
                this.invoke(arg, false);
            };

            var listenerTypes: string[];

            //if (/index/.test(expression)) {
            //    debugger;
            //}

            if (scopeDependencies.length) {
                listenerTypes = this._scopeListenerTypes;

                scopeDependencies.forEach(dependency => {
                    var type = 'change:' + dependency;
                    scope.on(type, listener);
                    listenerTypes.push(type);
                });
            }

            if (dependencies.length) {
                listenerTypes = this._listenerTypes;

                dependencies.forEach(dependency => {
                    var type = 'change:' + dependency;
                    data.on(type, listener);
                    listenerTypes.push(type);
                });
            }

            this._listener = listener;
        }

        private _pendingChangeDataArgs: IDataChangeEventData<any>[];

        invoke(arg: IDataChangeEventData<any>, sync = true) {
            // change type other than set may change the index of the data in an array.
            // if two of them happen synchronously, it might cause incorrect id keys as
            // all decorators including modifiers are handling these changes asynchronously.
            if (sync || arg.changeType != DataChangeType.set) {
                var definition = this.definition;
                definition.invoke(this, [arg]);
                return;
            }

            var args = this._pendingChangeDataArgs;
            if (args) {
                args.push(arg);
            } else {
                var args = [arg];
                this._pendingChangeDataArgs = args;

                nextTick(() => {
                    var definition = this.definition;
                    definition.invoke(this, args);
                    this._pendingChangeDataArgs = null;
                });
            }
        }

        initialize() {
            this.definition.initialize(this);
        }

        dispose() {
            var definition = this.definition;

            definition.dispose(this);

            var listener = this._listener;

            // scope data
            var scope = this.scope;

            this._scopeListenerTypes.forEach(type => {
                scope.off(type, listener);
            });

            this._scopeListenerTypes = [];

            // data
            var data = scope.data;

            this._listenerTypes.forEach(type => {
                data.off(type, listener);
            });

            this._listenerTypes = [];

            // nodes
            this.target.dispose();
        }

        get expressionValue(): any {
            if (this._isValue) {
                var value = this._value;
                if (typeof value == 'string') {
                    if (this._listenerTypes.length || this._scopeListenerTypes.length) {
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
        }

        private _getStringDependenciesInfo(str: string): IStringDependenciesInfo {
            var scopeHash = new StringHash();
            var hash = new StringHash();

            var scope = this.scope;

            str = str.replace(expressionInStringRegex,
                (m: string, escapedToSkip: string, expression: string) => {

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
                        try {
                            return globalEval('"use strict";(' + expression + ')');
                        } catch (e) {
                            return '';
                        }
                    }
                });

            return {
                scopeDependencies: scopeHash.keys,
                dependencies: hash.keys,
                stringWithFullKeys: str
            };
        }

        private _getExpressionDependenciesInfo(compoundExpression: string): IExpressionDependenciesInfo {
            var scopeHash = new StringHash();
            var hash = new StringHash();
            var scope = this.scope;

            var parsed = compoundExpression.replace(compoundExpressionRegex,
                (
                    m: string,
                    literal: string,
                    quote: string,
                    previous: string,
                    expression: string,
                    curlyBra: string
                    ) => {

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
        }
    }

    export function createDataHelper(data: Data, keys: string[]): any {
        var value = data.get(keys);

        if (value instanceof Array) {
            return new ArrayDataHelper(data, keys);
        }

        if (value instanceof Object && typeof value != 'function') {
            return new ObjectDataHelper(data, keys);
        }

        return value;
    }

    export class ArrayDataHelper {
        private _data: Data;
        private _keys: string[];

        constructor(data: Data, keys: string[]) {
            this._data = data;
            this._keys = keys;
        }

        get length(): number {
            return this._data.get<number>(this._keys.concat('length'));
        }

        set length(length: number) {
            this._data.remove(this._keys, length, Infinity);
        }

        item(index: number): any {
            var info = this._data.getIdKeysInfo(this._keys.concat(index.toString()));
            return createDataHelper(this._data, info.keys);
        }

        push(...items: any[]) {
            this._data.insert(this._keys, items);
        }

        insert(items: any[], index = Infinity) {
            this._data.insert(this._keys, items, index);
        }

        remove(index: number, length = 1) {
            this._data.remove(this._keys, index, length);
        }

        clear() {
            this._data.clear(this._keys);
        }
    }

    export class ObjectDataHelper {
        constructor(data: Data, keys: string[]) {
            keys = keys.concat();
            var objectKeys = data.getObjectKeys(keys);

            objectKeys.forEach(key => {
                var valueKeys = keys.concat(key);

                Object.defineProperty(this, key, {
                    get: () => {
                        return createDataHelper(data, valueKeys);
                    },
                    set: (value) => {
                        data.set(valueKeys, value);
                    },
                    configurable: true,
                    enumerable: true
                })
            });
        }
    }

    export class Scope extends EventHost {

        private _scopeData;

        private _data: Data;
        get data(): Data {
            return this._data;
        }

        childScopes: Scope[] = [];
        decorators: Decorator[] = [];

        private _fragmentDiv: HTMLDivElement;
        get fragment() {
            var fragment = document.createDocumentFragment();
            var div = this._fragmentDiv;

            var nodes = div ? <Element[]>slice.call(div.childNodes) : [];

            nodes.forEach(node => {
                fragment.appendChild(node);
            });

            return fragment;
        }

        constructor(
            public fragmentTemplate: HTMLDivElement,
            public modifier: Decorator,
            public parentScope: Scope,
            data?: Data,
            scopeKeys?: string[],
            scopeData = {}
            ) {
            super();

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

        initialize() {
            var fragmentDiv = <HTMLDivElement>this.fragmentTemplate.cloneNode(true);

            var decorators: Decorator[] = [];

            var dropEles = fragmentDiv.getElementsByTagName('drop');

            while (dropEles.length) {
                var dropEle = dropEles[0];
                var decoratorName = dropEle.getAttribute('name');
                var type = dropEle.getAttribute('type');

                switch (type) {
                    //case 'html':
                    //case 'text':
                    //    var comment = (type == 'text' ? '{' : '{=') + dropEle.textContent + '}';
                    //    var commentEle = document.createComment(comment);

                    //    dropEle.parentNode.replaceChild(commentEle, dropEle);

                    //    decorators.push(new Decorator(
                    //        new DecoratorTarget([commentEle]),
                    //        type,
                    //        null,
                    //        this,
                    //        dropEle.textContent
                    //        ));
                    //    break;
                    case 'modifier':
                        var nested = document.createElement('div');

                        var target: Element = dropEle;

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

                        var modifier = new Decorator(
                            new DecoratorTarget(commentEle),
                            type,
                            decoratorName,
                            null,
                            dropEle.textContent
                            );

                        var scope = new Scope(nested, modifier, this);
                        break;
                    default:
                        var target: Element = dropEle;

                        var decoratorTarget: DecoratorTarget;

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
                                    if (!decoratorTarget.initialized) {
                                        decoratorTarget.initialize(target);
                                    }
                                    break;
                                }
                            }
                        }

                        dropEle.parentNode.removeChild(dropEle);

                        var decorator = new Decorator(
                            decoratorTarget,
                            type,
                            dropEle.getAttribute('name'),
                            this,
                            dropEle.textContent
                            )

                        decorator.invoke(null);
                        decorators.push(decorator);
                        break;
                }
            }

            this._fragmentDiv = fragmentDiv;

            this.decorators = decorators;
        }

        private _fullScopeKeysSet = false;
        private _fullScopeKeys: string[];

        get fullScopeKeys(): string[]{
            if (this._fullScopeKeys) {
                return this._fullScopeKeys;
            } else if (!this.parentScope) {
                return [];
            } else {
                return this.parentScope.fullScopeKeys;
            }
        }

        get dataHelper(): any {
            return createDataHelper(this._data, this.fullScopeKeys);
        }

        private _setFullScopeKeys(scopeKeys?: string[]) {
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
        }

        setScopeData(key: string, value: any) {
            var scopeData = this._scopeData;
            if (!hop.call(scopeData, key) || scopeData[key] != value) {
                scopeData[key] = value;
                this.trigger('change:' + key);
            }
        }

        setData(fullIdKeys: string[], value: any) {
            if (fullIdKeys[0] == 'this') {
                if (fullIdKeys.length != 2) {
                    throw new TypeError('[drop] scope data does not support nested object (' + fullIdKeys.join('.') + ')');
                }
                this.setScopeData(fullIdKeys[1], value);
            } else {
                this.data.set(fullIdKeys, value);
            }
        }

        getData<Value>(key: string): Value;
        getData<Value>(keys: string[]): Value
        getData<Value>(keys: any): Value {
            if (typeof keys == 'string') {
                keys = expressionToKeys(keys);
            }

            var fullIdKeys = this.getFullIdKeys(keys);
            if (fullIdKeys[0] == 'this') {
                return this._scopeData[fullIdKeys[1]];
            } else {
                return this.data.get<Value>(fullIdKeys);
            }
        }

        getFullIdKeys(keys: string[]): string[] {
            keys = keys.concat();

            var hasPreThis = removePreThis(keys);
            var key = keys[0];

            if (keys.length == 1) {
                if (hop.call(this._scopeData, key)) {
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
                } while (scope = scope.parentScope);

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
            } while (scope = scope.parentScope);

            return data.getIdKeysInfo(keys).keys;
        }

        evaluate(keys: string[], isFullKeys = false): any {

            var key = keys[0];

            if (isFullKeys) {
                if (key == 'this') {
                    return this._scopeData[keys[1]];
                }
                return this.data.get(keys, true);
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
                } while (scope = scope.parentScope);

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
            } while (scope = scope.parentScope);

            return data.get(keys, true);
        }

        evaluateString(str: string, isFullKeys = false): string {
            return str.replace(expressionInStringRegex,
                (m: string, escapedToSkip: string, expression: string) => {
                    if (escapedToSkip) {
                        return escapedToSkip[1];
                    }

                    var value = this.evaluate(expressionToKeys(expression), isFullKeys);
                    if (value == null) {
                        return m;
                    } else {
                        return value;
                    }
                });
        }

        evaluateExpression(expression: string, isFullKeys = false): any {
            expression = expression.replace(expressionInParsedCompoundRegex,
                (m: string, quotePlaceHolder: string, expression: string) => {
                    if (!expression) {
                        return m;
                    }

                    var value = this.evaluate(expressionToKeys(expression), isFullKeys);
                    var json = JSON.stringify(value);

                    if (!json) {
                        json = 'undefined';
                    } else {
                        // in case of object notation or number (as you have to use 1..toFixed() or (1).toFixed())
                        json = '(' + json + ')';
                    }

                    return json;
                });

            //console.log('globalEval:', expression);

            try {
                return globalEval('"use strict";(' + expression + ')');
            } catch (e) {
                return undefined;
            }
        }

        dispose(skipModifier = false) {
            if (!skipModifier) {
                var modifier = this.modifier;
                if (modifier) {
                    modifier.dispose();
                }
            }

            this.decorators.forEach(decorator => {
                decorator.dispose();
            });

            this.decorators = [];

            this.childScopes.forEach(scope => {
                scope.dispose();
            });

            this.childScopes = [];
        }
    }


    export class Template {

        private static _fragmentDivsMap = new StringMap<HTMLDivElement>();

        scope: Scope;

        constructor(tpl: string, data: Data) {
            var fragmentDivsMap = Template._fragmentDivsMap;
            var fragmentDiv = fragmentDivsMap.get(tpl);

            if (!fragmentDiv) {
                fragmentDiv = Template.parse(tpl);
                fragmentDivsMap.set(tpl, fragmentDiv);
            }

            fragmentDiv = <HTMLDivElement>fragmentDiv.cloneNode(true);

            this.scope = new Scope(fragmentDiv, null, null, data);
        }

        appendTo(node: Node) {
            node.appendChild(this.scope.fragment);
        }

        private static _htmlEncode(text: string): string {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        static apply(templateId: string, data: Data, target: HTMLElement) {
            var templateText = document.getElementById(templateId).textContent;

            var startTime = Date.now();
            var template = new Drop.Template(templateText, data);
            var endTime = Date.now();

            console.debug('parsed template "' + templateId + '" in ' + (endTime - startTime) + 'ms.');

            template.appendTo(target);
            return template;
        }

        static parse(tpl: string): HTMLDivElement {
            tpl = tpl.replace(preprocessRegex,
                (
                    m: string,
                    commentToSkip: string,
                    escapedToSkip: string,
                    typeMarker: string,
                    name: string,
                    typeMarker2: string,
                    expansion: string
                    ) => {

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
        }
    }
}

interface DropElement extends HTMLElement { }

interface Element {
    getElementsByTagName(name: 'drop'): NodeListOf<DropElement>;
}


module Drop {

    //#region Utils
    var hop = Object.prototype.hasOwnProperty;
    var slice = Array.prototype.slice;
    var splice = Array.prototype.splice;


    declare var process;
    declare var setImmediate;

    interface INextTickTask {
        task?: () => void;
        domain?: any;
        next?: INextTickTask;
    }

    var nextTick = (() => {
        // linked list of tasks (single, with head node)
        var head: INextTickTask = {};
        var tail = head;
        var flushing = false;
        var requestTick: () => void = null;
        var isNodeJS = false;

        function flush() {
            while (head.next) {
                head = head.next;
                var task = head.task;
                head.task = null;
                var domain = head.domain;

                if (domain) {
                    head.domain = null;
                    domain.enter();
                }

                try {
                    task();
                } catch (e) {
                    if (isNodeJS) {
                        // In node, uncaught exceptions are considered fatal errors.
                        // Re-throw them synchronously to interrupt flushing!

                        // Ensure continuation if the uncaught exception is suppressed
                        // listening "uncaughtException" events (as domains does).
                        // Continue in next event to avoid tick recursion.
                        if (domain) {
                            domain.exit();
                        }
                        setTimeout(flush, 0);
                        if (domain) {
                            domain.enter();
                        }

                        throw e;
                    } else {
                        // In browsers, uncaught exceptions are not fatal.
                        // Re-throw them asynchronously to avoid slow-downs.
                        setTimeout(function () {
                            throw e;
                        }, 0);
                    }
                }

                if (domain) {
                    domain.exit();
                }
            }

            flushing = false;
        }

        var nextTick = (task: () => void) => {
            tail = tail.next = {
                task: task,
                domain: isNodeJS && process.domain,
                next: null
            };

            if (!flushing) {
                flushing = true;
                requestTick();
            }
        };

        if (typeof process !== 'undefined' && process.nextTick) {
            // Node.js before 0.9. Note that some fake-Node environments, like the
            // Mocha test runner, introduce a `process` global without a `nextTick`.
            isNodeJS = true;

            requestTick = function () {
                process.nextTick(flush);
            };

        } else if (typeof setImmediate === 'function') {
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
            console.log('on("' + type + '")');

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

        clear(): number[]{
            var ids = this._indexToId.concat();
            this._indexToId.length = 0;
            this._array.length = 0;
            return ids;
        }
    }

    var preprocessRegex =
        /(<!--(?:(?!-->)[\s\S])*-->)|(\\\\|\\\{)|\{(?:([@#%])([\w-]+)\s+|(=)?)(?:((?:\\\\|\\\}|(?:(["'])(?:\\.|(?!\7).)*\7)|[^}])*))?\}/g;
    var numberRegex = /^:?\d+$/;
    var arrayIndexRegex = /\[(\d+)\]/g;
    var keyPathTailRegex = /(?:\[\d+\]|(?:\.|^)[^.]+)$/;
    var expressionInStringRegex = /(\\\\|\\\{|\\\})|\{((?:\w+|:\d+)(?:\.(?:\w+|:\d+)|\[\d+\])*)\}/g;
    var expressionRegex = /^(?:\w+|:\d+)(?:\.(?:\w+|:\d+)|\[\d+\])*$/;
    var escapedRegex = /\\(\\|\{|\})/g;

    export enum DataChangeType {
        set,
        insert,
        remove,
        clear
    }

    export interface IDataChangeData<Value> {
        changeType: DataChangeType
        oldValue?: Value;
        value: Value;
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
        return expression.replace(arrayIndexRegex, '.$1').split('.');
    }

    function removePreThis(keys: string[]) {
        while (keys[0] == 'this') {
            keys.shift();
        }
    }

    export class Data extends EventHost {
        private _data: any;

        constructor(data: any) {
            super();
            this._data = Data._wrap(data);
        }

        getIdKeysInfo(keys: string[]): IKeysInfo<any> {
            return Data._getIdKeysInfo(this._data, keys);
        }

        //getFullKeys(keysGroups: string[][]): string[] {
        //    keysGroups = keysGroups.concat();

        //    for (var i = 0; i < keysGroups.length; i++) {
        //        var keys = keysGroups[i];
        //        if (keys[0] == 'this') {
        //            keys.shift();
        //            if (!keys.length) {
        //                keysGroups.splice(i--, 1);
        //            }
        //        }
        //    }

        //    var scopeKeysGroups: string[][] = [];

        //    var scope = this._data;
        //    var scopes = [scope];

        //    var subScope;

        //    keysLoop:
        //    for (var i = 0; i < keysGroups.length; i++) {
        //        var keys = keysGroups[i];
        //        var key = keys[0];

        //        for (var j = scopes.length - 1; j >= 0; j--) {
        //            var scope = scopes[j];

        //            if (Data._existsKey(scope, key)) {
        //                var idKeysInfo = Data._getIdKeysInfo(scope, keys);

        //                subScope = idKeysInfo.value;

        //                if (i == keysGroups.length - 1) {
        //                    scopeKeysGroups.push(idKeysInfo.keys);
        //                } else if (subScope != null) {
        //                    scopes.push(subScope);
        //                    scopeKeysGroups.push(idKeysInfo.keys);
        //                }

        //                continue keysLoop;
        //            }

        //            scopes.pop();
        //            scopeKeysGroups.pop();
        //        }

        //        return null;
        //    }

        //    var fullKeys = scopeKeysGroups.reduce((prev, curr) => prev.concat(curr), []);

        //    return fullKeys;
        //}

        get<Value>(keys: string[]): Value {
            return Data._unwrap(Data._get<Value>(this._data, keys));
        }

        existsKeyInScope(scopeKeys: string[], key: string): boolean {
            return Data._existsKey(Data._get(this._data, scopeKeys), key);
        }

        private static _existsKey(data: any, key: string): boolean {
            if (data == null) {
                return false;
            }

            if (data instanceof XArray && key != 'length') {
                if (!numberRegex.test(key)) {
                    return false;
                }

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

        private static _getIdKeysInfo(data: any, keys: string[]): IKeysInfo<any>{
            var idKeys: string[] = [];
            var key: string;
            var i = 0;

            for (i; i < keys.length - 1; i++) {
                key = keys[i];
                if (data instanceof XArray && key != 'length') {
                    if (!numberRegex.test(key)) {
                        throw new TypeError('[drop] can not get "' + key + '" on array "' + keys.slice(0, i) + '"');
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
                        keys: idKeys.concat(keys.slice(i + 1)),
                        value: undefined
                    };
                }
            }

            var value: any;
            key = keys[i];

            if (data instanceof XArray && key != 'length') {
                if (!numberRegex.test(key)) {
                    throw new Error('[drop] can not get "' + key + '" on array "' + keys.slice(0, i) + '"');
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
                    value = undefined;
                } else {
                    idKeys.push(':' + id);
                    value = (<XArray>data).itemById(id);
                }
            } else {
                idKeys.push(key);
                value = data[key];
            }

            return {
                keys: idKeys,
                value: value
            };
        }

        private static _get<Value>(data: any, keys: string[]): Value {
            var key: string;
            var i = 0;

            for (i; i < keys.length - 1; i++) {
                key = keys[i];
                if (data instanceof XArray && key != 'length') {
                    if (!numberRegex.test(key)) {
                        throw new Error('[drop] can not get "' + key + '" on array "' + keys.slice(0, i) + '"');
                    }

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

            if (data instanceof XArray && key != 'length') {
                if (!numberRegex.test(key)) {
                    throw new Error('[drop] can not get "' + key + '" on array "' + keys.slice(0, i) + '"');
                }

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

        set(keys: string[], value) {
            var data = this._data;

            var pathsHash = new StringHash();
            var paths: string[] = [];

            var indexPath = '';
            var idPath = '';

            var key: string;
            var i = 0;

            for (i; i < keys.length - 1; i++) {
                key = keys[i];
                if (data instanceof XArray) {
                    if (!numberRegex.test(key)) {
                        throw new TypeError('[drop] can not set "' + key + '" on array "' + keys.slice(0, i) + '"');
                    }

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

                    indexPath += '[]';
                    idPath += '.:' + id;

                    if (id == null) {
                        data = null;
                    } else {
                        data = (<XArray>data).item(id);
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

            var oldValue: any;
            key = keys[i];

            if (data instanceof XArray) {
                if (!numberRegex.test(key)) {
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
                (<XArray>data).setById(id, Data._wrap(value));

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

            var changeEventData: IDataChangeEventData<any>;

            paths.forEach(path => {
                changeEventData = {
                    changeType: DataChangeType.set,
                    keys: keys,
                    oldValue: oldValue,
                    value: value
                };
                this.trigger('change:' + path, changeEventData);
            });

            changeEventData = {
                changeType: DataChangeType.set,
                keys: keys,
                oldValue: oldValue,
                value: value
            };
            this.trigger('change', changeEventData);
        }

        private static _wrap(data: any): any {
            if (data instanceof Array) {
                var xArr = new XArray(data);

                xArr.range().forEach((item, i) => {
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
        }

        private static _unwrap(data: any): any {
            if (data instanceof XArray) {
                var arr: any[] = (<XArray>data).range();
                return arr.map(item => Data._unwrap(item));
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

            if (this.oninitialize) {
                this.oninitialize(decorator);
            } else {
                this.onchange(decorator, null);
            }
            decorator.initialized = true;
        }

        change(decorator: Decorator, args: IDataChangeEventData<any>[]) {
            this.onchange(decorator, args);
        }

        invoke(decorator: Decorator, args?: IDataChangeEventData<any>[]) {
            if (decorator.initialized) {
                this.change(decorator, args);
            } else {
                this.initialize(decorator);
            }
        }

        dispose(decorator: Decorator) {
            if (this.ondispose) {
                this.ondispose(decorator);
            }
        }

        static register(decorator: DecoratorDefinition) {
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

            //scope.modifier.invoke(null);
            //scope.decorators.forEach(decorator => {
            //    decorator.invoke(null);
            //});
        }

        change(decorator: Decorator, args: IDataChangeEventData<any>[]) {
            this._onscopechange(decorator, args);
            this.onchange(decorator, args);
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
        constructor(public nodes: Node[] = []) { }

        replaceWith(nodes: DocumentFragment);
        replaceWith(nodes: Node);
        replaceWith(nodes: NodeList);
        replaceWith(nodes: Node[]);
        replaceWith(nodes: any) {
            var prevNodes = this.nodes;

            for (var i = 1; i < prevNodes.length; i++) {
                var node: Node = prevNodes[i];
                node.parentNode.removeChild(node);
            }

            var replaceTarget: Node = prevNodes[0];

            var fragment: DocumentFragment;

            if (nodes instanceof DocumentFragment) {
                this.nodes = slice.call(nodes.childNodes);
                fragment = nodes;
            } else {
                if (!(nodes instanceof Array || nodes instanceof NodeList)) {
                    nodes = [nodes];
                }

                fragment = document.createDocumentFragment();

                this.nodes = slice.call(nodes);
                this.nodes.forEach(node => {
                    fragment.appendChild(node);
                });
            }

            replaceTarget.parentNode.replaceChild(fragment, replaceTarget);
        }
    }

    interface IStringDependenciesInfo {
        dependencies: string[];
        stringWithFullKeys: string;
    }

    export class Decorator {
        definition: DecoratorDefinition;
        initialized = false;

        data: any;

        private _value: any;
        private _isValue: boolean;

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

        private _listenerTypes: string[] = [];
        private _listener: (arg: IDataChangeEventData<any>) => void;

        constructor(
            public target: DecoratorTarget,
            public type: string,
            public name: string,
            public scope: Scope,
            expression: string
            ) {

            this.definition = DecoratorDefinition.getDefinition(type, name);

            this._expression = expression;

            try {
                this._value = JSON.parse(expression);
                this._isValue = true;
            } catch (e) {
                if (!expressionRegex.test(expression)) {
                    throw new SyntaxError('[drop] invalid decorator expression "' + expression + '"');
                }
                var expKeys = expressionToKeys(this._expression);
                this._expressionKeys = expKeys;
                this._isValue = false;
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

            var dependencies: string[];

            if (this._isValue) {
                var value = this._value;

                if (typeof value == 'string') {
                    var info = this._getStringDependenciesInfo(value);
                    this._value = info.stringWithFullKeys;
                    //console.log(this._value);
                    dependencies = info.dependencies;
                } else {
                    dependencies = [];
                }
            } else {
                var expKeys = this._expressionKeys.concat();

                removePreThis(expKeys);

                var fullIdKeys = scope.getFullIdKeys(expKeys);
                this._expressionFullIdKeys = fullIdKeys;

                dependencies = [];

                for (var i = 0; i < expKeys.length; i++) {
                    dependencies.push(fullIdKeys.slice(0, fullIdKeys.length - i).join('.'));
                }
            }

            if (dependencies.length) {
                var listener = arg => {
                    this.invoke(arg, false);
                };

                var listenerTypes = this._listenerTypes;

                dependencies.forEach(dependency => {
                    var type = 'change:' + dependency;
                    data.on(type, listener);
                    listenerTypes.push(type);
                });

                this._listener = listener;
            }
        }

        private _pendingChangeDataArgs: IDataChangeEventData<any>[];

        invoke(arg: IDataChangeEventData<any>, sync = true) {
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
            var data = this.scope.data;

            var types = this._listenerTypes;
            types.forEach(type => {
                data.off(type, listener);
            });
            types.length = 0;
        }

        get expressionValue(): any {
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
            } else {
                return this.scope.evaluate(this._expressionFullIdKeys, true);
            }
        }

        private _getStringDependenciesInfo(str: string): IStringDependenciesInfo {
            var hash = new StringHash();
            var scope = this.scope;

            str = str.replace(expressionInStringRegex, (m: string, escapedToSkip: string, expression: string) => {
                if (escapedToSkip) {
                    return m;
                }

                var fullExpression: string;

                var dependency = expression.replace(arrayIndexRegex, '.$1');
                var keys = dependency.split('.');
                var fullIdKeys = scope.getFullIdKeys(keys);

                fullExpression = fullIdKeys.join('.');

                for (var i = 0; i < keys.length; i++) {
                    hash.set(fullIdKeys.slice(0, fullIdKeys.length - i).join('.'));
                }

                return '{' + fullExpression + '}';
            });

            return {
                dependencies: hash.keys,
                stringWithFullKeys: str
            };
        }
    }


    export class Scope extends EventHost {

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
            scopeKeys?: string[]
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
                            new DecoratorTarget([commentEle]),
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
                                    if (!decoratorTarget.nodes.length) {
                                        decoratorTarget.nodes.push(target);
                                    }
                                    break;
                                }
                            }
                        }

                        dropEle.parentNode.removeChild(dropEle);

                        decorators.push(new Decorator(
                            decoratorTarget,
                            type,
                            dropEle.getAttribute('name'),
                            this,
                            dropEle.textContent
                            ));

                        break;
                }
            }

            this._fragmentDiv = fragmentDiv;

            this.decorators = decorators;

            decorators.forEach(decorator => {
                decorator.invoke(null);
            });
        }

        private _fullScopeKeysSet = false;
        private _fullScopeKeys: string[];

        get fullScopeKeys(): string[] {
            return this._fullScopeKeys.concat();
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

                    var scope = this;
                    while (scope = scope.parentScope) {
                        var fullScopeKeys = scope._fullScopeKeys;
                        if (!fullScopeKeys || !data.existsKeyInScope(fullScopeKeys, scopeKeys[0])) {
                            continue;
                        }

                        var info = data.getIdKeysInfo(fullScopeKeys.concat(scopeKeys));
                        if (info.value != null) {
                            this._fullScopeKeys = info.keys;
                            return;
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

        getFullIdKeys(keys: string[]): string[] {
            keys = keys.concat();

            removePreThis(keys);

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
                if (!fullScopeKeys || !data.existsKeyInScope(fullScopeKeys, keys[0])) {
                    continue;
                }

                return data.getIdKeysInfo(fullScopeKeys.concat(keys)).keys;
            } while (scope = scope.parentScope);

            return data.getIdKeysInfo(keys).keys;
        }

        evaluate(keys: string[], isFullKeys = false): any {
            if (isFullKeys) {
                return this.data.get(keys);
            }

            keys = keys.concat();

            removePreThis(keys);

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
                if (!fullScopeKeys || !data.existsKeyInScope(fullScopeKeys, keys[0])) {
                    continue;
                }

                return data.get(fullScopeKeys.concat(keys));
            } while (scope = scope.parentScope);


            return data.get(keys);
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

            this.childScopes.forEach(scope => {
                scope.dispose();
            });
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
            var template = new Drop.Template(templateText, data);
            template.appendTo(target);
        }

        static parse(tpl: string): HTMLDivElement {
            tpl = tpl.replace(preprocessRegex,
                (m, commentToSkip: string, escapedToSkip: string, typeMarker: string, name: string, typeMarker2: string, expansion: string) => {
                    if (commentToSkip) {
                        return commentToSkip;
                    }

                    if (escapedToSkip) {
                        return escapedToSkip[1];
                    }

                    expansion = expansion ? expansion.replace(/\{\{/g, '{').replace(/\}\}/g, '}') : '';

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

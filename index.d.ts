interface DropElement extends HTMLElement {
}
interface Element {
    getElementsByTagName(name: 'drop'): NodeListOf<DropElement>;
}
declare module Drop {
    var globalEval: typeof eval;
    interface IDictionary<Value> {
        [key: string]: Value;
    }
    interface IEventListener<T> {
        (event: IEvent): T;
    }
    interface IEvent {
        type?: string;
    }
    class EventHost {
        private _events;
        private _onceEvents;
        on(type: string, listener: IEventListener<any>): void;
        once(type: string, listener: IEventListener<any>): void;
        off(type: string, listener: IEventListener<any>): void;
        trigger(type: string, data?: any): boolean;
    }
    class XArray {
        private _indexToId;
        private _array;
        private _nextId;
        constructor(array?: any[]);
        length: number;
        id(index: number): number;
        existsId(id: number): boolean;
        item(index: number): any;
        itemById(id: number): any;
        range(index?: number, length?: number): any[];
        add(item: any): number;
        set(index: number, value: any): number;
        setById(id: number, value: any): boolean;
        insert(items: any[], index?: number): number[];
        remove(index: number, length?: number): number[];
        /**
         * return index
         */
        removeById(id: number): number;
        clear(): number[];
    }
    enum DataChangeType {
        set = 0,
        insert = 1,
        remove = 2,
        clear = 3,
    }
    interface IDataChangeData<T> {
        changeType: DataChangeType;
        ids?: number[];
        oldValue?: T;
        value?: T;
        values?: T[];
        index?: number;
    }
    interface IDataChangeEvent<T> extends IDataChangeData<T>, IEvent {
        keys: string[];
    }
    interface IKeysInfo<T> {
        keys: string[];
        value: T;
    }
    class Data extends EventHost {
        private _data;
        constructor(data: any);
        helper: any;
        getIdKeysInfo(keys: string[]): IKeysInfo<any>;
        get<Value>(keys: string[], getInGlobal?: boolean): Value;
        existsKeyInScope(scopeKeys: string[], key: string): boolean;
        getObjectKeys(keys: string[]): string[];
        private static _existsKey(data, key);
        private static _getIdKeysInfo<Value>(data, keys);
        private static _get<Value>(data, keys, getInGlobal?);
        insert<Value>(keys: string[], values: Value[], index?: number): number[];
        /**
         * return index
         */
        removeByKeys(keys: string[]): number;
        remove(keys: string[], index: number, length?: number): number[];
        clear(keys: string[]): number[];
        set<Value>(keys: string[], value: Value): string[];
        static wrap(data: any): any;
        static unwrap(data: any): any;
    }
    class DecoratorDefinition {
        type: string;
        name: string;
        oninitialize: (decorator: Decorator) => void;
        onchange: (decorator: Decorator, args: IDataChangeEvent<any>[]) => void;
        ondispose: (decorator: Decorator) => void;
        private static _modifiersMap;
        private static _processorsMap;
        private static _componentsMap;
        private static _attribute;
        private static _event;
        private static _text;
        private static _html;
        skipExpessionParsing: boolean;
        constructor(type: string, name: string, oninitialize?: (decorator: Decorator) => void, onchange?: (decorator: Decorator, args: IDataChangeEvent<any>[]) => void, ondispose?: (decorator: Decorator) => void);
        initialize(decorator: Decorator): void;
        change(decorator: Decorator, args: IDataChangeEvent<any>[]): void;
        invoke(decorator: Decorator, args?: IDataChangeEvent<any>[]): void;
        dispose(decorator: Decorator): void;
        static register(decorator: DecoratorDefinition): void;
        static getDefinition(type: string, name?: string): DecoratorDefinition;
        static typeToMark: IDictionary<string>;
    }
    class ModifierDefinition extends DecoratorDefinition {
        oninitialize: (decorator: Decorator) => void;
        onchange: (decorator: Decorator, args: IDataChangeEvent<any>[]) => void;
        constructor(name: string, oninitialize?: (decorator: Decorator) => void, onchange?: (decorator: Decorator, args: IDataChangeEvent<any>[]) => void);
        private _onscopechange(decorator, args);
        change(decorator: Decorator, args: IDataChangeEvent<any>[]): void;
    }
    /**
     * Create definition of a processor.
     *
     */
    class ProcessorDefinition extends DecoratorDefinition {
        oninitialize: (decorator: Decorator) => void;
        onchange: (decorator: Decorator, args: IDataChangeEvent<any>[]) => void;
        constructor(name: string, oninitialize?: (decorator: Decorator) => void, onchange?: (decorator: Decorator, args: IDataChangeEvent<any>[]) => void);
    }
    /**
     * Create definition of a component
     */
    class ComponentDefinition extends DecoratorDefinition {
        oninitialize: (decorator: Decorator) => void;
        onchange: (decorator: Decorator, args: IDataChangeEvent<any>[]) => void;
        constructor(name: string, oninitialize?: (decorator: Decorator) => void, onchange?: (decorator: Decorator, args: IDataChangeEvent<any>[]) => void);
    }
    interface IDecoratorTargetEnsureHandler {
        (node: HTMLElement): void;
    }
    /**
     * DecoratorTarget
     *
     */
    class DecoratorTarget {
        private _removedMarker;
        private _tempParentNode;
        private _start;
        private _end;
        start: Node;
        end: Node;
        constructor(startNode?: Node, endNode?: Node);
        initialized: boolean;
        initialize(startNode: Node, endNode?: Node): void;
        dispose(): void;
        /**
         * remove this target from DOM tree and insert an marker comment.
         * see also append()
         */
        remove(): void;
        /**
         * append the target back to DOM tree.
         * see also remove()
         */
        append(): void;
        each(handler: (node: HTMLElement, index: number) => void): void;
        private _ensureHandlers;
        private _ensure(nodes?);
        /**
         * ensure the handler will be called on every node, including nodes added later.
         * calling ensure the second time will remove the previous handler,
         * so every decorator has one single ensure handler that will be triggered
         * at the same time only.
         */
        ensure(handler: (node: HTMLElement) => void, decorator: Decorator): void;
        private _unwrap(fragment);
        replaceWith(fragment: DocumentFragment): DocumentFragment;
        replaceWith(node: Node): DocumentFragment;
        replaceWith(nodes: NodeList): DocumentFragment;
        replaceWith(nodes: Node[]): DocumentFragment;
        insertBefore(child: Node, refChild: Node): void;
        appendChild(child: Node): void;
    }
    /**
     * Decorator
     */
    class Decorator {
        target: DecoratorTarget;
        type: string;
        name: string;
        scope: Scope;
        definition: DecoratorDefinition;
        initialized: boolean;
        data: any;
        private _value;
        private _isValue;
        private _compoundExpression;
        private _isCompound;
        private _expression;
        expression: string;
        parsedExpression: string;
        private _expressionKeys;
        expressionKeys: string[];
        private _expressionFullIdKeys;
        expressionFullIdKeys: string[];
        private _scopeListenerTypes;
        private _listenerTypes;
        private _listener;
        hasDependency: boolean;
        constructor(target: DecoratorTarget, type: string, name: string, scope: Scope, expression: string);
        private _prepared;
        prepareDependencies(): void;
        private _pendingChangeDataArgs;
        invoke(arg: IDataChangeEvent<any>, sync?: boolean): void;
        initialize(): void;
        dispose(): void;
        expressionValue: any;
        private _getStringDependenciesInfo(str);
        private _getExpressionDependenciesInfo(compoundExpression);
    }
    function unwrapDataHelper(data: any): any;
    function createDataHelper(data: Data, keys: string[]): any;
    class ArrayDataHelper {
        private _data;
        private _keys;
        constructor(data: Data, keys: string[]);
        length: number;
        item<Value>(index: number): Value;
        valueOf<Value>(): Value;
        set<Value>(index: number, value: Value): void;
        push(...items: any[]): void;
        insert(items: any[], index?: number): void;
        remove(index: number, length?: number): void;
        clear(): void;
    }
    class ObjectDataHelper {
        private _data;
        constructor(data: Data, keys: string[]);
        valueOf<T>(): T;
    }
    interface IScopeDataChangeData<T> {
        oldValue?: T;
        value?: T;
    }
    interface IScopeDataChangeEvent<T> extends IScopeDataChangeData<T>, IEvent {
    }
    class Scope extends EventHost {
        fragmentTemplate: HTMLDivElement;
        modifier: Decorator;
        parentScope: Scope;
        private _scopeData;
        private _data;
        data: Data;
        childScopes: Scope[];
        decorators: Decorator[];
        private _fragmentDiv;
        fragment: DocumentFragment;
        constructor(fragmentTemplate: HTMLDivElement, modifier: Decorator, parentScope: Scope, data?: Data, scopeKeys?: string[], scopeData?: {});
        initialize(): void;
        private _fullScopeKeysSet;
        private _fullScopeKeys;
        fullScopeKeys: string[];
        dataHelper: any;
        private _setFullScopeKeys(scopeKeys?);
        setScopeData<T>(key: string, value: T): void;
        getScopeData<T>(key: string): T;
        setData<T>(fullIdKeys: string[], value: T): void;
        getData<T>(key: string): T;
        getData<T>(keys: string[]): T;
        getFullIdKeys(keys: string[]): string[];
        evaluate(keys: string[], isFullKeys?: boolean): any;
        evaluateString(str: string, isFullKeys?: boolean): string;
        evaluateExpression(expression: string, isFullKeys?: boolean): any;
        dispose(skipModifier?: boolean): void;
    }
    class Template {
        private static _fragmentDivsMap;
        scope: Scope;
        constructor(tpl: string, data: Data);
        insertTo(node: Node): void;
        private static _htmlEncode(text);
        static createById(templateId: string, data: Data): Template;
        static apply(templateId: string, data: Data, target: HTMLElement): Template;
        /**
         * a quick and simple helper to fill data to string
         */
        static fillString(tpl: string, data: any): string;
        static parse(tpl: string): HTMLDivElement;
    }
}
declare module Drop {
}

interface DropElement extends HTMLElement {
}
interface Element {
    getElementsByTagName(name: 'drop'): NodeListOf<DropElement>;
}
declare module Drop {
    var globalEval: typeof eval;
    interface IEventListener<T> {
        (event: IEventData): T;
    }
    interface IEventData {
        type?: string;
    }
    class EventHost {
        private _events;
        private _onceEvents;
        public on(type: string, listener: IEventListener<any>): void;
        public once(type: string, listener: IEventListener<any>): void;
        public off(type: string, listener: IEventListener<any>): void;
        public trigger(type: string, data?: any): boolean;
    }
    class XArray {
        private _indexToId;
        private _array;
        private _nextId;
        constructor(array?: any[]);
        public length : number;
        public id(index: number): number;
        public existsId(id: number): boolean;
        public item(index: number): any;
        public itemById(id: number): any;
        public range(index?: number, length?: number): any[];
        public add(item: any): number;
        public set(index: number, value: any): number;
        public setById(id: number, value: any): boolean;
        public insert(items: any[], index?: number): number[];
        public remove(index: number, length?: number): number[];
        /**
        * return index
        */
        public removeById(id: number): number;
        public clear(): number[];
    }
    enum DataChangeType {
        set = 0,
        insert = 1,
        remove = 2,
        clear = 3,
    }
    interface IDataChangeData<Value> {
        changeType: DataChangeType;
        ids?: number[];
        oldValue?: Value;
        value?: Value;
        values?: Value[];
        index?: number;
    }
    interface IDataChangeEventData<Value> extends IDataChangeData<Value>, IEventData {
        keys: string[];
    }
    interface IKeysInfo<Value> {
        keys: string[];
        value: Value;
    }
    class Data extends EventHost {
        private _data;
        constructor(data: any);
        public helper : any;
        public getIdKeysInfo(keys: string[]): IKeysInfo<any>;
        public get<Value>(keys: string[], getInGlobal?: boolean): Value;
        public existsKeyInScope(scopeKeys: string[], key: string): boolean;
        public getObjectKeys(keys: string[]): string[];
        private static _existsKey(data, key);
        private static _getIdKeysInfo<Value>(data, keys);
        private static _get<Value>(data, keys, getInGlobal?);
        public insert<Value>(keys: string[], values: Value[], index?: number): number[];
        /**
        * return index
        */
        public removeByKeys(keys: string[]): number;
        public remove(keys: string[], index: number, length?: number): number[];
        public clear(keys: string[]): number[];
        public set<Value>(keys: string[], value: Value): string[];
        static wrap(data: any): any;
        static unwrap(data: any): any;
    }
    class DecoratorDefinition {
        public type: string;
        public name: string;
        public oninitialize: (decorator: Decorator) => void;
        public onchange: (decorator: Decorator, args: IDataChangeEventData<any>[]) => void;
        public ondispose: (decorator: Decorator) => void;
        private static _modifiersMap;
        private static _processorsMap;
        private static _componentsMap;
        private static _attribute;
        private static _event;
        private static _text;
        private static _html;
        constructor(type: string, name: string, oninitialize?: (decorator: Decorator) => void, onchange?: (decorator: Decorator, args: IDataChangeEventData<any>[]) => void, ondispose?: (decorator: Decorator) => void);
        public initialize(decorator: Decorator): void;
        public change(decorator: Decorator, args: IDataChangeEventData<any>[]): void;
        public invoke(decorator: Decorator, args?: IDataChangeEventData<any>[]): void;
        public dispose(decorator: Decorator): void;
        static register(decorator: DecoratorDefinition): void;
        static getDefinition(type: string, name?: string): DecoratorDefinition;
        static typeToMark: IDictionary<string>;
    }
    class ModifierDefinition extends DecoratorDefinition {
        public oninitialize: (decorator: Decorator) => void;
        public onchange: (decorator: Decorator, args: IDataChangeEventData<any>[]) => void;
        constructor(name: string, oninitialize?: (decorator: Decorator) => void, onchange?: (decorator: Decorator, args: IDataChangeEventData<any>[]) => void);
        private _onscopechange(decorator, args);
        public change(decorator: Decorator, args: IDataChangeEventData<any>[]): void;
    }
    /**
    * Create definition of a processor.
    *
    */
    class ProcessorDefinition extends DecoratorDefinition {
        public oninitialize: (decorator: Decorator) => void;
        public onchange: (decorator: Decorator, args: IDataChangeEventData<any>[]) => void;
        constructor(name: string, oninitialize?: (decorator: Decorator) => void, onchange?: (decorator: Decorator, args: IDataChangeEventData<any>[]) => void);
    }
    /**
    * Create definition of a component
    */
    class ComponentDefinition extends DecoratorDefinition {
        public oninitialize: (decorator: Decorator) => void;
        public onchange: (decorator: Decorator, args: IDataChangeEventData<any>[]) => void;
        constructor(name: string, oninitialize?: (decorator: Decorator) => void, onchange?: (decorator: Decorator, args: IDataChangeEventData<any>[]) => void);
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
        public start : Node;
        public end : Node;
        constructor(startNode?: Node, endNode?: Node);
        public initialized: boolean;
        public initialize(startNode: Node, endNode?: Node): void;
        public dispose(): void;
        /**
        * remove this target from DOM tree and insert an marker comment.
        * see also append()
        */
        public remove(): void;
        /**
        * append the target back to DOM tree.
        * see also remove()
        */
        public append(): void;
        public each(handler: (node: HTMLElement, index: number) => void): void;
        private _ensureHandlers;
        private _ensure(nodes?);
        /**
        * ensure the handler will be called on every node, including nodes added later.
        * calling ensure the second time will remove the previous handler,
        * so every decorator has one single ensure handler that will be triggered
        * at the same time only.
        */
        public ensure(handler: (node: HTMLElement) => void, decorator: Decorator): void;
        public replaceWith(fragment: DocumentFragment): DocumentFragment;
        public replaceWith(node: Node): DocumentFragment;
        public replaceWith(nodes: NodeList): DocumentFragment;
        public replaceWith(nodes: Node[]): DocumentFragment;
        public insertBefore(child: Node, refChild: Node): void;
        public appendChild(child: Node): void;
    }
    /**
    * Decorator
    */
    class Decorator {
        public target: DecoratorTarget;
        public type: string;
        public name: string;
        public scope: Scope;
        public definition: DecoratorDefinition;
        public initialized: boolean;
        public data: any;
        private _value;
        private _isValue;
        private _compoundExpression;
        private _isCompound;
        private _expression;
        public expression : string;
        public parsedExpression : string;
        private _expressionKeys;
        public expressionKeys : string[];
        private _expressionFullIdKeys;
        public expressionFullIdKeys : string[];
        private _scopeListenerTypes;
        private _listenerTypes;
        private _listener;
        public hasDependency : boolean;
        constructor(target: DecoratorTarget, type: string, name: string, scope: Scope, expression: string);
        private _prepared;
        public prepareDependencies(): void;
        private _pendingChangeDataArgs;
        public invoke(arg: IDataChangeEventData<any>, sync?: boolean): void;
        public initialize(): void;
        public dispose(): void;
        public expressionValue : any;
        private _getStringDependenciesInfo(str);
        private _getExpressionDependenciesInfo(compoundExpression);
    }
    function createDataHelper(data: Data, keys: string[]): any;
    class ArrayDataHelper {
        private _data;
        private _keys;
        constructor(data: Data, keys: string[]);
        public length : number;
        public item<Value>(index: number): Value;
        public valueOf<Value>(): Value;
        public set<Value>(index: number, value: Value): void;
        public push(...items: any[]): void;
        public insert(items: any[], index?: number): void;
        public remove(index: number, length?: number): void;
        public clear(): void;
    }
    class ObjectDataHelper {
        constructor(data: Data, keys: string[]);
    }
    class Scope extends EventHost {
        public fragmentTemplate: HTMLDivElement;
        public modifier: Decorator;
        public parentScope: Scope;
        private _scopeData;
        private _data;
        public data : Data;
        public childScopes: Scope[];
        public decorators: Decorator[];
        private _fragmentDiv;
        public fragment : DocumentFragment;
        constructor(fragmentTemplate: HTMLDivElement, modifier: Decorator, parentScope: Scope, data?: Data, scopeKeys?: string[], scopeData?: {});
        public initialize(): void;
        private _fullScopeKeysSet;
        private _fullScopeKeys;
        public fullScopeKeys : string[];
        public dataHelper : any;
        private _setFullScopeKeys(scopeKeys?);
        public setScopeData(key: string, value: any): void;
        public setData(fullIdKeys: string[], value: any): void;
        public getData<Value>(key: string): Value;
        public getData<Value>(keys: string[]): Value;
        public getFullIdKeys(keys: string[]): string[];
        public evaluate(keys: string[], isFullKeys?: boolean): any;
        public evaluateString(str: string, isFullKeys?: boolean): string;
        public evaluateExpression(expression: string, isFullKeys?: boolean): any;
        public dispose(skipModifier?: boolean): void;
    }
    class Template {
        private static _fragmentDivsMap;
        public scope: Scope;
        constructor(tpl: string, data: Data);
        public appendTo(node: Node): void;
        private static _htmlEncode(text);
        static apply(templateId: string, data: Data, target: HTMLElement): Template;
        static parse(tpl: string): HTMLDivElement;
    }
}
declare module Drop {
}

interface DropElement extends HTMLElement {
}
interface Element {
    getElementsByTagName(name: 'drop'): NodeListOf<DropElement>;
}
declare module Drop {
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
        oldValue?: Value;
        value: Value;
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
        public getIdKeysInfo(keys: string[]): IKeysInfo<any>;
        public get<Value>(keys: string[]): Value;
        public existsKeyInScope(scopeKeys: string[], key: string): boolean;
        private static _existsKey(data, key);
        private static _getIdKeysInfo(data, keys);
        private static _get<Value>(data, keys, getInGlobal?);
        public set(keys: string[], value: any): void;
        private static _wrap(data);
        private static _unwrap(data);
    }
    class DecoratorDefinition {
        public type: string;
        public name: string;
        public oninitialize: (decorator: Decorator) => void;
        public onchange: (decorator: Decorator, args: IDataChangeEventData<any>[]) => void;
        public ondispose: (decorator: Decorator) => void;
        private static _modifiersMap;
        private static _processorsMap;
        private static _attribute;
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
    class ProcessorDefinition extends DecoratorDefinition {
        public oninitialize: (decorator: Decorator) => void;
        public onchange: (decorator: Decorator, args: IDataChangeEventData<any>[]) => void;
        constructor(name: string, oninitialize?: (decorator: Decorator) => void, onchange?: (decorator: Decorator, args: IDataChangeEventData<any>[]) => void);
    }
    class DecoratorTarget {
        public nodes: Node[];
        constructor(nodes?: Node[]);
        private _comment;
        public each(handler: (node: HTMLElement, index: number) => void): void;
        public replaceWith(nodes: DocumentFragment): any;
        public replaceWith(nodes: Node): any;
        public replaceWith(nodes: NodeList): any;
        public replaceWith(nodes: Node[]): any;
    }
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
        private _expressionKeys;
        public expressionKeys : string[];
        private _expressionFullIdKeys;
        public expressionFullIdKeys : string[];
        private _listenerTypes;
        private _listener;
        constructor(target: DecoratorTarget, type: string, name: string, scope: Scope, expression: string);
        private _prepared;
        public prepareDependencies(): void;
        private _pendingChangeDataArgs;
        public invoke(arg: IDataChangeEventData<any>, sync?: boolean): void;
        public initialize(): void;
        public dispose(): void;
        public expressionValue : any;
        private _getStringDependenciesInfo(str);
        private _getExpressionDependenciesInfo(expression);
    }
    class Scope extends EventHost {
        public fragmentTemplate: HTMLDivElement;
        public modifier: Decorator;
        public parentScope: Scope;
        private _data;
        public data : Data;
        public childScopes: Scope[];
        public decorators: Decorator[];
        private _fragmentDiv;
        public fragment : DocumentFragment;
        constructor(fragmentTemplate: HTMLDivElement, modifier: Decorator, parentScope: Scope, data?: Data, scopeKeys?: string[]);
        public initialize(): void;
        private _fullScopeKeysSet;
        private _fullScopeKeys;
        public fullScopeKeys : string[];
        private _setFullScopeKeys(scopeKeys?);
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

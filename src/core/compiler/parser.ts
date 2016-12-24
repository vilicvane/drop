import { Token, TokenType, tokenize } from './tokenizer';

export const enum NodeType {
    identifier,
    literal,
    memberExpression,
    conditionalExpression,
    callExpression,
    objectExpression,
    property,
    arrayExpression,
    unaryExpression,
    binaryExpression,
    logicalExpression
}

export interface NodeBase {
    type: NodeType;
    constant?: boolean;
    value?: any;
}

export interface Identifier extends NodeBase {
    type: NodeType.identifier;
    name: string;
}

export interface Literal extends NodeBase {
    type: NodeType.literal;
    value: any;
}

export interface UnaryExpression extends NodeBase {
    type: NodeType.unaryExpression;
    operator: string;
    prefix: boolean;
    argument: Expression;
}

export interface BinaryExpression extends NodeBase {
    type: NodeType.binaryExpression;
    operator: string;
    left: Expression;
    right: Expression;
}

export interface LogicalExpression extends NodeBase {
    type: NodeType.logicalExpression;
    operator: string;
    left: Expression;
    right: Expression;
}

export interface ConditionalExpression extends NodeBase {
    type: NodeType.conditionalExpression;
    test: Expression;
    alternate: Expression;
    consequent: Expression;
}

export interface ObjectExpression extends NodeBase {
    type: NodeType.objectExpression;
    properties: Property[];
}

export interface ArrayExpression extends NodeBase {
    type: NodeType.arrayExpression;
    elements: Expression[];
}

export interface Property extends NodeBase {
    type: NodeType.property;
    key: Expression;
    computed: boolean;
    value: Expression;
}

export interface MemberExpression extends NodeBase {
    type: NodeType.memberExpression;
    object: Expression;
    property: Expression;
    computed: boolean;
}

export interface CallExpression extends NodeBase {
    type: NodeType.callExpression;
    callee: Identifier;
    arguments: Expression[];
    filter?: boolean;
}

export type Expression =
    MemberExpression |
    CallExpression |
    ArrayExpression |
    ObjectExpression |
    UnaryExpression |
    BinaryExpression |
    LogicalExpression |
    ConditionalExpression |
    Identifier |
    Literal;

const hasOwnProperty = Object.prototype.hasOwnProperty;

const LITERALS_MAP: {
    [key: string]: any;
} = {
    true: true,
    false: false,
    null: null,
    undefined
};

class Parser {
    private tokens: Token[];

    parse(source: string): Expression[] {
        this.tokens = tokenize(source);

        let args = this.decoratorArguments();

        if (this.tokens.length) {
            throw this.error(`Unexpected token "${this.tokens[0].text}"`);
        }

        this.tokens = undefined!;

        return args;
    }

    private decoratorArguments(): Expression[] {
        let args: Expression[] = [];

        if (this.tokens.length) {
            do {
                args.push(this.filterChain());
            } while (this.expect(','));
        }

        return args;
    }

    private filterChain() {
        let left = this.expression();

        while (this.expect('|')) {
            left = this.filter(left);
        }

        return left;
    }

    private expression() {
        return this.ternary();
    }

    private ternary(): Expression {
        let test = this.logicalOR();

        if (this.expect('?')) {
            let alternate = this.expression();
            if (this.consume(':')) {
                let consequent = this.expression();

                return {
                    type: NodeType.conditionalExpression,
                    test,
                    alternate,
                    consequent
                } as ConditionalExpression;
            }
        }

        return test;
    }

    private logicalOR(): Expression {
        let left = this.logicalAND();

        while (this.expect('||')) {
            left = {
                type: NodeType.logicalExpression,
                operator: '||',
                left,
                right: this.logicalAND()
            } as LogicalExpression;
        }

        return left;
    }

    private logicalAND(): Expression {
        let left = this.equality();

        while (this.expect('&&')) {
            left = {
                type: NodeType.logicalExpression,
                operator: '&&',
                left,
                right: this.equality()
            } as LogicalExpression;
        }

        return left;
    }

    private equality(): Expression {
        let left = this.relational();

        let token: Token | undefined;
        while (token = this.expect('==', '!=', '===', '!==')) {
            left = {
                type: NodeType.binaryExpression,
                operator: token.text,
                left,
                right: this.relational()
            } as BinaryExpression;
        }

        return left;
    }

    private relational(): Expression {
        let left = this.additive();

        let token: Token | undefined;
        while (token = this.expect('<', '>', '<=', '>=')) {
            left = {
                type: NodeType.binaryExpression,
                operator: token.text,
                left,
                right: this.additive()
            } as BinaryExpression;
        }
        return left;
    }

    private additive(): Expression {
        let left = this.multiplicative();

        let token: Token | undefined;
        while (token = this.expect('+', '-')) {
            left = {
                type: NodeType.binaryExpression,
                operator: token.text,
                left,
                right: this.multiplicative()
            } as BinaryExpression;
        }

        return left;
    }

    private multiplicative(): Expression {
        let left = this.unary();

        let token: Token | undefined;
        while (token = this.expect('*', '/', '%')) {
            left = {
                type: NodeType.binaryExpression,
                operator: token.text,
                left,
                right: this.unary()
            } as BinaryExpression;
        }

        return left;
    }

    private unary(): Expression {
        let token: Token | undefined;
        if (token = this.expect('+', '-', '!')) {
            return {
                type: NodeType.unaryExpression,
                operator: token.text,
                prefix: true,
                argument: this.unary()
            } as UnaryExpression;
        } else {
            return this.primary();
        }
    }

    private primary(): Expression {
        let primary: Expression;

        if (this.expect('(')) {
            primary = this.filterChain();
            this.consume(')');
        } else if (this.expect('[')) {
            primary = this.array();
        } else if (this.expect('{')) {
            primary = this.object();
        } else if (this.tokens.length) {
            if (hasOwnProperty.call(LITERALS_MAP, this.tokens[0].text)) {
                primary = {
                    type: NodeType.literal,
                    value: LITERALS_MAP[this.consume().text]
                } as Literal;
            } else if (this.tokens[0].type === TokenType.identifier) {
                primary = this.identifier();
            } else if (this.tokens[0].constant) {
                primary = this.constant();
            } else {
                throw this.error(`Token "${this.tokens[0].text}" is not a primary expression`);
            }
        } else {
            throw this.error('Not a primary expression');
        }

        let next;
        while ((next = this.expect('(', '[', '.'))) {
            if (next.text === '(') {
                primary = {
                    type: NodeType.callExpression,
                    callee: primary,
                    arguments: this.callArguments()
                } as CallExpression;
                this.consume(')');
            } else if (next.text === '[') {
                primary = {
                    type: NodeType.memberExpression,
                    object: primary,
                    property: this.expression(),
                    computed: true
                } as MemberExpression;
                this.consume(']');
            } else if (next.text === '.') {
                primary = {
                    type: NodeType.memberExpression,
                    object: primary,
                    property: this.identifier(),
                    computed: false
                } as MemberExpression;
            } else {
                throw this.error('IMPOSSIBLE');
            }
        }

        return primary;
    }

    private filter(expression: Expression): CallExpression {
        let args = [expression];

        let result: CallExpression = {
            type: NodeType.callExpression,
            callee: this.identifier(),
            arguments: args,
            filter: true
        };

        if (this.expect('(')) {
            args.push(...this.callArguments());
            this.consume(')');
        }

        return result;
    }

    private callArguments(): Expression[] {
        let args: Expression[] = [];

        if (this.peekToken().text !== ')') {
            do {
                args.push(this.filterChain());
            } while (this.expect(','));
        }

        return args;
    }

    private identifier(): Identifier {
        let token = this.consume();

        if (token.type !== TokenType.identifier) {
            throw this.error(`Token "${token.text}" is not a valid identifier`);
        }

        return {
            type: NodeType.identifier,
            name: token.text
        };
    }

    private constant(): Literal {
        return {
            type: NodeType.literal,
            value: (<any>this.consume()).value
        };
    }

    private array(): ArrayExpression {
        let elements: Expression[] = [];

        if (this.peekToken().text !== ']') {
            do {
                if (this.peek(']')) {
                    // Support trailing commas per ES5.1.
                    break;
                }

                elements.push(this.expression());
            } while (this.expect(','));
        }

        this.consume(']');

        return {
            type: NodeType.arrayExpression,
            elements
        };
    }

    private object(): ObjectExpression {
        let properties: Property[] = [];

        if (this.peekToken().text !== '}') {
            do {
                if (this.peek('}')) {
                    // Support trailing commas per ES5.1.
                    break;
                }

                let property = {
                    type: NodeType.property
                } as Property;

                if (this.tokens[0].constant) {
                    property.key = this.constant();
                    property.computed = false;
                    this.consume(':');
                    property.value = this.expression();
                } else if (this.tokens[0].type === TokenType.identifier) {
                    property.key = this.identifier();
                    property.computed = false;
                    if (this.peek(':')) {
                        this.consume(':');
                        property.value = this.expression();
                    } else {
                        property.value = property.key;
                    }
                } else if (this.peek('[')) {
                    this.consume('[');
                    property.key = this.expression();
                    this.consume(']');
                    property.computed = true;
                    this.consume(':');
                    property.value = this.expression();
                } else {
                    throw this.error(`Invalid key "${this.tokens[0].text}"`);
                }

                properties.push(property);
            } while (this.expect(','));
        }

        this.consume('}');

        return {
            type: NodeType.objectExpression,
            properties
        };
    }

    private consume(expected?: string): Token {
        if (!this.tokens.length) {
            throw this.error('Unexpected end of expression');
        }

        let token = expected ? this.expect(expected) : this.tokens.shift();

        if (!token) {
            throw this.error(`Unexpected token "${this.tokens[0].text}"`);
        }

        return token;
    }

    private peekToken(): Token {
        if (!this.tokens.length) {
            throw this.error('Unexpected end of expression');
        }

        return this.tokens[0];
    }

    private peek(e1: string, e2?: string, e3?: string, e4?: string): Token | undefined {
        return this.peekAhead(0, e1, e2, e3, e4);
    }

    private peekAhead(offset: number, e1: string, e2?: string, e3?: string, e4?: string): Token | undefined {
        if (this.tokens.length > offset) {
            let token = this.tokens[offset];
            let text = token.text;

            if (text === e1 || text === e2 || text === e3 || text === e4) {
                return token;
            }
        }

        return undefined;
    }

    private expect(e1: string, e2?: string, e3?: string, e4?: string): Token | undefined {
        return this.peekAhead(0, e1, e2, e3, e4) && this.tokens.shift();
    }

    private error(message: string): SyntaxError {
        // TODO: detailed error information.
        return new SyntaxError(message);
    }

    private static isAssignable(node: Expression): node is Identifier | MemberExpression {
        return node.type === NodeType.identifier || node.type === NodeType.memberExpression;
    }
}

const parser = new Parser();

export function parse(source: string): Expression[] {
    return parser.parse(source);
}

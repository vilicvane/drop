const TOKEN_REGEX = /* /$token/ */ /([a-zA-Z$_]+[0-9a-zA-Z$_])|((["'])(?:(?!\3|[\\\r\n\u2028\u2029])[\s\S]|\\(?:['"\\bfnrtv]|[^'"\\bfnrtv\dxu\r\n\u2028\u2029]|0(?!\d)|x[\da-fA-F]{2}|u[\da-fA-F]{4})|\\(?:\r?\n|\r(?!\n)|[\u2028\u2029]))*(?:\3|()))|((?:(?:0|[1-9][0-9]*)\.[0-9]*(?:[eE][+-]?[0-9]+)?|\.[0-9]+(?:[eE][+-]?[0-9]+)?|(?:0|[1-9][0-9]*)(?:[eE][+-]?[0-9]+)?|0[bB][01]+|0[oO][0-7]+|0[xX][0-9a-fA-F]+)(?![a-zA-Z0-9$_]))|([(){}[\];,.?:])|([!=]==?|[<>]=?|[-+*\/%=!]|&&|\|\|?)|\s+|([0-9a-zA-Z$_]+|[^])/g;

/* /$token/ */
const enum TokenCapture {
    identifier = 1,
    stringLiteral,
    stringUnexpectedEnd = 4,
    numericLiteral,
    punctuation,
    operator,
    unexpectedToken
}

export const enum TokenType {
    identifier,
    numericLiteral,
    stringLiteral,
    punctuation,
    operator
}

export interface TokenBase {
    type: TokenType;
    text: string;
    constant?: boolean;
    start: number;
    end: number;
}

export interface Identifier extends TokenBase {
    type: TokenType.identifier;
}

export interface NumericLiteral extends TokenBase {
    type: TokenType.numericLiteral;
    value: number;
}

export interface StringLiteral extends TokenBase {
    type: TokenType.stringLiteral;
    value: string;
}

export interface Punctuation extends TokenBase {
    type: TokenType.punctuation;
}

export interface Operator extends TokenBase {
    type: TokenType.operator;
}

export type Token =
    Identifier |
    NumericLiteral |
    StringLiteral |
    Punctuation |
    Operator;

class Tokenizer {
    private source: string;
    private index: number;
    private tokens: Token[];

    tokenize(source: string): Token[] {
        this.source = source;
        this.index = 0;
        this.tokens = [];

        TOKEN_REGEX.lastIndex = this.index;

        let captures: RegExpExecArray | null;

        while (captures = TOKEN_REGEX.exec(this.source)) {
            let start = this.index;
            this.index = TOKEN_REGEX.lastIndex;

            let identifier = captures[TokenCapture.identifier];

            if (identifier) {
                this.tokens.push({
                    type: TokenType.identifier,
                    text: identifier,
                    start,
                    end: this.index
                });

                continue;
            }

            let numericLiteral = captures[TokenCapture.numericLiteral];

            if (numericLiteral) {
                this.tokens.push({
                    type: TokenType.numericLiteral,
                    text: numericLiteral,
                    constant: true,
                    value: Number(numericLiteral),
                    start,
                    end: this.index
                });

                continue;
            }

            let stringLiteral = captures[TokenCapture.stringLiteral];

            if (stringLiteral) {
                let stringUnexpectedEnd = captures[TokenCapture.stringUnexpectedEnd];

                if (typeof stringUnexpectedEnd === 'string') {
                    throw this.error('Unexpected end of string');
                }

                this.tokens.push({
                    type: TokenType.stringLiteral,
                    text: stringLiteral,
                    constant: true,
                    value: eval(stringLiteral),
                    start,
                    end: this.index
                });

                continue;
            }

            let punctuation = captures[TokenCapture.punctuation];

            if (punctuation) {
                this.tokens.push({
                    type: TokenType.punctuation,
                    text: punctuation,
                    start,
                    end: this.index
                });

                continue;
            }

            let operator = captures[TokenCapture.operator];

            if (operator) {
                this.tokens.push({
                    type: TokenType.operator,
                    text: operator,
                    start,
                    end: this.index
                });

                continue;
            }

            let unexpectedToken = captures[TokenCapture.unexpectedToken];

            if (unexpectedToken) {
                throw this.error(`Unexpected token "${unexpectedToken}"`);
            }
        }

        let tokens = this.tokens;

        this.source = undefined!;
        this.index = undefined!;
        this.tokens = undefined!;

        return tokens;
    }

    private error(message: string): SyntaxError {
        // TODO: detailed error information.
        return new SyntaxError(message);
    }
}

const tokenizer = new Tokenizer();

export function tokenize(source: string): Token[] {
    return tokenizer.tokenize(source);
}

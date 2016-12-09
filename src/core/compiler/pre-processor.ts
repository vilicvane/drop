const PRE_START_REGEX = /* /$preStart/ */ /\\([^])|\[([#@+]?)([a-zA-Z$_]+[0-9a-zA-Z$_]*)|\{(=)?/g;
const PRE_TOKEN_REGEX = /* /$preToken/ */ /(["'])(?:(?!\1|[\\\r\n\u2028\u2029])[\s\S]|\\(?:['"\\bfnrtv]|[^'"\\bfnrtv\dxu\r\n\u2028\u2029]|0(?!\d)|x[\da-fA-F]{2}|u[\da-fA-F]{4})|\\(?:\r?\n|\r(?!\n)|[\u2028\u2029]))*\1|([([{])|([)\]}])|[^]/g;

/* /$preStart/ */
const enum PreStartCapture {
    escaped = 1,
    type,
    identifier,
    raw
}

/* /$preToken/ */
const enum PreTokenCapture {
    openingBracket = 2,
    closingBracket
}

const enum PreProcessFlags {
    expression = 0x01,
    templateString = 0x02
}

type StackElement = ')' | ']' | '}';

export default class PreProcessor {
    private index = 0;
    private output = '';

    private stack: StackElement[] = [];

    constructor(
        public source: string
    ) { }

    process(): string {
        PRE_START_REGEX.lastIndex = this.index;

        let captures;

        while (captures = PRE_START_REGEX.exec(this.source)) {
            this.output += this.source.slice(this.index, PRE_START_REGEX.lastIndex - captures[0].length);
            this.index = PRE_START_REGEX.lastIndex;

            let escaped = captures[PreStartCapture.escaped];

            if (escaped) {
                this.output += escaped;
                continue;
            }

            let identifier = captures[PreStartCapture.identifier];

            if (identifier) {
                switch (captures[PreStartCapture.type]) {
                    case '#':
                        this.output += `<dp:decorator name="${identifier}" type="modifier">`;
                        break;
                    case '':
                        this.output += `<dp:decorator name="${identifier}" type="processor">`;
                        break;
                    case '@':
                    case '+':
                    default:
                        break;
                }

                this.pushStack(']');
                this.readTokens();

                this.output += '</dp:decorator>';
            } else {
                this.output += `<dp:decorator name="${captures[PreStartCapture.raw] ? 'html' : 'text'}" type="processor">`;

                this.pushStack('}');
                this.readTokens();

                this.output += '</dp:decorator>';
                this.output += '<dp:target></dp:target>';
            }

            PRE_START_REGEX.lastIndex = this.index;
        }

        this.output += this.source.slice(this.index);

        return this.output;
    }

    private readTokens(): void {
        let expression = '';

        PRE_TOKEN_REGEX.lastIndex = this.index;

        let captures;

        while (captures = PRE_TOKEN_REGEX.exec(this.source)) {
            expression += this.source.slice(this.index, PRE_TOKEN_REGEX.lastIndex - captures[0].length);
            this.index = PRE_TOKEN_REGEX.lastIndex;

            let openingBracket = captures[PreTokenCapture.openingBracket];

            if (openingBracket) {
                expression += openingBracket;

                switch (openingBracket) {
                    case '(':
                        this.pushStack(')');
                        break;
                    case '[':
                        this.pushStack(']');
                        break;
                    case '{':
                        this.pushStack('}');
                        break;
                }

                continue;
            }

            let closingBracket = captures[PreTokenCapture.closingBracket] as StackElement;

            if (closingBracket) {
                if (this.popStack(closingBracket)) {
                    this.output += expression
                        .replace(/[<>]/g, text => text === '<' ? '&lt;' : '&gt;')
                        .trim();
                    return;
                }

                expression += closingBracket;
                continue;
            }

            expression += captures[0];
        }

        this.throw('Unexpected end of source');
    }

    private throw(message: string): never {
        // TODO: detailed error information.
        throw new SyntaxError(message);
    }

    private pushStack(element: StackElement): void {
        this.stack.push(element);
    }

    private popStack(actual: StackElement): boolean {
        let expected = this.stack.pop();
        if (expected !== actual) {
            this.throw(`Unexpected token "${actual}"`)
        }
        return !this.stack.length;
    }
}

export function process(source: string): string {
    return new PreProcessor(source).process();
}

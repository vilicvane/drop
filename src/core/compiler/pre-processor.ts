const PRE_START_REGEX = /* /$preStart/ */ /\\([^])|\[([#@+]?)([0-9a-zA-Z$_-]+)(?::([a-zA-Z$_][0-9a-zA-Z$_]*))?(?:=([a-zA-Z$_][0-9a-zA-Z$_]*(?:\.[a-zA-Z$_][0-9a-zA-Z$_]*)*))?|\{(=)?/g;
const PRE_TOKEN_REGEX = /* /$preToken/ */ /(["'])(?:(?!\1|[\\\r\n\u2028\u2029])[\s\S]|\\(?:['"\\bfnrtv]|[^'"\\bfnrtv\dxu\r\n\u2028\u2029]|0(?!\d)|x[\da-fA-F]{2}|u[\da-fA-F]{4})|\\(?:\r?\n|\r(?!\n)|[\u2028\u2029]))*(?:\1|())|([([{])|([)\]}])|[^]/g;

/* /$preStart/ */
const enum PreStartCapture {
    escaped = 1,
    type,
    name,
    label,
    model,
    raw
}

/* /$preToken/ */
const enum PreTokenCapture {
    stringUnexpectedEnd = 2,
    openingBracket,
    closingBracket
}

const enum PreProcessFlags {
    expression = 0x01,
    templateString = 0x02
}

type StackElement = ')' | ']' | '}';

class PreProcessor {
    private source: string;
    private index: number;
    private output: string;
    private stack: StackElement[];

    process(source: string): string {
        this.source = source;
        this.index = 0;
        this.output = '';
        this.stack = [];

        PRE_START_REGEX.lastIndex = this.index;

        let captures: RegExpExecArray | null;

        while (captures = PRE_START_REGEX.exec(this.source)) {
            this.output += this.source.slice(this.index, PRE_START_REGEX.lastIndex - captures[0].length);
            this.index = PRE_START_REGEX.lastIndex;

            let escaped = captures[PreStartCapture.escaped];

            if (escaped) {
                this.output += escaped;
                continue;
            }

            let name = captures[PreStartCapture.name];

            if (name) {
                let attributesStr = `name="${name}"`;

                switch (captures[PreStartCapture.type]) {
                    case '#':
                        attributesStr += ' type="modifier"';
                        break;
                    case '':
                        attributesStr += ' type="processor"';
                        break;
                    /* istanbul ignore next */
                    default:
                        throw this.error(`Decorator type "${captures[PreStartCapture.type]}" has not been supported yet`);
                }

                let label = captures[PreStartCapture.label];
                let model = captures[PreStartCapture.model];

                if (label) {
                    attributesStr += ` label="${label}"`;
                }

                if (model) {
                    attributesStr += ` model="${model}"`;
                }

                this.output += `<dp:decorator ${attributesStr}>`;

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

        let output = this.output;

        this.source = undefined!;
        this.index = undefined!;
        this.output = undefined!;
        this.stack = undefined!

        return output;
    }

    private readTokens(): void {
        let expression = '';

        PRE_TOKEN_REGEX.lastIndex = this.index;

        let captures: RegExpExecArray | null;

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

        throw this.error('Unexpected end of source');
    }

    private error(message: string): SyntaxError {
        // TODO: detailed error information.
        return new SyntaxError(message);
    }

    private pushStack(element: StackElement): void {
        this.stack.push(element);
    }

    private popStack(actual: StackElement): boolean {
        let expected = this.stack.pop();
        if (expected !== actual) {
            throw this.error(`Unexpected token "${actual}"`)
        }
        return !this.stack.length;
    }
}

const processor = new PreProcessor();

export function process(source: string): string {
    return processor.process(source);
}

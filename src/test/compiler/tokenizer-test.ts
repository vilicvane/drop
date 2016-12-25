import { TokenType, tokenize } from '../../core/compiler/tokenizer';

describe('compiler', () => {
    describe('tokenizer', () => {
        it('should tokenize empty source', () => {
            tokenize('').should.deep.equal([]);
        });

        it('should tokenize source with identifiers', () => {
            tokenize('foo.bar').should.deep.equal([
                {
                    type: TokenType.identifier,
                    text: 'foo',
                    start: 0,
                    end: 3
                },
                {
                    type: TokenType.punctuation,
                    text: '.',
                    start: 3,
                    end: 4
                },
                {
                    type: TokenType.identifier,
                    text: 'bar',
                    start: 4,
                    end: 7
                }
            ]);
        });

        it('should tokenize source with numeric literals', () => {
            tokenize('(123e4)').should.deep.equal([
                {
                    type: TokenType.punctuation,
                    text: '(',
                    start: 0,
                    end: 1
                },
                {
                    type: TokenType.numericLiteral,
                    text: '123e4',
                    constant: true,
                    value: 123e4,
                    start: 1,
                    end: 6
                },
                {
                    type: TokenType.punctuation,
                    text: ')',
                    start: 6,
                    end: 7
                }
            ]);

            tokenize('1 + 2').should.deep.equal([
                {
                    type: TokenType.numericLiteral,
                    text: '1',
                    constant: true,
                    value: 1,
                    start: 0,
                    end: 1
                },
                {
                    type: TokenType.operator,
                    text: '+',
                    start: 2,
                    end: 3
                },
                {
                    type: TokenType.numericLiteral,
                    text: '2',
                    constant: true,
                    value: 2,
                    start: 4,
                    end: 5
                }
            ]);

            tokenize.bind(undefined, '123abc').should.throw('Unexpected token "123abc"');
        });

        it('should tokenize source with string literals', () => {
            tokenize('"foo" + \'bar\'').should.deep.equal([
                {
                    type: TokenType.stringLiteral,
                    text: '"foo"',
                    constant: true,
                    value: 'foo',
                    start: 0,
                    end: 5
                },
                {
                    type: TokenType.operator,
                    text: '+',
                    start: 6,
                    end: 7
                },
                {
                    type: TokenType.stringLiteral,
                    text: '\'bar\'',
                    constant: true,
                    value: 'bar',
                    start: 8,
                    end: 13
                }
            ]);

            tokenize.bind(undefined, '"foo').should.throw('Unexpected end of string');
        });
    });
});

import { tokenize } from '../../core/compiler/tokenizer';

describe('compiler', () => {
    describe('tokenizer', () => {
        it('should tokenize empty source', () => {
            tokenize('').should.deep.equal([]);
        });

        it('should tokenize source with identifiers', () => {
            tokenize('foo.bar').should.deep.equal([
                {
                    type: 'identifier',
                    text: 'foo',
                    source: 'foo',
                    start: 0,
                    end: 3
                },
                {
                    type: 'punctuation',
                    text: '.',
                    source: '.',
                    start: 3,
                    end: 4
                },
                {
                    type: 'identifier',
                    text: 'bar',
                    source: 'bar',
                    start: 4,
                    end: 7
                }
            ]);
        });

        it('should tokenize source with numeric literals', () => {
            tokenize('(123e4)').should.deep.equal([
                {
                    type: 'punctuation',
                    text: '(',
                    source: '(',
                    start: 0,
                    end: 1
                },
                {
                    type: 'numeric-literal',
                    value: 123e4,
                    source: '123e4',
                    start: 1,
                    end: 6
                },
                {
                    type: 'punctuation',
                    text: ')',
                    source: ')',
                    start: 6,
                    end: 7
                }
            ]);
        });

        it('should tokenize source with string literals', () => {
            tokenize('"foo" + \'bar\'').should.deep.equal([
                {
                    type: 'string-literal',
                    value: 'foo',
                    source: '"foo"',
                    start: 0,
                    end: 5
                },
                {
                    type: 'operator',
                    text: '+',
                    source: '+',
                    start: 6,
                    end: 7
                },
                {
                    type: 'string-literal',
                    value: 'bar',
                    source: '\'bar\'',
                    start: 8,
                    end: 13
                }
            ]);

            tokenize.bind(undefined, '"foo').should.throw('Unexpected end of string');
        });
    });
});

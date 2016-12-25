import { process } from '../../core/compiler/pre-processor';

describe('compiler', () => {
    describe('pre-processor', () => {
        it('should process empty source', () => {
            process('').should.equal('');
        });

        it('should process plain source', () => {
            process('<div></div>').should.equal('<div></div>');
        });

        it('should process source with escaped characters', () => {
            process('<div>\\{</div>').should.equal('<div>{</div>');
            process('\\[test]<div>\\{</div>').should.equal('[test]<div>{</div>');
        });

        it('should process source with processor', () => {
            process('[test]\n<div></div>')
                .should.equal('<dp:decorator name="test" type="processor"></dp:decorator>\n<div></div>');
            process('[test foo]\n<div></div>')
                .should.equal('<dp:decorator name="test" type="processor">foo</dp:decorator>\n<div></div>');
            process('[test (foo)]\n<div></div>')
                .should.equal('<dp:decorator name="test" type="processor">(foo)</dp:decorator>\n<div></div>');
            process('[test [foo]]\n<div></div>')
                .should.equal('<dp:decorator name="test" type="processor">[foo]</dp:decorator>\n<div></div>');
            process('[test {foo}]\n<div></div>')
                .should.equal('<dp:decorator name="test" type="processor">{foo}</dp:decorator>\n<div></div>');
            process('[test [foo + "]"]]\n<div></div>')
                .should.equal('<dp:decorator name="test" type="processor">[foo + "]"]</dp:decorator>\n<div></div>');
            process('[test:foo bar]\n<div></div>')
                .should.equal('<dp:decorator name="test" type="processor" label="foo">bar</dp:decorator>\n<div></div>');
            process('[test=foo bar]\n<div></div>')
                .should.equal('<dp:decorator name="test" type="processor" model="foo">bar</dp:decorator>\n<div></div>');
            process('[test=foo.pia bar]\n<div></div>')
                .should.equal('<dp:decorator name="test" type="processor" model="foo.pia">bar</dp:decorator>\n<div></div>');
            process('[test:yo=foo.pia bar]\n<div></div>')
                .should.equal('<dp:decorator name="test" type="processor" label="yo" model="foo.pia">bar</dp:decorator>\n<div></div>');
            process.bind(undefined, '[test [foo + "]"\n<div></div>')
                .should.throw('Unexpected end of source');
        });

        it('should process source with modifier', () => {
            process('[#test]\n<div></div>')
                .should.equal('<dp:decorator name="test" type="modifier"></dp:decorator>\n<div></div>');
            process('[#test foo]\n<div></div>')
                .should.equal('<dp:decorator name="test" type="modifier">foo</dp:decorator>\n<div></div>');
        });

        it('should process source with template', () => {
            process('<div>{value + {}}</div>')
                .should.equal('<div><dp:decorator name="text" type="processor">value + {}</dp:decorator><dp:target></dp:target></div>');
            process('<div>{=["<br>"]}</div>')
                .should.equal('<div><dp:decorator name="html" type="processor">["&lt;br&gt;"]</dp:decorator><dp:target></dp:target></div>');
        });

        it('should throw error on unmatched brackets', () => {
            process.bind(undefined, '[test (]').should.throw('Unexpected token');
        });
    });
});

module Drop {

    // @attribute

    var attributeDefinition = new DecoratorDefinition('attribute', null);

    attributeDefinition.onchange = (decorator, args) => {
        decorator.target.each((target: Element) => {
            if (target.setAttribute) {
                target.setAttribute(decorator.name, decorator.expressionValue);
            }
        });
    };

    DecoratorDefinition.register(attributeDefinition);

    // =html

    var htmlDefinition = new DecoratorDefinition('html', null);

    htmlDefinition.onchange = (decorator, args) => {
        var value = decorator.expressionValue;
        if (value === undefined) {
            value = '';
        }

        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = value;

        decorator.target.replaceWith(tempDiv.childNodes);
    };

    DecoratorDefinition.register(htmlDefinition);

    // text

    var textDefinition = new DecoratorDefinition('text', null);

    textDefinition.onchange = (decorator, args) => {
        var value = decorator.expressionValue;
        if (value === undefined) {
            value = '';
        }
        var textNode = document.createTextNode(value);
        decorator.target.replaceWith(textNode);
    };

    DecoratorDefinition.register(textDefinition);

    // #scope

    var scopeDefinition = new ModifierDefinition('scope');

    scopeDefinition.onchange = (modifier) => {
        var scope = modifier.scope;
        scope.initialize();
        modifier.target.replaceWith(scope.fragment);
    };

    DecoratorDefinition.register(scopeDefinition);

    // #each

    var eachDefinition = new ModifierDefinition('each');

    eachDefinition.oninitialize = modifier => {
        var scope = modifier.scope;

        var fragmentTemplate = scope.fragmentTemplate;

        var items: any[] = modifier.expressionValue;
        if (!items) {
            return;
        }

        var fragment = document.createDocumentFragment();

        for (var i = 0; i < items.length; i++) {
            var subScope = new Scope(<HTMLDivElement>fragmentTemplate.cloneNode(true), null, scope, null, [i.toString()], {
                index: i
            });
            fragment.appendChild(subScope.fragment);
        }

        modifier.target.replaceWith(fragment);
    };

    eachDefinition.onchange = (modifier, args) => {
        modifier.initialize();
        return;

        args.forEach(arg => {

            switch (arg.changeType) {
                case DataChangeType.set:
                case DataChangeType.clear:
                    modifier.initialize();
                    return;
            }

            // insert


            // remove

            // maybe move, etc...
        });
    };

    DecoratorDefinition.register(eachDefinition);

    // %bind-value

    // target limitation in the future?
    var bindValueDefinition = new ProcessorDefinition('bind-value');

    bindValueDefinition.oninitialize = processor => {
        var value = processor.expressionValue;
        var idKeys = processor.expressionFullIdKeys;

        processor.target.each(ele => {
            (<any>ele).value = value;
            (<HTMLElement>ele).addEventListener('change', onchange);
            (<HTMLElement>ele).addEventListener('input', onchange);
            (<HTMLElement>ele).addEventListener('paste', onchange);
        });

        processor.data = {
            onchange: onchange
        };

        function onchange() {
            processor.scope.data.set(idKeys, this.value);
        }
    };

    bindValueDefinition.onchange = (processor, args) => {
        var value = processor.expressionValue;

        processor.target.each(ele => {
            (<any>ele).value = value;
        });
    };

    bindValueDefinition.ondispose = processor => {
        var onchange = processor.data.onchange;

        processor.target.each(ele => {
            (<HTMLElement>ele).removeEventListener('change', onchange);
            (<HTMLElement>ele).removeEventListener('input', onchange);
            (<HTMLElement>ele).removeEventListener('paste', onchange);
        });
    };

    DecoratorDefinition.register(bindValueDefinition);

    // %var
    var varDefinition = new ProcessorDefinition('var');

    varDefinition.oninitialize = (processor) => {
        var expression = processor.expression;

        var index = expression.indexOf('=');

        var name: string;
        var value: any;
        
        if (index < 0) {
            name = expression.trim();
        } else {
            name = expression.substr(0, index).trim();

            var valueExpression = expression.substr(index + 1).trim();
            try {
                value = globalEval(valueExpression);
            } catch (e) {
                throw new e.construcotr('[drop %var] can not initialize the value of ' + name + ': ' + e.message);
            }
        }

        if (!/^[a-z$_][\w$]*$/i.test(name)) {
            throw new SyntaxError('[drop %var] invalid variable name "' + name + '"');
        }

        processor.scope.setScopeData(name, value);
    };

    varDefinition.onchange = (processor, args) => { };

    DecoratorDefinition.register(varDefinition);

    // %click

    var clickDefinition = new ProcessorDefinition('click');

    clickDefinition.onchange = (processor, args) => {
        var onclick = processor.expressionValue;
        processor.target.each(ele => {
            ele.addEventListener('click', onclick);
        });
    };

    clickDefinition.ondispose = (processor) => {
        var onclick = processor.expressionValue;
        processor.target.each(ele => {
            ele.removeEventListener('click', onclick);
        });
    };

    DecoratorDefinition.register(clickDefinition);

    // %click-toggle

    var clickToggleDefinition = new ProcessorDefinition('click-toggle');

    clickToggleDefinition.oninitialize = (processor) => {
        var fullIdKeys = processor.expressionFullIdKeys;

        if (!fullIdKeys) {
            throw new TypeError('[drop %click-toggle] expression "' + processor.expression + '" is not valid for toggle');
        }

        processor.data = {
            onclick: () => {
                var value = !processor.expressionValue;
                if (fullIdKeys[0] == 'this') {
                    processor.scope.setScopeData(fullIdKeys[1], value);
                } else {
                    processor.scope.data.set(fullIdKeys, value);
                }
            }
        };

        processor.target.each(ele => {
            ele.addEventListener('click', processor.data.onclick);
        });
    };

    clickToggleDefinition.onchange = (processor, args) => { };

    clickToggleDefinition.ondispose = (processor) => {
        var onclick = processor.data.onclick;
        processor.target.each(ele => {
            ele.removeEventListener('click', onclick);
        });
    };

    DecoratorDefinition.register(clickToggleDefinition);

    // %show

    var showDefinition = new ProcessorDefinition('show');

    showDefinition.onchange = (processor, args) => {
        var value = processor.expressionValue;
        processor.target.each(ele => {
            ele.style.display = value ? '' : 'none';
        });
    };

    DecoratorDefinition.register(showDefinition);
}
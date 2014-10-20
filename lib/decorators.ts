module Drop {

    // @attribute

    var attributeDefinition = new DecoratorDefinition('attribute', null);

    attributeDefinition.onchange = (decorator, args) => {
        decorator.target.nodes.forEach((target: Element) => {
            if (target.setAttribute) {
                target.setAttribute(decorator.name, decorator.expressionValue);
            }
        });
    };

    DecoratorDefinition.register(attributeDefinition);

    // =html

    var htmlDefinition = new DecoratorDefinition('html', null);

    htmlDefinition.onchange = (decorator, args) => {
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = decorator.expressionValue;

        decorator.target.replaceWith(tempDiv.childNodes);
    };

    DecoratorDefinition.register(htmlDefinition);

    // text

    var textDefinition = new DecoratorDefinition('text', null);

    textDefinition.onchange = (decorator, args) => {
        var textNode = document.createTextNode(decorator.expressionValue);
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
            var subScope = new Scope(<HTMLDivElement>fragmentTemplate.cloneNode(true), null, scope, null, [i.toString()]);
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

        processor.target.nodes.forEach((node: any) => {
            node.value = value;
            (<HTMLElement>node).addEventListener('change', onchange);
            (<HTMLElement>node).addEventListener('input', onchange);
            (<HTMLElement>node).addEventListener('paste', onchange);
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

        processor.target.nodes.forEach((node: any) => {
            node.value = value;
        });
    };

    bindValueDefinition.ondispose = processor => {
        var onchange = processor.data.onchange;

        processor.target.nodes.forEach((node: any) => {
            (<HTMLElement>node).removeEventListener('change', onchange);
            (<HTMLElement>node).removeEventListener('input', onchange);
            (<HTMLElement>node).removeEventListener('paste', onchange);
        });
    };

    DecoratorDefinition.register(bindValueDefinition);

    // %click

    var clickDefinition = new ProcessorDefinition('click');

    clickDefinition.onchange = (processor, args) => {
        var onclick = processor.expressionValue;
        processor.target.nodes.forEach((ele: HTMLElement) => {
            ele.addEventListener('click', onclick);
        });
    };

    clickDefinition.ondispose = (processor) => {
        var onclick = processor.expressionValue;
        processor.target.nodes.forEach((ele: HTMLElement) => {
            ele.removeEventListener('click', onclick);
        });
    };

    DecoratorDefinition.register(clickDefinition);

}
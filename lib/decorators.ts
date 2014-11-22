module Drop {

    // @attribute

    var attributeDefinition = new DecoratorDefinition('attribute', null);

    attributeDefinition.onchange = (decorator, args) => {
        var name = decorator.name;
        var keys = name.split('.');
        var value: string = decorator.expressionValue;

        var prevClass: string;

        if (name == 'class') {
            if (decorator.data) {
                prevClass = decorator.data.class;
            } else {
                decorator.data = {};
            }

            if (prevClass == value) {
                return;
            }

            decorator.data.class = value;
        }

        decorator.target.ensure(ele => {
            if (keys.length == 2) {
                var key = keys[0];

                if (key in ele) {
                    ele[key][keys[1]] = value;
                }
            } else if (name == 'class' && ele.classList) {
                if (prevClass) {
                    prevClass
                        .split(' ')
                        .forEach(className => className && ele.classList.remove(className));
                }

                if (value) {
                    value
                        .split(' ')
                        .forEach(className => className && ele.classList.add(className));
                }
            } else if (ele.setAttribute) {
                ele.setAttribute(name, value);
            }
        }, decorator);
    };

    DecoratorDefinition.register(attributeDefinition);

    // >event

    var eventDefinition = new DecoratorDefinition('event', null);

    eventDefinition.oninitialize = decorator => {
        var type = decorator.name;

        function handler(e: MouseEvent) {
            var onevent = decorator.expressionValue;
            if (typeof onevent == 'function') {
                onevent.call(this, e, decorator.scope);
            }
        }

        decorator.target.ensure(ele => {
            ele.addEventListener(type, handler);
        }, decorator);
    };

    eventDefinition.onchange = (decorator, args) => { };

    DecoratorDefinition.register(eventDefinition);

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

    scopeDefinition.onchange = modifier => {
        var scope = modifier.scope;
        scope.initialize();
        modifier.target.replaceWith(scope.fragment);
    };

    DecoratorDefinition.register(scopeDefinition);

    // #each

    module EachModifier {
        var splice = Array.prototype.splice;

        function remove(e, scope: Scope) {
            var keys = scope.fullScopeKeys;
            scope.data.removeByKeys(keys);
        }

        interface IIndexTarget {
            comment: Comment;
            scope: Scope;
        }

        var eachDefinition = new ModifierDefinition('each');

        eachDefinition.oninitialize = modifier => {
            var scope = modifier.scope;

            var indexTargets: IIndexTarget[] = [];

            modifier.data = {
                indexTargets: indexTargets
            };

            var fragmentTemplate = scope.fragmentTemplate;

            var items: any[] = modifier.expressionValue;
            if (!items || !items.length) {
                modifier.target.replaceWith(null);
                return;
            }

            var fragment = document.createDocumentFragment();

            for (var i = 0; i < items.length; i++) {
                var subScope = new Scope(<HTMLDivElement>fragmentTemplate.cloneNode(true), null, scope, null, [i.toString()], {
                    index: i,
                    remove: remove
                });

                var comment = document.createComment(subScope.fullScopeKeys.join('.'));

                indexTargets.push({
                    comment: comment,
                    scope: subScope
                });

                fragment.appendChild(comment);
                fragment.appendChild(subScope.fragment);
            }

            modifier.target.replaceWith(fragment);
        };

        eachDefinition.onchange = (modifier, args) => {
            if (!args) {
                modifier.initialize();
                return;
            }

            args.forEach(arg => {
                var scope = modifier.scope;

                switch (arg.changeType) {
                    case DataChangeType.clear:
                        scope.dispose(true);
                    case DataChangeType.set:
                        modifier.initialize();
                        break;
                    case DataChangeType.insert:
                        var fragmentTemplate = scope.fragmentTemplate;

                        var index = arg.index;
                        var items = arg.values;
                        var length = items.length;

                        if (!length) {
                            break;
                        }

                        var fragment = document.createDocumentFragment();
                        var tempIndexTargets: IIndexTarget[] = [];
                        var indexTargets: IIndexTarget[] = modifier.data.indexTargets;

                        var subScopes = scope.childScopes;
                        var pendingSubScopes: Scope[] = [];

                        for (var i = index; i < index + length; i++) {
                            var subScope = new Scope(<HTMLDivElement>fragmentTemplate.cloneNode(true), null, scope, null, [i.toString()], {
                                index: i,
                                remove: remove
                            });

                            console.log(subScope.fullScopeKeys);

                            pendingSubScopes.push(subScopes.pop());

                            var comment = document.createComment(subScope.fullScopeKeys.join('.'));

                            tempIndexTargets.push({
                                comment: comment,
                                scope: subScope
                            });

                            fragment.appendChild(comment);
                            fragment.appendChild(subScope.fragment);
                        }

                        var target = indexTargets[index];

                        var targetComment = target && target.comment;

                        for (var i = index; i < indexTargets.length; i++) {
                            indexTargets[i].scope.setScopeData('index', i + length);
                        }

                        splice.apply(indexTargets, (<any[]>[index, 0]).concat(tempIndexTargets));
                        splice.apply(subScopes, (<any[]>[index, 0]).concat(pendingSubScopes));

                        modifier.target.insertBefore(fragment, targetComment);
                        break;
                    case DataChangeType.remove:
                        var index = arg.index;
                        var ids = arg.ids;
                        var length = ids.length;
                        if (!length) {
                            break;
                        }

                        var subScopes = scope.childScopes;
                        var indexTargets: IIndexTarget[] = modifier.data.indexTargets;

                        var target = indexTargets[index];
                        var endTarget = indexTargets[index + length];

                        var targetNode: Node = target.comment;
                        var parentNode = targetNode.parentNode;
                        var endTargetNode = endTarget && endTarget.comment || modifier.target.end;

                        var targetNodes: Node[] = [];

                        do {
                            if (targetNode == endTargetNode) {
                                break;
                            }

                            targetNodes.push(targetNode);
                        } while (targetNode = targetNode.nextSibling);

                        targetNodes.forEach(node => parentNode.removeChild(node));

                        // remove from child scopes & index targets
                        var removedScopes = subScopes.splice(index, length);
                        indexTargets.splice(index, length);

                        removedScopes.forEach(scope => scope.dispose());

                        for (var i = index; i < indexTargets.length; i++) {
                            indexTargets[i].scope.setScopeData('index', i - length + 1);
                        }

                        break;
                }
            });
        };

        DecoratorDefinition.register(eachDefinition);
    }


    // %bind-value

    // target limitation in the future?
    var bindValueDefinition = new ProcessorDefinition('bind-value');

    bindValueDefinition.oninitialize = processor => {
        var value = processor.expressionValue;
        var idKeys = processor.expressionFullIdKeys;

        processor.target.ensure(ele => {
            (<HTMLInputElement>ele).value = value;
            (<HTMLElement>ele).addEventListener('change', onchange);
            (<HTMLElement>ele).addEventListener('input', onchange);
            (<HTMLElement>ele).addEventListener('paste', onchange);
        }, processor);

        function onchange() {
            processor.scope.setData(idKeys, this.value);
        }
    };

    bindValueDefinition.onchange = (processor, args) => {
        var value = processor.expressionValue;

        // no need to use ensure here because newly added element would go through ensure handler first.
        processor.target.each(ele => {
            (<HTMLInputElement>ele).value = value;
        });
    };

    DecoratorDefinition.register(bindValueDefinition);

    // %var

    var varDefinition = new ProcessorDefinition('var');

    varDefinition.skipExpessionParsing = true;

    var isVariableRegex = /^[a-z$_][\w$]*$/i;

    varDefinition.oninitialize = processor => {
        var expression = processor.expression;

        var name = isVariableRegex.test(expression) ? expression : null;

        if (!name && processor.expressionFullIdKeys) {
            return;
        }

        var scope = processor.scope

        if (name) {
            // 1. {%var abc}
            scope.setScopeData(name, undefined);
        } else {
            // 2. {%var abc = 123}
            var value = processor.expressionValue;

            if (!(value instanceof Object)) {
                return;
            }

            Object
                .keys(value)
                .forEach(name => scope.setScopeData(name, value[name]));
        }
    };

    DecoratorDefinition.register(varDefinition);

    // %click-toggle

    var clickToggleDefinition = new ProcessorDefinition('click-toggle');

    clickToggleDefinition.oninitialize = (processor) => {
        var fullIdKeys = processor.expressionFullIdKeys;

        if (!fullIdKeys) {
            throw new TypeError('[drop %click-toggle] expression "' + processor.expression + '" is not valid for toggle');
        }

        function onclick() {
            var value = !processor.expressionValue;
            processor.scope.setData(fullIdKeys, value);
        }

        processor.target.ensure(ele => {
            ele.addEventListener('click', onclick);
        }, processor);
    };
    
    DecoratorDefinition.register(clickToggleDefinition);

    // %show

    var showDefinition = new ProcessorDefinition('show');

    showDefinition.oninitialize = processor => {
        var value = processor.expressionValue;

        processor.target.ensure(ele => {
            ele.style.display = value ? '' : 'none';
        }, processor);
    };

    showDefinition.onchange = (processor, args) => {
        var value = processor.expressionValue;

        processor.target.each(ele => {
            ele.style.display = value ? '' : 'none';
        });
    };

    DecoratorDefinition.register(showDefinition);

    // %if

    var ifDefinition = new ProcessorDefinition('if');

    ifDefinition.onchange = (processor, args) => {
        //debugger;
        var value = processor.expressionValue;
        if (value) {
            processor.target.append();
        } else {
            processor.target.remove();
        }
    };

    DecoratorDefinition.register(ifDefinition);

    // &input

    var inputDefinition = new ComponentDefinition('input');

    var bindIdKeysRegex = /(?:\{|,)\s*value:\s*\{([^}]+)\}/;

    inputDefinition.oninitialize = component => {
        var value: string;
        var idKeys = component.expressionFullIdKeys;

        if (idKeys) {
            value = component.expressionValue;
        } else {
            var expression = component.parsedExpression;
            var groups = expression && expression.match(bindIdKeysRegex);

            if (!groups) {
                debugger;
                throw new TypeError('[drop &input] unable to bind value to expression "' + component.expression + '"');
            }

            idKeys = groups[1].split('.');
            value = component.expressionValue.value;
        }

        var input = document.createElement('input');

        component.target.replaceWith(input);

        component.target.ensure(ele => {
            if (value === undefined) {
                value = '';
            }

            (<HTMLInputElement>ele).value = value;
            (<HTMLElement>ele).addEventListener('change', onchange);
            (<HTMLElement>ele).addEventListener('input', onchange);
            (<HTMLElement>ele).addEventListener('paste', onchange);
        }, component);

        function onchange() {
            component.scope.setData(idKeys, this.value);
        }
    };

    inputDefinition.onchange = (processor, args) => {
        var value = processor.expressionValue;
        value = value instanceof Object ? value.value : value;

        if (value === undefined) {
            value = '';
        }

        // no need to use ensure here because newly added element would go through ensure handler first.
        processor.target.each(ele => {
            (<HTMLInputElement>ele).value = value;
        });
    };

    DecoratorDefinition.register(inputDefinition);

    // %template

    //interface ITemplateProcessor extends Decorator {
    //    data: {
    //        fragment: DocumentFragment;
    //    }
    //}

    //var templateDefinition = new ProcessorDefinition('template')

    //templateDefinition.onchange = ((processor: ITemplateProcessor, args) => {
        

    

    //});

    //DecoratorDefinition.register(templateDefinition);

    // >click 
    // &component
}
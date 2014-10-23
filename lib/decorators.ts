module Drop {

    // @attribute

    var attributeDefinition = new DecoratorDefinition('attribute', null);

    attributeDefinition.onchange = (decorator, args) => {
        var name = decorator.name;
        var keys = name.split('.');
        var value = decorator.expressionValue;

        decorator.target.each((ele: HTMLElement) => {
            if (keys.length == 2) {
                var key = keys[0];

                if (key in ele) {
                    ele[key][keys[1]] = value;
                }
            } else if (ele.setAttribute) {
                ele.setAttribute(name, value);
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

                // remove

                // maybe move, etc...
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
            processor.scope.setData(idKeys, this.value);
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

    clickDefinition.oninitialize = processor => {
        var handler: (e: MouseEvent) => any;

        if (processor.data) {
            handler = processor.data.handler;
        } else {
            handler = function (e) {
                var onclick = processor.expressionValue;
                if (typeof onclick == 'function') {
                    onclick.call(this, e, processor.scope);
                }
            };
            processor.data = {
                handler: handler
            };
        }

        processor.target.each(ele => {
            ele.addEventListener('click', handler);
        });
    };

    clickDefinition.onchange = (processor, args) => { };

    clickDefinition.ondispose = (processor) => {
        var handler = processor.data.handler;

        processor.target.each(ele => {
            ele.removeEventListener('click', handler);
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
                processor.scope.setData(fullIdKeys, value);
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
        //debugger;
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
}
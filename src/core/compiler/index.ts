import {
    Expression,
    NodeType,
    parse
} from './parser';

class Scope {
    watch(keyGroups: string[][]): void {

    }
}

class DecoratorArguments {
    public readonly expressions: Expression[];

    constructor(
        public readonly scope: Scope,
        public readonly source: string
    ) {
        this.expressions = parse(source);
        for (let expression of this.expressions) {
            let targets: Expression[] = [];
            findConstantsAndWatchTargets(expression, targets);
            console.log(targets);
        }
    }

    evaluate(): any[] {
        return [];
    }

    private evaluateExpression(expression: Expression): any {

    }
}

// foo.bar.pia -> foo.bar.pia
// foo() -> foo
// foo.bar[hia.pia].yo -> foo.bar, hia.pia
// foo.bar[0].yo -> foo.bar
// (1 + foo.bar).xxx[0].yo -> foo.bar

new DecoratorArguments(new Scope(), 'foo.bar.pia, foo(), foo.bar[hia.pia].yo, foo.bar[0].yo, (1 + foo.bar).xxx[0].yo');

function findConstantsAndWatchTargets(expression: Expression, targets: Expression[], upperWatchable?: boolean): boolean {
    let watchable = false;
    switch (expression.type) {
        case NodeType.literal:
            expression.constant = true;
            break;
        case NodeType.arrayExpression:
            expression.constant = true;
            for (let element of expression.elements) {
                findConstantsAndWatchTargets(element, targets);
                expression.constant = expression.constant && element.constant;
            }
            break;
        case NodeType.binaryExpression:
        case NodeType.logicalExpression:
            findConstantsAndWatchTargets(expression.left, targets);
            findConstantsAndWatchTargets(expression.right, targets);
            expression.constant = expression.left.constant && expression.right.constant;
            break;
        case NodeType.callExpression:
            findConstantsAndWatchTargets(expression.callee, targets);
            expression.constant = expression.callee.constant;
            for (let arg of expression.arguments) {
                findConstantsAndWatchTargets(arg, targets);
                expression.constant = expression.constant && arg.constant;
            }
            break;
        case NodeType.conditionalExpression:
            findConstantsAndWatchTargets(expression.test, targets);
            findConstantsAndWatchTargets(expression.alternate, targets);
            findConstantsAndWatchTargets(expression.consequent, targets);
            expression.constant = expression.test.constant && expression.alternate.constant && expression.consequent.constant;
            break;
        case NodeType.identifier:
            watchable = true;
            break;
        case NodeType.literal:
            expression.constant = true;
            break;
        case NodeType.memberExpression:
            if (expression.computed) {
                findConstantsAndWatchTargets(expression.object, targets);
                findConstantsAndWatchTargets(expression.property, targets);
                expression.constant = expression.object.constant && expression.property.constant;
            } else {
                watchable = findConstantsAndWatchTargets(expression.object, targets, true);
                expression.constant = expression.object.constant;
            }
            break;
        case NodeType.objectExpression:
            expression.constant = true;
            for (let property of expression.properties) {
                findConstantsAndWatchTargets(property.value, targets);
                expression.constant = expression.constant && !property.computed && property.value.constant;
            }
            break;
        case NodeType.unaryExpression:
            findConstantsAndWatchTargets(expression.argument, targets);
            expression.constant = expression.argument.constant;
            break;
    }
    if (watchable && !upperWatchable) {
        targets.push(expression);
    }
    return watchable;
}

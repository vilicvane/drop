# DropJS

Drop is a MV* framework sibling to frameworks like [Angular](https://angularjs.org/) and [Ember](http://emberjs.com/), but targeting mobile web apps.

IT IS BEEN REDESIGNED, CHECK OUT https://github.com/vilic/drop/labels/v0.2.

I am now using this version of Drop to build the new version of my [WordsBaking](https://wordsbaking.com/), and yes I've already been experiencing some inconveniences (as well as some interesting tricks). So after I complete the developing of my app, I will rewrite Drop to rule out these issues. Along with that, multiple libraries would be released to form a complete solution for mobile web apps with rich touching and offline usage. :D

To start with, I need to point out that Drop is in its very first period. Though the core has been basically completed, extensions including router are not available yet.

## Glance into DropJS

```html
<script id="body-template" type="text/template">
    <h1>{title}</h1>
    <p>{intro}</p>

    {#each matrix}
    {>click onRowClick}
    {@style "color: {matrixColor};"}
    <div>
        {index + 1}.

        {#each this}
        {"{this} "}
    </div>
</script>
<script>
    function onRowClick(e, scope) {
        var data = scope.dataHelper;
        alert('row ' + (data.index + 1) + ' clicked');
    }

    var data = new Drop.Data({
        title: 'Glance into DropJS',
        intro: 'Some introduction...',
        matrixColor: '#3894E4',
        matrix: [
            ['a', 'b', 'c'],
            ['d', 'e', 'f'],
            ['g', 'h', 'i']
        ]
    });

    Drop.Template.apply('body-template', data, document.body);
</script>
```

Checkout another quick [demo](https://rawgit.com/vilic/drop/master/demo/index.html).
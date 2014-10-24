# DropJS

Drop is a MVVM framework (a what?) sibling to frameworks like [Angular](https://angularjs.org/) and [Ember](http://emberjs.com/). But I hate terminologies, so in this guide you won't see many words like _model_ or _view_. Instead, I use _data_ and _DOM_.

To start with, I need to point out that DropJS is in its very first period. Though the core has been basically completed, extensions including router are not available yet.

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
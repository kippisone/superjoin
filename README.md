Superjoin
=========

Superjoin is a **module loader** for the web. It brings node like **require** support to the **front-end**.
Superjoin uses npm as package storage and gives you the posibility to use your own local packages.
<br><br>

Usage of Superjoin:
-------------------

**Configure your requirements**
```json
{
    "main": "index.js",
    "files": [
        "hello.js"
    ]
}
```

**Run the build job**
```shell
superjoin -o build.js
```

**Include the build file**
```html
<script src="build.js"></script>
```

**Use it inside your code**
```js
//Load local modules
var myModule = require('./modules/myModule.js');

//Load from node_modules
var $ = require('jquery');
```
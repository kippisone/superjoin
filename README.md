Superjoin
=========

Superjoin is a **module loader** for the web. It brings Node.js like **require** support to the **front-end**.
It uses npm or bower as package storage and gives you the possibility to use your own local packages.

Usage of Superjoin:
-------------------

Superjoin can be configured with a `superjoin.json` file placed everywhere in your project.
A minimum configuration looks like:

```json
{
    "name": "myproject",
    "main": "index.js",
    "files": [
        "hello.js"
    ]
}
```

Superjoin parse all modules an includes submodules automatically. You mustn't add all your requirements in the superjoin file. 


Run the build job
-----------------

```shell
$ superjoin -o build.js
```

Run this command from the same folder where your superjoin.json file is.
That command will create a bundle with all modules and their requirements.

Include the build file
----------------------

Place this simple html snippet in the head of your index.html

```html
<script type="text/javascript" src="build.js"></script>
```

Inside your code
----------------

```js
//Load local modules
var myModule = require('./modules/myModule.js');

//Load from node_modules or bower_components
var $ = require('jquery');
```

The difference of local and npm/bower modules is the leading `./` or `../`.
If a module name starts with  `./` or `../` it will be loaded as a local file.
All other modules are being processed as npm or bower modules.

The loading order of npm/bower modules is the following:

1) Tries to load it from `bower_components`. If no bower_module folder is found, tries to load it from a bower_components folder in the parent directory, until the root directory.

2) Tries to load it from `node_modules`. If no bower_module folder is found, tries to load it from a node_modules folder in the parent directory, until the root directory.

3) Tries to resolve the path as a local module.

4) Throws a module not found error.

[Read the full documentation](https://superjoinjs.com/docs.html)

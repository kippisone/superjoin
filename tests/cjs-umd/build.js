(function (root, factory) {
    /*global define:false */
    'use strict';

    if (typeof define === 'function' && define.amd) {
        define('cjs-umd', ['firetpl', 'xqcore', 'jquery'], factory);
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(require('firetpl'), require('xqcore'), require('jquery'));
    } else {
        root.XQCore = factory(window.FireTPL, window.XQCore, window.jQuery);
    }
}(this, function () {
    'use strict';

    var deps = ['firetpl', 'xqcore', 'jquery'],
        args = Array.prototype.slice.call(arguments);
    
    var lastCache;
    var require = function(file) {

        if (deps.indexOf(file) !== -1) {
            return args[deps.indexOf(file)];
        }

        if (require.alias && require.alias[file]) {
            file = require.alias[file];
        }

        file = require.resolve(file, this ? this.file : null);

        var module = {
            exports: {},
            file: file
        };

        lastCache = require.cache;
        if (require.cache[file]) {
            
            if (require.cache[file].obj) {
                return require.cache[file].obj;
            }

            require.cache[file].fn(module, module.exports, require.bind(module));
            require.cache[file].obj = module.exports || {};
            return require.cache[file].obj;
        }
        else {
            throw new Error('Module ' + file + ' not found!');
        }
    };

    require.resolve = function(path, parent) {
        parent = parent || '';

        var resolved = [];
        if (path.charAt(0) === '.') {
            var newPath = parent;
            newPath = newPath.split('/');
            newPath.pop();
            newPath = newPath.concat(path.split('/'));

            newPath.forEach(function(p) {
                if (p === '..') {
                    resolved.pop();
                    return;
                }
                else if (p === '.' || p === '') {
                    return;
                }

                resolved.push(p);
            });

            if (!parent ||parent.charAt(0) === '.') {
                resolved.unshift('.');
            }
        }
        else {
            return path;
        }

        resolved = resolved.join('/');
        if (!/\.js(on)?$/.test(resolved)) {
            resolved += '.js';
        }

        return resolved;
    };

    require.register = function(alias, path, fn) {
        if (arguments.length === 2) {
            fn = path;
            path = alias;
            alias= null;
        }

        require.cache[path] = {fn: fn, calls: 0};
        if (alias) {
            require.alias[alias] = path;
        }
    };

    require.cache = {};
    require.alias = {};

require.register('./libs/lib3.js', function(module, exports, require) {
'use strict';

var lib = {};
module.exports = lib;
});
require.register('./libs/lib2.js', function(module, exports, require) {
'use strict';

var lib3 = require('./lib3');
module.exports = lib3;
});
require.register('./libs/lib1.js', function(module, exports, require) {
'use strict';

var lib2 = require('./lib2');
module.exports = lib2;
});
require.register('./index.js', function(module, exports, require) {
var $ = require('jquery');
var XQCore = require('xqcore');

var mode1 = {};
module.exports = mod1;
});
return require('./index.js');
}));

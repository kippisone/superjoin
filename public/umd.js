(function (root, factory) {
    /*global define:false */
    'use strict';

    if (typeof define === 'function' && define.amd) {
        define('/**SUPREJOIN_MODULE_NAME**/', [/**SUPREJOIN_AMD_DEPS**/], factory);
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(/**SUPREJOIN_CJS_DEPS**/);
    } else {
        root.XQCore = factory(/**SUPREJOIN_WIN_DEPS**/);
    }
}(this, function () {
    'use strict';

    var deps = [/**SUPERJOIN_DEPENDENCIES**/],
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
        if (!/\.(js(on)?|coffee)$/.test(resolved)) {
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

/**SUPERJOIN-UMD-MODULES**/
}));

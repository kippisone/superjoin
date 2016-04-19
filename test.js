/*!
 * Superjoin module loader
 * Copyright by Andi Heinkelein <andi.oxidant@noname-media.com>
 *
 * @module Superjoin
 */
(function(window) {
    'use strict';

    /**
     * Load a module
     *
     * Loads a local or npm module. If the module name starts with an . a local module will be loaded.
     *
     * @param  {string} module Loads a module
     * @return {any}      Returns the loaded module.
     */
    var require = function(file) {
        if (require.alias && require.alias[file]) {
            file = require.alias[file];
        }

        var module = {
            exports: {},
            file: file
        };

        file = require.resolve(this && this.file ? this.file : './', file);

        var requireFunc = require.bind({
            file: file
        });

        if (window.require.cache[file]) {
            if (window.require.cache[file].obj) {
                return window.require.cache[file].obj;
            }

            window.require.cache[file].fn(module, module.exports, requireFunc);
            window.require.cache[file].obj = module.exports;
            return window.require.cache[file].obj;
        }

        if (!window.require.autoload || (window.require.autoload && file.charAt(0) !== '.')) {
            throw new Error('Module ' + file + ' not found!');
        }

        var remoteFile = location.protocol
            .concat('//', location.host)
            .concat(file.substr(1));

        var xhr = new XMLHttpRequest();
        xhr.open('GET', remoteFile, false);
        xhr.send();
        if (xhr.status !== 200) {
            throw new Error('Could not load module "' + file + '"! Response error: ' +
                xhr.status + ' ' + xhr.statusText);
        }
        var source = xhr.responseText;

        var fn;
        try {
            //jshint evil:true
            fn = eval('(function(module, exports, require) {\n' +
                (/\.json$/.test(file) ? 'module.exports = ' : '') +
                source + '\n})\n\n//# sourceURL=' + file);
        }
        catch (err) {
            throw new Error(err + ' in ' + file);
        }

        fn(module, module.exports, require.bind(requireFunc));
        window.require.cache[file] = {
            fn: fn,
            calls: 1,
            obj: module.exports,
            loaded: true
        };

        return window.require.cache[file].obj;
    };

    require.resolve = function(from, to) {
        var resolved = [];
        if (to.indexOf('/') === -1) {
            if (to.indexOf('.') === -1 || this.moduleExists(to)) {
                return to;
            }
        }

        var newPath = from.split('/');
        if (newPath[0] === '.' || newPath.length > 1) {
            newPath.pop();
        }

        var mod = to.split('/');
        newPath = newPath.concat(mod);

        if (this.moduleExists(mod[0])) {
            newPath = mod;
        }

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

        resolved = resolved.join('/');

        if (!/\.(js(on)?|coffee)$/.test(resolved)) {
            resolved += '.js';
        }

        if (!from || from.charAt(0) === '.') {
            if (mod[0] === '.' || !this.moduleExists(mod[0])) {
                resolved = './' + resolved;
            }
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

    require.moduleExists = function(mod) {
        return !!require.cache[mod] || !!require.alias[mod];
    };

    require.cache = {};
    require.alias = {};

    window.require = require;

})(window);
require.alias['jquery'] = 'jquery/jquery.js';
require.register('jquery', function(module, exports, require) {
module.exports = {
  name: 'jquery',
  version: '2.0.4'
};

});
require.register('./lib/foo/foo.js', function(module, exports, require) {
'use strict';
module.exports = function() {
    return 'Foo';
};
});
require.register('./lib/bar/bar.js', function(module, exports, require) {
'use strict';
module.exports = function() {
    return 'Bar';
};
});
require.register('./lib/coffee/lib.coffee', function(module, exports, require) {
lib2 = require './lib2.coffee'
module.exports = lib2

});
require.register('./index.js', function(module, exports, require) {
var foo = require('./lib/foo/foo'),
    bar = require('./lib/bar/bar'),
    coffee = require('./lib/coffee/lib.coffee');

console.log(foo());
console.log(bar());

});
require('./index.js');

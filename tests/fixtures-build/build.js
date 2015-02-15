/*!
 * Superjoin module loader
 * Copyright by Andi Heinkelein <andi.oxidant@noname-media.com>
 */
(function(window) {
    var require = function(file) {
        'use strict';
        
        var module = {
            exports: {}
        };

        file = resolve(file);

        if (window.require.cache[file]) {
            
            window.require.cache[file](module, module.exports);
            return module.exports;
        }

        if (!window.require.autoload) {
            throw new Error('Module ' + file + ' not found!');
        }

        var remoteFile = location.protocol
            .concat('//', location.host, '/')
            .concat(file);
        
        var xhr = new XMLHttpRequest();
        xhr.open('GET', remoteFile, false);
        xhr.send();
        var source = xhr.responseText;

        var fn;
        try {
            //jshint evil:true
            fn = eval('function(module, exports) {\n' + source + '\n}\n\n//# sourceURL=' + file);
        }
        catch (err) {
            console.error(err + ' in ' + file);
        }

        window.require.cache[file] = fn;
        return window.require.cache[file];
    };

    require.resolve = function(path) {
        'use strict';

        // if (window.require.alias[path]) {
        //     return window.require.alias[path];
        // }

        var resolved = [];
        if (path.charAt(0) === '.') {
            path = location.pathname.split('/').concat(path.split('/'));
            path.forEach(function(p) {
                if (p === '..') {
                    resolved.pop();
                    return;
                }
                else if (p === '.' || p === '') {
                    return;
                }

                resolved.push(p);
            });
        }
        else if(path.charAt(0) === '/') {
        }
        else {
            return path;
        }

        resolved = '/' + resolved.join('/');
        if (!/\.js(on)?$/.test(resolved)) {
            resolved += '.js';
        }

        return resolved;
    };

    require.register = function(path, fn) {
        this.require.cache[path] = fn;
    };

    require.cache = {};
    // require.alias = {};

    window.require = require;
})(window);

require.register('./modules/module1/index.js', function(module, exports) {
module.exports = function() {
    'use strict';
    
};
};
require.register('module2', function(module, exports) {
module.exports = function() {
    'use strict';
    return 'Module 2';  
};
};
require.register('module3', function(module, exports) {
module.exports = function() {
    'use strict';
    return 'Module 3 browser';  
};
};

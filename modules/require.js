var resolve = function(path) {
    'use strict';

    if (window.require.alias[path]) {
        return window.require.alias[path];
    }

    path = location.pathname.split('/').concat(path.split('/'));
    var resolved = [];
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

    return location.protocol
        .concat('//', location.host, '/')
        .concat(resolved.join('/'))
        .replace(/\.js$/, '')
        .concat('.js');
};

window.require = function(file) {
    'use strict';

    file = resolve(file);

    if (window.require.cache[file]) {
        return window.require.cache[file];
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', file, false);
    xhr.send();
    var source = xhr.responseText;

    var module = {
        exports: {}
    };

    try {
        //jshint evil:true
        (function(module, require) {
            eval(source + '\n\n//# sourceURL=' + file);
        })(module, window.require);
    }
    catch (err) {
        console.error(err + ' in ' + file);
    }

    window.require.cache[file] = module.exports;
    return window.require.cache[file];
};

window.require.cache = {};
window.require.alias = {};
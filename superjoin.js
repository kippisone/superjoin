module.exports = (function() {
    'use strict';

    var path = require('path'),
        fs = require('fs');
    
    var grunt = require('grunt');
    
    var Superjoin = function() {
        this.root = __dirname;
    };

    Superjoin.prototype.join = function(files) {
        grunt.log.ok('Reading files ...');
        var out = '';
        files.forEach(function(file) {
            grunt.log.ok(' ... reading', file);
            out += this.addModule(file);
        }, this);

        return out;
    };

    Superjoin.prototype.addModule = function(file) {
        var module = 'require.register(\'' + file + '\', function(module, exports) {\n';
        file = this.resolve(file);
        grunt.log.ok(file.path);
        module += grunt.file.read(file.path);
        module += '\n};\n';
        return module;
    };

    Superjoin.prototype.resolve = function(file) {
        var filepath,
            filename = file;

        if (file.charAt(0) === '.') {
            if (!/\.js(on)?$/.test(file)) {
                filename += '.js';
            }
            filepath = path.join(this.root, filename);
        }
        else if(file.charAt(0) === '/') {
            if (!/\.js(on)?$/.test(file)) {
                filename += '.js';
            }
            filepath = filename;
        }
        else {
            var nodeModule = path.join(this.root, 'node_modules', file);
            if (grunt.file.exists(nodeModule)) {
                var pkg = require(path.join(nodeModule, '/package.json'));
                if (pkg.main) {
                    filepath = path.join(nodeModule, pkg.main);
                }
                else {
                    filepath = path.join(nodeModule, 'index.js');
                }
            } else {
                throw new Error('Module ' + file + ' not fount! Use npm install ' + file + ' --save to install it.');
            }
        }

        var resolved = {
            name: filename,
            path: filepath
        };

        return resolved;
    };

    return Superjoin;
})();
module.exports = (function() {
    'use strict';

    var path = require('path'),
        fs = require('fs');
    
    var grunt = require('grunt');
    
    var Superjoin = function() {
        this.root = process.cwd();
        this.confFile = path.join(process.cwd(), 'superjoin.json');
        this.pkgFile = path.join(process.cwd(), 'package.json');
    };

    Superjoin.prototype.join = function(files, main) {
        if (this.verbose) {
            grunt.log.ok('Reading files ...');
        }
        var out = grunt.file.read(path.join(__dirname, './require.js'));
        files.forEach(function(file) {
            if (this.verbose) {
                grunt.log.ok(' ... reading', file);
            }
            out += this.addModule(file);
        }, this);

        if (this.autoload) {
            out += '//Enable autoloading\nwindow.require.autoload = true;\n\n';
        }

        if (main) {
            if (this.verbose) {
                grunt.log.ok(' ... reading main', main);
            }
            out += this.addModule(main);
            out += 'require(\'' + this.resolve(main).name + '\');\n';
        }

        return out;
    };

    Superjoin.prototype.addModule = function(file) {
        var module = 'require.register(\'' + file + '\', function(module, exports, require) {\n';
        file = this.resolve(file);
        if (this.verbose) {
            grunt.log.ok(file.path);
        }
        module += grunt.file.read(file.path);
        module += '\n});\n';
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
            var nodeModule = path.join(process.cwd(), 'node_modules', file);
            if (grunt.file.exists(nodeModule)) {
                var pkg = require(path.join(nodeModule, '/package.json'));
                if (pkg.browser) {
                    filepath = path.join(nodeModule, pkg.browser);
                }
                else if (pkg.main) {
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

    Superjoin.prototype.getConf = function() {
        if (grunt.file.exists(this.confFile)) {
            return require(this.confFile);
        }
        else if (grunt.file.exists(this.pkgFile)) {
            var pkg = require(this.pkgFile);
            if (pkg && pkg.superjoin) {
                return pkg.superjoin;
            }
        }

        return {};
    };

    return Superjoin;
})();
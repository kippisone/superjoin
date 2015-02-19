module.exports = (function() {
    'use strict';

    var path = require('path'),
        fs = require('fs');
    
    var grunt = require('grunt');
    
    var Superjoin = function() {
        this.root = process.cwd();
        this.modules = [];
        this.confFiles = [];
    };

    Superjoin.prototype.join = function(files, main) {
        if (this.verbose) {
            grunt.log.ok('Reading files ...');
        }
        var out = grunt.file.read(path.join(__dirname, './require.js'));
        if (this.banner) {
            out = this.banner.trim() + '\n\n' + out;
        }

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
        if (this.modules.indexOf(file.path) !== -1) {
            if (this.verbose) {
                grunt.log.ok('Module "%s" already added!', file.name);
                return '';
            }            
        }

        if (this.verbose) {
            grunt.log.ok(file.path);
        }
        module += grunt.file.read(file.path);
        module += '\n});\n';
        this.modules.push(file.path);
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
        var confFiles = this.confFiles.length === 0 ? [
                path.join(this.root, 'superjoin.json'),
                path.join(process.cwd(), 'superjoin.json'),
                path.join(process.cwd(), 'package.json')
            ] : this.confFiles;

        for (var i = 0, len = confFiles.length; i < len; i++) {
            var file = confFiles[i];
            console.log('Check file', file);

            if (grunt.file.exists(file)) {
                if (/\/package.json$/.test(file)) {
                    var pkg = require(this.pkgFile);
                    if (pkg && pkg.superjoin) {
                        return pkg.superjoin;
                    }
                }

                return require(file);
            }
        }

        return {};
    };

    return Superjoin;
})();
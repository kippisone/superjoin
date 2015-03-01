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
        var out = this.readFile(path.join(__dirname, './require.js'));
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
        file = this.resolve(file);
        var module = 'require.register(\'' + (file.filename ? file.name + '\', \'' + file.filename : file.name) + '\', function(module, exports, require) {\n';
        if (this.modules.indexOf(file.path) !== -1) {
            if (this.verbose) {
                grunt.log.ok('Module "%s" already added!', file.name);
                return '';
            }            
        }

        if (this.verbose) {
            grunt.log.ok(file.path);
        }

        var source = this.readFile(file.path);
        module += source;
        module += '\n});\n';
        this.modules.push(file.path);

        if (file.isNodeModule) {
            module += this.grepSubmodules(file, source);
        }

        return module;
    };

    Superjoin.prototype.grepSubmodules = function(module, source) {
        var pattern = /require\((.+?)\)/g,
            out = '';
        while(true) {
            var match = pattern.exec(source);
            if (!match) {
                break;
            }

            var subModule = match[1].trim();
            if (subModule.charAt(0) !== '"' && subModule.charAt(0) !== '\'') {
                console.warn('Can not resolve module name!', match[0]);
                continue;
            }

            subModule = subModule.slice(1, -1);
            var name = path.relative(path.join(module.dir, '..'), module.path);
            var split = name.split('/');
            split.pop();
            split = split.concat(subModule.split('/'));
            var newPath = [];
            for (var i = 0, len = split.length; i < len; i++) {
                if (split[i] === '..') {
                    newPath.pop();
                    continue;
                }

                if (split[i] === '.') {
                    continue;
                }

                newPath.push(split[i]);
            }

            subModule = newPath.join('/');
            out += this.addModule(subModule);
        }

        return out;
    };

    Superjoin.prototype.readFile = function(file) {
        return grunt.file.read(file);
    };

    Superjoin.prototype.resolve = function(file) {
        var filepath,
            name = file,
            filename,
            isNodeModule = false,
            dir;

        if (file.charAt(0) === '.') {
            if (!/\.js(on)?$/.test(file)) {
                name += '.js';
            }
            filepath = path.join(this.root, name);
        }
        else if(file.charAt(0) === '/') {
            if (!/\.js(on)?$/.test(file)) {
                name += '.js';
            }
            filepath = name;
        }
        else {
            var nodeModule = path.join(process.cwd(), 'node_modules', file);
            dir = nodeModule;
            isNodeModule = true;
            
            if (name.indexOf('/') !== -1) {
                filepath = nodeModule;
                if (!/\.js(on)?$/.test(name)) {
                    name += '.js';
                    filepath += '.js';
                }
            }
            else if (grunt.file.exists(nodeModule)) {
                var pkg = require(path.join(nodeModule, '/package.json'));
                if (pkg.browser) {
                    filename = pkg.browser;
                    filepath = path.join(nodeModule, filename);
                    filename = name + filepath.replace(dir, '');
                }
                else if (pkg.main) {
                    filename = pkg.main;
                    filepath = path.join(nodeModule, filename);
                    filename = name + filepath.replace(dir, '');
                }
                else {
                    filename = 'index.js';
                    filepath = path.join(nodeModule, filename);
                    filename = name + filepath.replace(dir, '');
                }
            } else {
                throw new Error('Module ' + file + ' not fount! Use npm install ' + file + ' --save to install it.');
            }
        }

        var resolved = {
            name: name,
            path: filepath,
            isNodeModule: isNodeModule
        };

        if (dir) {
            resolved.dir = dir;
        }

        if (filename) {
            resolved.filename = filename;
        }

        return resolved;
    };

    Superjoin.prototype.getConf = function() {
        var confFiles = this.confFiles.length === 0 ? [
                path.join(this.root, 'superjoin.json'),
                path.join(this.root, 'package.json')
            ] : this.confFiles;

        for (var i = 0, len = confFiles.length; i < len; i++) {
            var file = confFiles[i];


            if (grunt.file.exists(file)) {
                if (this.verbose) {
                    grunt.log.ok('Using config file:', file);
                }
                
                if (/\/package.json$/.test(file)) {
                    var pkg = require(file);
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
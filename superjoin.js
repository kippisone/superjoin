module.exports = (function() {
    'use strict';

    var path = require('path'),
        fs = require('fs');
    
    var grunt = require('grunt');
    
    var Superjoin = function(conf) {
        conf = conf || {};

        var dir;

        this.root = conf.root || process.cwd();
        this.workingDir = conf.workingDir || process.cwd();
        this.modules = [];
        this.confFiles = [];

        this.libDir = conf.libDir || null;
        this.bwrDir = conf.bwrDir || null;
        this.npmDir = conf.npmDir || null;

        if (!this.bwrDir) {
            dir = path.join(this.workingDir, 'bower_components');
            while (true) {
                if (grunt.file.exists(dir)) {
                    this.bwrDir = dir;
                    break;
                }

                dir = path.join(dir, '../../bower_components');
                if (dir === '/bower_components') {
                    break;
                }
            }
        }

        if (!this.npmDir) {
            dir = path.join(this.workingDir, 'node_modules');
            while (true) {
                if (grunt.file.exists(dir)) {
                    this.npmDir = dir;
                    break;
                }

                dir = path.join(dir, '../../node_modules');
                if (dir === '/node_modules') {
                    break;
                }
            }
        }
    };

    Superjoin.prototype.join = function(files, main) {
        if (this.verbose) {
            grunt.log.ok('Reading files ...');
        }
        var out = this.readFile(path.join(__dirname, 'public/require.js'));
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
            out += 'require(\'' + this.resolve(this.root, main).name + '\');\n';
        }

        return out;
    };

    Superjoin.prototype.addModule = function(file) {
        file = this.resolve(this.root, file);
        var module = 'require.register(\'' + (
            file.path ? file.name + '\', \'' + file.path : file.name
        ) + '\', function(module, exports, require) {\n';

        if (this.modules.indexOf(file.path) !== -1) {
            if (this.verbose) {
                grunt.log.ok('Module "%s" already added!', file.name);
                return '';
            }            
        }

        if (this.verbose) {
            grunt.log.ok(' ... add module', file.path);
        }

        var source = this.readFile(file.path);
        module += (/\.json$/.test(file) ? 'module.exports = ' : '') + source;
        module += '\n});\n';
        this.modules.push(file.path);

        if (file.isNodeModule) {
            module += this.grepSubmodules(file, source);
        }

        return module;
    };

    Superjoin.prototype.grepSubmodules = function(module, source) {
        // console.log('GREP', module);
        var pattern = /require\((.+?)\)/g,
            out = '';
        while(true) {
            var match = pattern.exec(source);
            if (!match) {
                break;
            }

            var subModule = match[1].trim();
            if (subModule.charAt(0) !== '"' && subModule.charAt(0) !== '\'') {
                console.warn('Could\'t resolve module name!', match[0]);
                continue;
            }

            subModule = subModule.slice(1, -1);
            if (subModule.charAt(0) !== '.') {
                continue;
            }

            var name = path.relative(path.join(module.dir, '..'), module.path);
            var split = name.split('/');
            split.pop();
            split = split.concat(subModule.split('/'));
            var newPath = [];
            if (module.prefix) {
                newPath.push(module.prefix);
            }

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

    Superjoin.prototype.loadModule = function(moduleType, file) {
        var moduleDir,
            modulePrefix;

        switch (moduleType) {
            case 'lib':
                moduleDir = this.libDir;
                modulePrefix = '$lib';
                break;
            case 'bower':
                moduleDir = this.bwrDir;
                modulePrefix = '$bower';
                break;
            case 'npm':
                moduleDir = this.npmDir;
                modulePrefix = '$npm';
                break;
            default:
                throw new Error('Unknowd module type ' + moduleType + '!');
        }

        var nodeModule = path.join(moduleDir, file),
            name = file,
            filepath,
            filename;

        var dir = nodeModule;
        
        if (name.indexOf('/') !== -1) {
            filepath = nodeModule;
            if (!/\.js(on)?$/.test(name)) {
                name += '.js';
                filepath += '.js';
            }
        }
        else if (grunt.file.exists(nodeModule)) {
            var bwr = grunt.file.exists(path.join(nodeModule, '/bower.json')) ?
                require(path.join(nodeModule, '/bower.json')) : null;
            var pkg = grunt.file.exists(path.join(nodeModule, '/package.json')) ?
                require(path.join(nodeModule, '/package.json')) : null;
            
            if (bwr) {
                filename = bwr.main;
                if (Array.isArray(bwr.main)) {
                    for (var i = 0, len = bwr.main.length; i < len; i++) {
                        if (/\.js$/.test(bwr.main[i])) {
                            filename = bwr.main[i];
                            break;
                        }
                    }
                }

                filepath = path.join(nodeModule, filename);
                filename = name + filepath.replace(dir, '');
            }
            else if (pkg && pkg.browser) {
                filename = pkg.browser;
                filepath = path.join(nodeModule, filename);
                filename = name + filepath.replace(dir, '');
            }
            else if (pkg && pkg.main) {
                filename = pkg.main;
                filepath = path.join(nodeModule, filename);
                filename = name + filepath.replace(dir, '');
            }
            else if (pkg) {
                filename = 'index.js';
                filepath = path.join(nodeModule, filename);
                filename = name + filepath.replace(dir, '');
            }
            else {
                throw new Error('No bower.json or package.json found in module ' + name + '!');
            }
        } else {
            return null;
        }

        return {
            name: name,
            dir: dir,
            path: filepath,
            isNodeModule: true,
            isModule: true,
            prefix: modulePrefix
        };
    };

    Superjoin.prototype.resolve = function(from, to) {
        console.log('Resolve:', from, to);

        var resolveRelative = function(from, to) {
            var file = from.split('/');
            if (file.length > 1) {
                file.pop();
            }
            to.split('/').forEach(function(part) {
                if (part === '.') {
                    return;
                }

                if (part === '..') {
                    file.pop();
                    return;
                }

                file.push(part);
            });

            file = file.join('/');
            if (!/\.js$/.test(file)) {
                file = file + '.js';
            }

            return {
                name: file,
                path: path.join(this.root, file)
            };
        }.bind(this);

        var resolveModule = function(from, to) {
            var resolved;

            if (this.libDir) {
                resolved = this.loadModule('lib', to);
            }

            if (!resolved && this.bwrDir) {
                resolved = this.loadModule('bower', to);
            }
            
            if (!resolved && this.npmDir) {
                resolved = this.loadModule('npm', to);
            }

            return {
                name: resolved.prefix + '/' + to,
                path: resolved ? resolved.path : ''
            };
        }.bind(this);

        var resolved;

        if (/^\$(npm|bower|lib)\/(.+)$/.test(to)) { //Its a module
            var type = RegExp.$1;
            resolved = this.loadModule(type, to);
            
            return {
                name: RegExp.$2,
                path: resolved ? resolved.path : ''
            };
        }
        else if (/\//.test(to)) { //Contains a slash
            if (/^\.\.?\//.test(to)) {
                return resolveRelative(from, to);
            }
        }
        else if (/\./.test(to)) { //Contains a dot, but no slash
            resolved = resolveRelative(from, to);
            if (grunt.file.exists(resolved.path)) {
                return resolved;
            }
            else {
                return resolveModule(from, to);
            }
        }
        else {
            return resolveModule(from, to);
        }

        return {
            name: to,
            path: resolved ? resolved.path : ''
        };
    };

    Superjoin.prototype.getConf = function() {
        var confFiles = this.confFiles.length === 0 ? [
                path.join(this.workingDir, 'superjoin.json'),
                path.join(this.workingDir, 'package.json')
            ] : this.confFiles;

        var cnf;

        for (var i = 0, len = confFiles.length; i < len; i++) {
            var file = confFiles[i];


            if (grunt.file.exists(file)) {
                if (this.verbose) {
                    grunt.log.ok('Using config file:', file);
                }
                
                if (/\/package.json$/.test(file)) {
                    var pkg = grunt.file.readJSON(file);
                    if (pkg && pkg.superjoin) {
                        cnf = pkg.superjoin;
                        if (cnf.main && !/^\.{0,2}\//.test(cnf.main)) {
                            cnf.main = './' + cnf.main;
                        }

                        return cnf;
                    }
                }

                var sjc = grunt.file.readJSON(file);
                if (sjc) {
                    if (sjc.main && !/^\.{0,2}\//.test(sjc.main)) {
                        sjc.main = './' + sjc.main;
                    }
                }
                return sjc;
            }
        }

        return {};
    };

    return Superjoin;
})();
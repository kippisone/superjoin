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

        this.modulePaths = {};

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

        if (this.root.charAt(0) !== '/') {
            //Root is relative
            this.root = path.join(process.cwd(), this.root);
        }

        //addModule expects a file path
        var rootFile = path.join(this.root, 'index.js');

        var out = this.readFile(path.join(__dirname, 'public/require.js'));
        if (this.banner) {
            out = this.banner.trim() + '\n\n' + out;
        }

        files.forEach(function(file) {
            if (this.verbose) {
                grunt.log.ok(' ... reading', file);
            }
            out += this.addModule(rootFile, file);
        }, this);

        if (this.autoload) {
            out += '//Enable autoloading\nwindow.require.autoload = true;\n\n';
        }

        if (main) {
            if (this.verbose) {
                grunt.log.ok(' ... reading main', main);
            }

            out += this.addModule(rootFile, main);
            out += 'require(\'' + this.resolve(rootFile, main).name + '\');\n';
        }

        return out;
    };

    Superjoin.prototype.addModule = function(parent, file) {
        // console.log('ADD', parent, file);
        var resolved = this.resolve(parent, file);
        // console.log('RES', resolved);
        var module = 'require.register(\'' + resolved.name + '\', function(module, exports, require) {\n';

        if (this.modules.indexOf(resolved.path) !== -1) {
            if (this.verbose) {
                grunt.log.ok('Module "%s" already added!', resolved.name);
                return '';
            }            
        }

        if (this.verbose) {
            grunt.log.ok(' ... add module', resolved);
        }

        var source = this.readFile(resolved.path);
        module += (/\.json$/.test(resolved.path) ? 'module.exports = ' : '') + source;
        module += '\n});\n';
        this.modules.push(resolved.path);

        if (resolved.isModule) {
            module += this.grepSubmodules(resolved, source);
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
            out += this.addModule(module.path, subModule);
        }

        return out;
    };

    Superjoin.prototype.readFile = function(file) {
        return grunt.file.read(file);
    };

    Superjoin.prototype.getModulePath = function(mod) {
        if (this.modulePaths[mod]) {
            return this.modulePaths[mod];
        }

        return '';
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
        // console.log('Resolve:', from, to);

        var fromDir = path.dirname(from);
        var resolved;

        // var resolveRelative = function(from, to) {
        //     var file = from.split('/'),
        //         mod = file[0];
        //     if (file.length > 1) {
        //         file.pop();
        //     }

        //     to.split('/').forEach(function(part) {
        //         if (part === '.') {
        //             return;
        //         }

        //         if (part === '..') {
        //             file.pop();
        //             return;
        //         }

        //         file.push(part);
        //     });

        //     file = file.join('/');
        //     if (!/\.js$/.test(file)) {
        //         file = file + '.js';
        //     }

        //     console.log('MOD', this.modulePaths, mod);
        //     var rootPath = mod === '.' ? this.root : this.modulePaths[mod];

        //     return path.join(rootPath, file);
        // }.bind(this);
        var getPathProperties = function(path) {
            var resolved;

            if (this.libDir && path.indexOf(this.libDir) === 0) {
                resolved = {
                    path: path,
                    name: path.replace(this.libDir.replace(/\/$/) + '/', ''),
                    dir: this.libDir,
                    isModule: true
                };
            }

            if (!resolved && this.bwrDir && path.indexOf(this.bwrDir) === 0) {
                resolved = {
                    path: path,
                    name: path.replace(this.bwrDir.replace(/\/$/) + '/', ''),
                    dir: this.bwrDir,
                    isModule: true
                };
            }
            
            if (!resolved && this.npmDir && path.indexOf(this.npmDir) === 0) {
                resolved = {
                    path: path,
                    name: path.replace(this.npmDir.replace(/\/$/) + '/', ''),
                    dir: this.npmDir,
                    isModule: true
                };
            }

            if (!resolved) {
                resolved = {
                    path: path,
                    name: path.replace(this.root.replace(/\/$/), '.'),
                    dir: this.root,
                    isModule: false
                };
            }

            return resolved;
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


            // console.log('RESOLVED', resolved);
            return resolved;
        }.bind(this);

        // var resolved;

        if (/^\$(npm|bower|lib)\/(.+)$/.test(to)) { //Its a module
            var type = RegExp.$1;
            resolved = this.loadModule(type, RegExp.$2);
        }
        else if (/\//.test(to)) { //Contains a slash
            if (/^\.\.?\//.test(to)) {
                resolved = path.resolve(fromDir, to);
                if (!/\.[a-z]{2,4}$/.test(resolved)) {
                    resolved += '.js';
                }

                resolved = getPathProperties(resolved);
            }
        }
        else if (/\./.test(to)) { //Contains a dot, but no slash
            resolved = path.resolve(fromDir, to);
            if (grunt.file.exists(resolved)) {
                resolved = getPathProperties(resolved);
            }
            else {
                resolved = resolveModule(from, to);
            }
        }
        else {
            resolved = resolveModule(from, to);
        }

        // console.log('RESOLVED:', {
        //     path: resolved.path,
        //     name: resolved.name,
        //     dir: resolved.dir,
        //     isModule: resolved.isModule
        // });

        return {
            path: resolved.path,
            name: resolved.name,
            dir: resolved.dir,
            isModule: resolved.isModule
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
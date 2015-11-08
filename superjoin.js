var SourceMapGenerator = require('source-map').SourceMapGenerator;
var SourceNode = require('source-map').SourceNode;

module.exports = (function() {
    'use strict';

    var path = require('path');
    
    var grunt = require('grunt');
    
    var Superjoin = function(conf) {
        conf = conf || {};

        var dir;

        this.workingDir = conf.workingDir || process.cwd();
        this.root = conf.root || this.workingDir || process.cwd();
        this.modules = [];
        this.confFiles = [];

        this.libDir = conf.libDir || null;
        this.bwrDir = conf.bwrDir || null;
        this.npmDir = conf.npmDir || null;

        this.modulePaths = {};

        this.headerAdded = false;
        this.sourceMaps = false;
        this.files = [];
        this.rcalls = [];

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

        this.sourceMapGenerator = new SourceMapGenerator({
            file: 'sourcemaps.map'
        });

        this.sourceNode = new SourceNode();
    };

    Superjoin.prototype.add = function(file) {
        this.files.push(file);
    };

    Superjoin.prototype.flush = function(main) {
        var res = this.map(this.files, main);
        this.files = [];
        return res;
    };

    Superjoin.prototype.join = function(files, main) {
        return this.map(files, main).map(function(item) {
            return item.src;
        }).join('');
    };

    Superjoin.prototype.map = function(files, main) {
        var out = [];

        if (this.files) {
            files = this.files.concat(files || []);
        }

        if (this.verbose) {
            grunt.log.ok('Reading files ...');
        }

        if (this.root.charAt(0) !== '/') {
            //Root is relative
            this.root = path.join(process.cwd(), this.root);
        }

        if (this.verbose) {
            grunt.log.ok('Working dir:', this.workingDir);
            grunt.log.ok('Root dir:', this.root);
        }

        //addModule expects a file path
        var rootFile = path.join(this.root, 'index.js');

        if (this.banner && this.headerAdded === false) {
            out.push({
                path: '',
                type: 'banner',
                src: this.banner.trim() + '\n\n'
            });
        }

        if (!this.noRequire && this.headerAdded === false) {
            out.push({
                path: '',
                type: 'require',
                src: this.readFile(path.join(__dirname, 'public/require.js'))
            });
        }

        this.headerAdded = true;
        
        // console.log('FILES', files);

        files.forEach(function(file) {
            if (this.verbose) {
                grunt.log.ok(' ... reading', file);
            }
            out = out.concat(this.addModule(rootFile, file));
        }, this);

        if (this.autoload) {
            out.push({
                file: '',
                src: '//Enable autoloading\nwindow.require.autoload = true;\n\n'
            });
        }

        if (main) {
            if (this.verbose) {
                grunt.log.ok(' ... reading main', main, rootFile);
            }

            main = this.resolve(rootFile, main);
            out = out.concat(this.addModule(rootFile, main.name));
            out.push(this.addRequireCall(main.name));
        }

        if (this.rcalls.length) {
            out = out.concat(this.rcalls);
        }

        // if (this.sourceMaps) {
        //     out.push({
        //         path: '',
        //         type: 'sourcemaps',
        //         src: '\n//# sourceMappingURL=' + (this.sourceMapsFile || rootFile + '.map') + '\n'
        //     });
        // }

        // console.log('OUT', out);

        return out;
    };

    Superjoin.prototype.addRequireCall = function(name) {
        return this.rcalls.push({
            path: '',
            type: 'init-call',
            src: 'require(\'' + name + '\');\n'
        });
    };

    Superjoin.prototype.addModule = function(parent, file) {
        // console.log('ADD', parent, file);
        var resolved;
        if (typeof file === 'object') {
            resolved = {
                name: file.name,
                path: file.path
            };
        }
        else {
            resolved = this.resolve(parent, file);
        }

        var module = '';

        var name = resolved.name;
        if (resolved.alias) {
            module += 'require.alias[\'' + resolved.name + '\'] = \'' + resolved.alias + '\';\n';
            name = resolved.alias;
        }

        module += 'require.register(\'' + name + '\', function(module, exports, require) {\n';

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

        module += (/\.json$/.test(resolved.path) ? 'module.exports = ' : '');
        module += source;
        module += '\n});\n';

        if (this.sourceMaps) {
            var chunks = source.split('\n');
            chunks.forEach(function(line, index) {
                line += '\n';
                this.sourceNode.add(new SourceNode(index + 1, 0, path.basename(resolved.path), line));
            }, this);

            this.sourceNode.setSourceContent(path.basename(resolved.path), source || '//no content added yet!');

            // this.sourceMapGenerator.addMapping({
            //   source: name,
            //   original: { line: fileStart, column: 0 },
            //   generated: { line: 3, column: 456 }
            // })
        }

        var out = [{
            path: name,
            src: module
        }];

        this.modules.push(resolved.path);

        if (resolved.isModule) {
            out = out.concat(this.grepSubmodules(resolved, source));
        }

        return out;
    };

    Superjoin.prototype.grepSubmodules = function(module, source) {
        // console.log('GREP', module);
        var pattern = /require\((.+?)\)/g,
            out = [];

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

            out = out.concat(this.addModule(module.path, subModule));
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

        // console.log('MOOOD', moduleDir, file, moduleType);
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
            dir: moduleDir,
            path: filepath,
            isModule: true,
            isNodeModule: true,
            prefix: modulePrefix
        };
    };

    Superjoin.prototype.resolve = function(from, to) {
        // console.log('Resolve: "%s" "%s"', from, to);

        var fromDir = path.dirname(from);
        var resolved;

        var getPathProperties = function(path) {
            var resolved;

            if (this.libDir && path.indexOf(this.libDir) === 0) {
                resolved = {
                    path: path,
                    name: path.replace(this.libDir.replace(/\/$/, '') + '/', ''),
                    dir: this.libDir,
                    isModule: true
                };
            }

            if (!resolved && this.bwrDir && path.indexOf(this.bwrDir) === 0) {
                resolved = {
                    path: path,
                    name: path.replace(this.bwrDir.replace(/\/$/, '') + '/', ''),
                    dir: this.bwrDir,
                    isModule: true
                };
            }
            
            if (!resolved && this.npmDir && path.indexOf(this.npmDir) === 0) {
                resolved = {
                    path: path,
                    name: path.replace(this.npmDir.replace(/\/$/, '') + '/', ''),
                    dir: this.npmDir,
                    isModule: true
                };
            }

            if (!resolved) {
                resolved = {
                    path: path,
                    name: path.replace(this.root.replace(/\/$/, ''), '.'),
                    dir: this.root,
                    isModule: false
                };
            }

            return resolved;
        }.bind(this);

        var resolveModule = function(file) {
            var resolved;

            // console.log('RESMOD', file);

            if (this.libDir) {
                resolved = this.loadModule('lib', file);
            }

            if (!resolved && this.bwrDir) {
                resolved = this.loadModule('bower', file);
            }
            
            if (!resolved && this.npmDir) {
                resolved = this.loadModule('npm', file);
            }


            // console.log('MOD RESOLVED', resolved);
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
                // console.log('OK', resolved);
            }
            else {
                //Handle module path
                resolved = to;
                if (!/\.[a-z]{2,4}$/.test(resolved)) {
                    resolved += '.js';
                }

                var modPath = to.split('/');
                var mod = resolveModule(modPath[0]);

                // console.log('MOD', mod);

                resolved = {
                    name: to,
                    dir: mod.dir,
                    isModule: mod.isModule,
                    path: path.join(mod.dir, to)
                };
                
            }
        }
        else if (/\./.test(to)) { //Contains a dot, but no slash
            resolved = path.resolve(fromDir, to);
            if (grunt.file.exists(resolved)) {
                resolved = getPathProperties(resolved);
            }
            else {
                resolved = resolveModule(to);
            }
        }
        else {
            resolved = resolveModule(to);
        }

        /*console.log('RESOLVED:', {
            path: resolved.path,
            name: resolved.name,
            dir: resolved.dir,
            isModule: resolved.isModule
        });*/
        

        //Do we need an alias?
        if (path.join(resolved.dir, resolved.name) !== resolved.path) {
            resolved.alias = path.relative(resolved.dir, resolved.path);
        }

        // console.log('RESOLVED:', resolved);
        return {
            path: resolved.path,
            name: resolved.name,
            dir: resolved.dir,
            isModule: resolved.isModule,
            alias: resolved.alias
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
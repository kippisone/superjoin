'use strict';

let superconf = require('superconf');

/**
 * Superjoin module
 *
 * @module Superjoin
 */
let path = require('path');

let TaskRunner = require('co-tasks');
let fl = require('node-fl');
let log = require('logtopus').getLogger('superjoin');

log.setLevel('sys');

/**
 * Superjoin class
 *
 * @constructor
 */
class Superjoin extends TaskRunner {
  constructor(conf) {
    super({
      debug: conf.verbose || false
    });
    conf = conf || {};
    this.initialConf = conf;

    if (conf.verbose) {
      log.setLevel('debug');
    }

    this.modules = [];
    this.fileCache = {};
    this.scripts = [];
    this.modules = [];
    this.rcalls = [];
    this.__plugins = [];
    // this.__precompilers = {};
    this.plugins = ['coffee', 'eslint', 'babel', 'firetpl'];

    this.importPattern = {
      'js': [
        /require\s*\(\s*'(.+?)\'\s*\)/,
        /require\s*\(\s*"(.+?)\"\s*\)/
      ]
    };

    this.defineTasks(['init', 'configure', 'collect', 'precompile', 'build', 'write', 'clean']);
    this.registerTasksDir(path.join(__dirname, '../tasks/'));

    this.configure();

    if (!conf.skipPlugins) {
     this.loadPlugins();
     this.callPlugins();
    }
  }

  loadPlugins() {
   let pluginDirs = [path.join(__dirname, '../node_modules'), path.join(this.workingDir, './node_modules')];

   log.debug('Load plugins');
   for (let plugin of this.plugins) {
    log.debug(' ... loading plugin', plugin);

    try {
     for (let pluginDir of pluginDirs) {
      let pluginModule = 'superjoin-' + plugin + '-plugin';
      if (fl.exists(path.join(pluginDir, pluginModule, 'package.json'))) {
       let pluginPkg = require(path.join(pluginDir, pluginModule, 'package.json'));
       this.__plugins.push({
        name: pluginPkg.name,
        version: pluginPkg.version,
        fn: require(path.join(pluginDir, pluginModule))
       });

       break;
      }
     }
    }
    catch(err) {
     log.error(err.stack || err);
    }
   }
  }

  callPlugins() {
   for (let plugin of this.__plugins) {
    try {
     plugin.fn(this, log);
    }
    catch(err) {
     plugin.callErr = err;
    }
   }
  }

  configure() {
    this.workingDir = this.initialConf.workingDir || process.cwd();

    this.confFiles = this.initialConf.confFiles || null;
    if (!this.confFiles) {
      this.confFiles = [
        path.join(this.workingDir, 'superjoin.json'),
        path.join(this.workingDir, 'package.json')
      ];
    }

    let sjConf = superconf('superjoin') || {};

    this.root = this.initialConf.root || sjConf.root || this.workingDir;
    this.umd = this.initialConf.umd || sjConf.umd || false;
    this.umdDependencies = this.initialConf.umdDependencies || sjConf.umdDependencies || false;
    this.skipSubmodules = this.initialConf.skipSubmodules || sjConf.skipSubmodules || false;
    this.onSubmodule = this.initialConf.onSubmodule || null;
    this.outfile = this.initialConf.outfile || sjConf.outfile || null;
    this.dev = this.initialConf.dev || sjConf.dev || null;
    this.main = this.initialConf.main || sjConf.main || null;
    this.name = this.initialConf.name || sjConf.name || null;
    this.noRequire = this.initialConf.noRequire || sjConf.noRequire || null;
    this.banner = this.initialConf.banner || null;

    if (this.initialConf.files && this.initialConf.files.length > 0) {
      this.files = this.initialConf.files;
    }
    else {
      this.files = sjConf.files;
    }

    if (this.initialConf.libs && this.initialConf.libs.length > 0) {
      this.libs = this.initialConf.libs;
    }
    else {
      this.libs = sjConf.libs;
    }

    if (this.root && this.root.charAt(0) !== '/') {
      this.root = path.join(this.workingDir, this.root);
    }

    if (this.outfile && this.outfile.charAt(0) !== '/') {
      this.outfile = path.join(this.root, this.outfile);
    }

    this.libDir = this.initialConf.libDir || sjConf.libDir || null;
    if (this.libDir && this.libDir.charAt(0) !== '/') {
      this.libDir = path.join(this.root, this.libDir);
    }

    this.bwrDir = this.initialConf.bwrDir || sjConf.bwrDir || null;
    if (this.bwrDir && this.bwrDir.charAt(0) !== '/') {
      this.bwrDir = path.join(this.workingDir, this.bwrDir);
    }
    else {
      let dir = path.join(this.workingDir, 'bower_components');
      while (true) {
        if (fl.isDir(dir)) {
          this.bwrDir = dir;
          break;
        }

        dir = path.join(dir, '../../bower_components');
        if (dir === '/bower_components') {
          break;
        }
      }
    }

    this.npmDir = this.initialConf.npmDir || sjConf.npmDir || null;
    if (this.npmDir && this.npmDir.charAt(0) !== '/') {
      this.npmDir = path.join(this.workingDir, this.npmDir);
    }
    else {
      let dir = path.join(this.workingDir, 'node_modules');
      while (true) {
        if (fl.isDir(dir)) {
          this.npmDir = dir;
          break;
        }

        dir = path.join(dir, '../../node_modules');
        if (dir === '/node_modules') {
          break;
        }
      }
    }

    this.plugins = this.plugins.concat(
     this.initialConf.plugins || []
    ).filter(
     (item, index, arr) => arr.indexOf(item) === index
    );

    log.debug('Working dir:', this.workingDir);
    log.debug('Root dir:', this.root);
    log.debug('Is UMD:', this.umd);
    log.debug('Skip submodules:', this.skipSubmodules);
    log.debug('Conf files:', this.confFiles);
    log.debug('Use libDir:', this.libDir);
    log.debug('Use bwrDir:', this.bwrDir);
    log.debug('Use npmDir:', this.npmDir);
    log.debug('Outfile:', this.outfile);
  }

  /**
   * Adds a file to superjoin
   * @param {String|Object} file Filename or a FileObject
   */
  add(file, isLib) {
    if (isLib) {
      this.libs.push(file);
    }

    this.files.push(file);
  }

  /**
   * Adds a module if it does not exist yet
   *
   * @param {string} parent Path of parent file
   * @param {string} file   Filename or resolve object of loading module
   */
  addModule(parent, file, parentDir) {
    let module = this.createModule(parent, file, parentDir);
    if (!module) {
      return null;
    }

    this.scripts.push(module);

    if (!this.skipSubmodules) {
      this.grepSubmodules(module);
    }

    return module;
  }

  /**
   * Adds a lib if it does not exist yet
   *
   * @param {string} parent Path of parent file
   * @param {string} file   Filename or resolve object of loading module
   */
  addLib(parent, file, parentDir) {
    let module = this.createModule(parent, file, parentDir);
    if (!module) {
      return null;
    }

    this.scripts.push(module);

    return module;
  }

  createModule(parent, file, parentDir) {
    log.debug('Add script module', parent, file);
    var resolved;
    if (typeof file === 'object') {
      resolved = {
        name: file.name,
        path: file.path
      };
    }
    else {
      resolved = this.resolve(parent, file, parentDir);
    }

    log.debug(' ... resolved', resolved.name);

    if (this.scripts.some(mod => mod.name === resolved.name)) {
      log.debug(' ... ignore module, already added');
      return;
    }

    if (!fl.exists(resolved.path)) {
      throw new Error(`Module ${parent} requires ${file}, but it was not found!`);
    }

    var source = this.loadFile(resolved.path);

    var module = {
      name: resolved.name,
      source: source,
      path: resolved.path,
      ext: path.extname(resolved.path).substr(1),
      alias: resolved.alias
    };

    return module;
  }

  resolve(from, to, parentDir) {
    let fromDir = path.dirname(from);
    let resolved;
    let parentExt = path.extname(fromDir).substr(1);

    let getPathProperties = function(pathname) {
      let resolved;

      if (this.libDir && pathname.indexOf(this.libDir) === 0) {
        resolved = {
          path: pathname,
          name: pathname.replace(this.libDir.replace(/\/$/, '') + '/', ''),
          dir: this.libDir,
          isModule: true
        };
      }

      if (!resolved && this.bwrDir && pathname.indexOf(this.bwrDir) === 0) {
        resolved = {
          path: pathname,
          name: pathname.replace(this.bwrDir.replace(/\/$/, '') + '/', ''),
          dir: this.bwrDir,
          isModule: true
        };
      }

      if (!resolved && this.npmDir && pathname.indexOf(this.npmDir) === 0) {
        resolved = {
          path: pathname,
          name: pathname.replace(this.npmDir.replace(/\/$/, '') + '/', ''),
          dir: this.npmDir,
          isModule: true
        };
      }

      if (!resolved) {
        resolved = {
          path: pathname,
          name: pathname.replace(this.root.replace(/\/$/, ''), '.'),
          dir: this.root,
          isModule: false
        };
      }

      return resolved;
    }.bind(this);

    var resolveModule = function(file) {
      var resolved;

      if (this.libDir) {
        resolved = this.loadModule('lib', file);
      }

      if (!resolved && this.bwrDir) {
        resolved = this.loadModule('bower', file);
      }

      if (!resolved && this.npmDir) {
        resolved = this.loadModule('npm', file, parentDir ? parentDir + '/node_modules' : null);
      }

      if (!resolved) {
        log.debug('Resolve as local module:', file);
        //Try to resolve as local module
        resolved = this.resolve(from, './' + file);
      }

      return resolved;
    }.bind(this);

    // var resolved;

    if (/^\$(npm|bower|lib)\/(.+)$/.test(to)) { //Its a module
      var type = RegExp.$1;
      resolved = this.loadModule(type, RegExp.$2);
    }
    else if (/\//.test(to)) { //Contains a slash
      let reg = new RegExp('\\.' + parentExt + '|json$');
      if (/^\.\.?\//.test(to)) {
        resolved = path.resolve(fromDir, to);
        if (!reg.test(resolved)) {
          resolved += '.js';
        }

        resolved = getPathProperties(resolved);
      }
      else {
        //Handle module path
        var modPath = to.split('/');

        let mod;
        if (parentDir && parentDir.indexOf('/node_modules') !== -1) {
          let d = parentDir + '/node_modules';
          while(true) {
            if (d === '/') {
              break;
            }

            if (/\/node_modules$/.test(d) && fl.isDir(path.join(d, modPath[0]))) {
              mod = this.loadModule('npm', modPath[0], d);
              mod.name = to;
              mod.dir = mod.dir;
              mod.path = path.join(mod.dir, mod.name);
              break;
            }

            d = path.join(d, '..');
          }
        }
        else {
          mod = resolveModule(modPath[0]);
          mod.name = to;
          mod.path = path.join(mod.dir, to);
        }

        if (!mod) {
          throw new Error('Module ' + to + ' could not be found!');
        }

        resolved = mod;

      }
    }
    else if (/\./.test(to)) { //Contains a dot, but no slash
      resolved = path.resolve(fromDir, to);
      if (fl.exists(resolved)) {
        resolved = getPathProperties(resolved);
      }
      else {
        resolved = resolveModule(to);
      }
    }
    else {
      resolved = resolveModule(to);
    }

    //Do we need an alias?
    if (path.join(resolved.dir, resolved.name) !== resolved.path) {
      resolved.alias = resolved.name;
      resolved.name = path.relative(resolved.dir, resolved.path);
    }

    let dirName = resolved.path.replace(/\.js$/, '');
    if (fl.isDir(dirName)) {
      resolved.name = resolved.name.replace(/\.js$/, '/index.js');
      resolved.path = path.join(resolved.dir, resolved.name);
    }
    return {
      path: resolved.path,
      name: resolved.name,
      dir: resolved.dir,
      isModule: resolved.isModule,
      alias: resolved.alias
    };
  }

  loadModule(moduleType, file, parentDir) {
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
        moduleDir = parentDir || this.npmDir;
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
      if (!/\.js(on)$/.test(name)) {
        name += '.js';
        filepath += '.js';
      }
    }
    else if (fl.exists(nodeModule)) {
      var bwr = fl.exists(path.join(nodeModule, '/bower.json')) ?
        require(path.join(nodeModule, '/bower.json')) : null;
      var pkg = fl.exists(path.join(nodeModule, '/package.json')) ?
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
      else if (pkg && pkg.browser && typeof pkg.browser === 'string') {
        filename = pkg.browser;
        filepath = path.join(nodeModule, filename);
        if (fl.isDir(filepath)) {
          filepath = path.join(filepath, 'index.js');
        }

        filename = name + filepath.replace(dir, '');
      }
      else if (pkg && pkg.main) {
        filename = pkg.main;
        filepath = path.join(nodeModule, filename);
        if (fl.isDir(filepath)) {
          filepath = path.join(filepath, 'index.js');
        }

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
  }

  /**
   * Load a file content, read from cache if it is cached, otherwise reads file from disk and add file to file cache
   * @param  {String} file File path
   * @return {String}          Returns file content
   */
  loadFile(file) {
    if (!this.fileCache[file]) {
      log.debug('Load file into cache:', file);
      if (!fl.exists(file)) {
        throw new Error(`Module ${file} not found!`);
      }
      let source = fl.read(file);
      this.fileCache[file] = source;
    }

    return this.fileCache[file];
  }

  /**
   * Loads a file into the file cache
   * @param  {String} filename Filename
   * @param  {String} source   Filesource
   */
  loadIntoCache(filename, source) {
    this.fileCache[filename] = source;
  }

  addRequireCall(name) {
    return this.rcalls.push('require(\'' + name + '\');\n');
  }

  grepSubmodules(module) {
    log.debug('Grep submodules from:', module.name);

    var ext = module.ext;
    if (!this.importPattern[ext] || this.importPattern[ext].length === 0) {
      return;
    }

    let pattern = this.importPattern[ext].map(item => {
      return item.source;
    });

    pattern = new RegExp('(?:' + pattern.join(')|(?:') + ')', 'g');
    var source = module.source;

    let match;
    while(pattern.global) {
      match = pattern.exec(source);
      if (!match) {
        break;
      }

      match = match.filter(item => {
        return !!item;
      });

      let subModule = match[1].trim();
      let subExt = path.extname(subModule).substr(1) || ext;
      let reg = new RegExp('\\.' + subExt + '$');
      if (subModule.indexOf('/') !== -1 && !reg.test(subModule)) {
        subModule += '.' + subExt;
      }

      if (this.umd && this.umdDependencies && Object.keys(this.umdDependencies).indexOf(subModule) !== -1) {
        log.debug('Module is an UMD dependency!', subModule);
        continue;
      }

      let subModuleDir;
      if (module.path.indexOf('/node_modules') !== -1) {
        subModuleDir = path.dirname(module.path);
      }

      if (this.onSubmodule && !this.onSubmodule(module)) {
        continue;
      }

      log.debug('Add submodule', module.path);
      this.addModule(module.path, subModule, subModuleDir);
    }
  }

  getUmdDependencies() {
    var deps = {
      amd: [],
      cjs: [],
      win: [],
      deps: []
    };

    if (this.umdDependencies) {
      for (var key in this.umdDependencies) {
        if (this.umdDependencies.hasOwnProperty(key)) {
          let prop = this.umdDependencies[key];
          deps.amd.push('\'' + prop[0] + '\'');
          deps.cjs.push('require(\'' + prop[1] + '\')');
          deps.win.push('window.' + prop[2]);
          deps.deps.push('\'' + key + '\'');
        }
      }
    }

    deps.amd = deps.amd.join(', ');
    deps.cjs = deps.cjs.join(', ');
    deps.win = deps.win.join(', ');
    deps.deps = deps.deps.join(', ');

    return deps;
  }

  /**
   * Starts the bundler
   *
   * @method build
   *
   * @returns {Object} Returns a promise
   */
  build() {
    return this.run(['init', 'configure', 'collect', 'precompile', 'build', 'write', 'clean'], this, null, 50000);
  }

  /**
   * Clears the file cache
   *
   * @method clearCache
   */
  clearCache() {
    this.fileCache = {};
  }

  /**
   * Registers a import pattern for a filetype. The pattern is used to find submodules
   * @param  {string} ext     File type (Could be 'js', 'coffee', etc...)
   * @param  {regexp} pattern Regular expression pattern. First and only match matches filename
   */
  registerImportPattern(ext, pattern) {
    if (!this.importPattern[ext]) {
      this.importPattern[ext] = [];
    }

    this.importPattern[ext].push(pattern);
  }

  //--
}

module.exports = Superjoin;

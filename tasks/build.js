'use strict';

let path = require('path');
let fl = require('node-fl');

/**
 * The build task creates a bundle of all scripts and stores it in the `bundle` property
 * @param  {object} superjoin Superjoin instance
 * @param  {object} log       Logger instance
 */
module.exports = function(superjoin, log) {
  superjoin.registerTask('build', function *() {
    log.debug('Run core build task');
    var bundle = '';

    if (this.banner) {
        bundle += this.banner.trim() + '\n\n';
    }

    if (this.umd) {
        let deps = this.getUmdDependencies();
        log.debug('Create UMD module with name:', this.umd);
        this.umdSourceFile = this.loadFile(path.join(__dirname, '../public/umd.js'));
        this.umdSourceFile = this.umdSourceFile.replace(/\/\*\*SUPREJOIN_MODULE_NAME\*\*\//g, this.umd === true ? this.name : this.umd);
        this.umdSourceFile = this.umdSourceFile.replace(/\/\*\*SUPREJOIN_AMD_DEPS\*\*\//g, deps.amd);
        this.umdSourceFile = this.umdSourceFile.replace(/\/\*\*SUPREJOIN_CJS_DEPS\*\*\//g, deps.cjs);
        this.umdSourceFile = this.umdSourceFile.replace(/\/\*\*SUPREJOIN_WIN_DEPS\*\*\//g, deps.win);
        this.umdSourceFile = this.umdSourceFile.replace(/\/\*\*SUPERJOIN_DEPENDENCIES\*\*\//g, deps.deps);
        this.umdSourceFile = this.umdSourceFile.replace(/\/\*\*SUPERJOIN_MAIN_PATH\*\*\//g, this.main);
        this.umdSourceFile = this.umdSourceFile.split('/**SUPERJOIN-UMD-MODULES**/');

        bundle += this.umdSourceFile[0];
    }
    else if (!this.noRequire) {
        bundle += fl.read(path.join(__dirname, '../public/require.js'));
    }

    for (let script of this.scripts) {
        var module = '';

        if (script.alias) {
            module += 'require.alias[\'' + script.alias + '\'] = \'' + script.name + '\';\n';
        }

        if (this.modules.indexOf(script.name) !== -1) {
            if (this.verbose) {
                log.debug('Module already added!', script.name);
            }

            return '';
        }

        module += 'require.register(\'' + script.name + '\', function(module, exports, require) {\n';

        module += (/\.json$/.test(script.name) ? 'module.exports = ' : '');
        module += script.source;
        module += '\n});\n';

        bundle += module;
    }

    if (this.dev) {
        bundle += '//Enable autoloading\nwindow.require.autoload = true;\n\n';
    }

    if (this.rcalls.length) {
        bundle += this.rcalls.join('\n');
    }

    if (this.main) {
        if (this.umd) {
            bundle += 'return require(\'' + this.main + '\');';
            bundle += this.umdSourceFile[1];
        }
        else {
            bundle += 'require(\'' + this.main + '\');\n';
        }
    }

    this.bundle = bundle;
  });
};

'use strict';

let path = require('path');

/**
 * Pipe an instance through each superjoin call.
 *
 * Pipe object struckture:
 *
 *  {
 * 	  scripts: [{
 * 	  	name: '<module name>',
 * 	  	path: '<module path>',
 * 	  	source: '<module source>'
 * 	  }]
 *  }
 */
class ModulesList {
  constructor() {
    this.scripts = [];
  }

  add(module) {
    let fullPath = this.resolvePath(module);
    if (!this.scripts.some(mod => { return mod.path === fullPath })) {
      this.scripts.push({
        path: fullPath,
        source: ''
      });
    }
  }

  resolvePath(pathname) {
    return path.resolve(this.workingDir, pathname);
  }
}

module.exports = ModulesList;

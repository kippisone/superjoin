'use strict';

let path = require('path');

class ModulesList {
  constructor() {
    this.modules = [];
    this.workingDir = null;
  }

  add(module) {
    let fullPath = this.resolvePath(module);
    if (!this.modules.some(mod => { return mod.path === fullPath })) {
      this.modules.push({
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

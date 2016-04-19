'use strict';

let path = require('path');

module.exports = function(superjoin, log) {
  superjoin.registerTask('collect', function *() {
    log.debug('Run core collect task');

    if (this.root.charAt(0) !== '/') {
      //Root is relative
      this.root = path.join(this.workingDir, this.root);
    }

    log.debug('Root path:', this.root);

    // addModule expects a parent path
    let rootFile = path.join(this.root, 'index.js');

    log.debug('Collecting files:', this.files);

    let files = this.files || [];
    files.forEach(function(file) {
      this.addModule(rootFile, file);
    }, this);

    if (this.main) {
      let main = this.resolve(rootFile, this.main);
      this.addModule(rootFile, main.name);
    }
  });
};

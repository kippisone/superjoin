'use strict';

let CoffeeScript = require('coffee-script').compile;

module.exports = function(superjoin, log) {
  superjoin.registerTask('precompile', function* () {
    let opts = {
      bare: true
    };
    for (let script of this.scripts) {
      if (!script.hasPrecompilation && script.ext === 'coffee') {
        script.source = CoffeeScript(script.source, opts);
      }
    }

    return true;
  });
};

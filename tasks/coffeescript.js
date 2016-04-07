'use strict';

let SpawnQueue = require('spawn-queue');

module.exports = function(superjoin, log) {
  superjoin.registerTask('precompile', function* () {
    // console.log('PRECOMPILE', this.scripts);
    let queue = new SpawnQueue({
      timeout: 5000
    });

    for (let script of this.scripts) {
      if (!script.hasPrecompilation && script.ext === 'coffee') {
        queue.push('coffee', ['-b', '-s', script.src], res => {
          script.source = res;
        });
      }
    }

    let results = yield queue.run();
    console.log('RES', results);
    return true;
  });
};

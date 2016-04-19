'use strict';

let Superjoin = require('../../modules/superjoin');
let superjoin = new Superjoin();

let inspect = require('inspect.js');

describe('Selfcheck', function() {
  describe('Plugins', function() {
    it('Should load plugins', function() {
      inspect(superjoin.plugins).isArray();
      inspect(superjoin.__plugins).isArray();
    });

    inspect.print(superjoin.__plugins);
    superjoin.__plugins.forEach(plugin => {
      it(` ... load ${plugin.name}`, function() {
        inspect(plugin.obj).isFunction();
      });
    });
  });
});

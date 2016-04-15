'use strict';

let Superjoin = require('../../modules/superjoin');
let superjoin = new Superjoin();

describe('Selfcheck', function() {
  describe('Plugins', function() {
    it('Should load plugins', function() {
      superjoin.loadPlugins();
    });

    superjoin.__plugins.forEach(plugin => {
      it(` ... load $plugin.name`, function() {

      });
    });
  });
});

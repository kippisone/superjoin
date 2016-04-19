'use strict';

let Superjoin = require('../../modules/superjoin');
let superjoin = new Superjoin({
  verbose: process.env.logLevel === 'debug'
});

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
        inspect(plugin.fn).isFunction();
      });
    });
  });

  describe ('Tasks', function() {
    it('Should load core tasks', function() {
      inspect(superjoin.tasks).isObject();
      inspect(superjoin.tasks).hasKey('collect');
      inspect(superjoin.tasks.collect[0]).isGenerator();
    });
  });
});

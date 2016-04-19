'use strict';

let Superjoin = require('./modules/superjoin');
let superjoin = new Superjoin({
  workingDir: './example/'
});

superjoin.build();

module.exports = function(superjoin, log) {
  superjoin.registerTask('configure', function* (modules) {
    console.log('PRECOMPILE', superjoin);
    console.log('PRECOMPILE MOD', modules);
    return true;
  });
};

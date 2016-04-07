module.exports = function(superjoin, log) {
  superjoin.registerTask('configure', function* (modules) {
    console.log('CORE-CONF', superjoin);
    console.log('CORE-CONF MOD', modules);
    superjoin.files.forEach(modules.add);
    return true;
  });
};

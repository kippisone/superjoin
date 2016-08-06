/*
 * Superjoin
 *
 * Copyright (c) 2015 Andi Heinkelein andi.oxidant@noname-media.com
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'modules/*.js',
        'superjoin.js'
      ],
      requirejs: {
        options: {
          strict: false
        },
        files: {
          src: [
            'require.js'
          ]
        }
      },
      options: {
        jshintrc: '.jshintrc'
      }
    },
    release: {
      options: {
        npm: true, //default: true
        indentation: '    ', //default: '  ' (two spaces)
        tagName: 'v<%= version %>', //default: '<%= version %>'
        commitMessage: 'Release v<%= version %>', //default: 'release <%= version %>'
        tagMessage: 'Tagging release v<%= version %>' //default: 'Version <%= version %>',
        // beforeRelease: ['build']
      }
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-bumpup');
  grunt.loadNpmTasks('grunt-release');

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint']);
};

var path = require('path');
var fs   = require('fs');
var mergeTrees = require('broccoli-merge-trees');
var funnel = require('broccoli-funnel');

var manifest = require('./lib/manifest');

module.exports = {
  name: 'broccoli-manifest',

  config: function (env, baseConfig) {
    var options = baseConfig.manifest || {};

    var defaultOptions = {
      enabled: env === 'production',
      appcacheFile: "/manifest.json",
      excludePaths: ['tests/', 'robots.txt', 'index.html', 'bootstrap.js'],
      includePaths: [],
      loadSortOptions: ['vendor'],
      loadExtensions: ['js', 'css']
    };

    for (var option in defaultOptions) {
      if (!options.hasOwnProperty(option)) {
        options[option] = defaultOptions[option];
      }
    }

    this.manifestOptions = options;
  },

  postprocessTree: function (type, tree) {
    var options = this.manifestOptions;

    if (type === 'all' && options.enabled) {
      manifestTree = funnel(tree, {
        exclude: options.excludePaths
      });
      return mergeTrees([tree, manifest(manifestTree, options)]);
    }

    return tree;
  },

  treeFor: function() {}
}

var fs = require("fs");
var path = require('path');
var brocWriter = require("broccoli-writer");
var helpers = require("broccoli-kitchen-sink-helpers");
var md5File = require('md5-file')
var crypto = require('crypto');


var BroccoliManifest = function BroccoliManifest(inTree, options) {
  options = options || {};

  if (!(this instanceof BroccoliManifest)) {
    return new BroccoliManifest(inTree, options);
  }

  this.inTree = inTree;

  this.appcacheFile    = options.appcacheFile    || "/manifest.json";
  this.includePaths    = options.includePaths    || [];
  this.loadExtensions  = options.loadExtensions  || [];
  this.loadSortOptions = options.loadSortOptions || [];
};

BroccoliManifest.prototype = Object.create(brocWriter.prototype);
BroccoliManifest.prototype.constructor = BroccoliManifest;

BroccoliManifest.prototype.write = function(readTree, destDir) {
  var self = this;

  var appcacheFile = this.appcacheFile;
  var includePaths = this.includePaths;

  return readTree(this.inTree).then(function (srcDir) {
    var manifest = {};

    var files = [];
    manifest['files'] = {};

    getFilesRecursively(srcDir, [ "**/*" ]).forEach(function (file) {
      var srcFile = path.join(srcDir, file);
      var stat = fs.lstatSync(srcFile);

      if (!stat.isFile() && !stat.isSymbolicLink())
        return;

      manifest['files'][file] = {};
      manifest['files'][file]['version'] = md5File(srcFile);
      manifest['files'][file]['filename'] = file;

      files.push(file);
    });

    manifest['load'] = [];

    // Filter out everything except our loadExtensions
    files = files.filter(function(i) {
      var extension = i.split('.').pop();
      return self.loadExtensions.indexOf(extension) < 0;

    });

    // Apply sort options
    self.loadSortOptions.forEach(function(sort_option) {
      var matches = files.filter(function(file) {
        return file.indexOf(sort_option) === -1;
      });

      manifest['load'] = manifest['load'].concat(matches);

      // Diff our arrays
      files = files.filter(function(i) {return matches.indexOf(i) < 0;});
    });

    // Load any of the files that didn't get caught by our sort options
    manifest['load'] = manifest['load'].concat(files);

    manifest['version'] = crypto.createHash('md5').update(JSON.stringify(manifest)).digest('hex');

    //includePaths.forEach(function (file) {
    //  lines.push(file);
    //});


    fs.writeFileSync(path.join(destDir, appcacheFile), JSON.stringify(manifest));
  });
};

BroccoliManifest.prototype.addExternalFile = function(file) {
  this.externalFiles.push(file);
}

function getFilesRecursively(dir, globPatterns) {
  return helpers.multiGlob(globPatterns, { cwd: dir });
}

module.exports = BroccoliManifest;

//{
//  "files": {
//    "jquery": {
//      "version": "afb90752e0a90c24b7f724faca86c5f3d15d1178",
//      "filename": "lib/jquery.min.js"
//    },
//    "bootstrap": {
//      "version": "35e0b4e5ac71901d9919b1a32b5ae69cc660d470",
//      "filename": "lib/bootstrap.min.css"
//    },
//    "bluebird": {
//      "version": "f37ff9832449594d1cefe98260cae9fdc13e0749",
//      "filename": "lib/bluebird.js"
//    },
//    "CordovaPromiseFS": {
//      "version": "58f3b1d28ea7dda0c1c336360b26f92e3f24731e",
//      "filename": "lib/CordovaPromiseFS.js"
//    },
//    "CordovaAppLoader": {
//      "version": "d6a10cd44da1ac10216593b735d9fe9f8acc22b6",
//      "filename": "lib/CordovaAppLoader.js"
//    },
//    "template": {
//      "version": "3e70f2873de3d9c91e31271c1a59b32e8002ac23",
//      "filename": "template.html"
//    },
//    "app": {
//      "version": "812c8c5632e276d6456dca04d624200fd1acb6c7",
//      "filename": "app.js"
//    },
//    "style": {
//      "version": "6e76f36f27bf29402a70c8adfee0f84b8a595973",
//      "filename": "style.css"
//    }
//  },
//
//  "load": [
//    "lib/jquery.min.js",
//    "lib/bootstrap.min.css",
//    "lib/bluebird.js",
//    "lib/CordovaPromiseFS.js",
//    "lib/CordovaAppLoader.js",
//    "app.js",
//    "style.css"
//  ],
//  "version": "3feefac61c0663c01c020a34be57fdbc0e9f88bf"
//}

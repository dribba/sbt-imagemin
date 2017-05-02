/*global process, require */
(function () {
  "use strict";

  // Ensure we have a promise implementation.
  //
  if (typeof Promise === 'undefined') {
      var Promise = require("es6-promise").Promise;
      global.Promise = Promise;
  }

  var mkdirp = require("mkdirp"),
      path = require("path"),
      imagemin = require("imagemin"),
      jpegtran = require('imagemin-jpegtran'),
      optipng = require('imagemin-optipng'),
      svgo = require('imagemin-svgo'),
      gifsicle = require('imagemin-gifsicle');

  var SOURCE_FILE_MAPPINGS_ARG = 2;
  var TARGET_ARG = 3;
  var OPTIONS_ARG = 4;

  var args = process.argv;
  var sourceFileMappings = JSON.parse(args[SOURCE_FILE_MAPPINGS_ARG]);
  var target = args[TARGET_ARG];
  var options = JSON.parse(args[OPTIONS_ARG]) || {};

  var interlaced = options.interlaced || true;
  var optimizationLevel = options.optimizationLevel || 3;
  var progressive = options.progressive || true;

  mkdirp(target);

  function parseDone() {
      if (--sourcesToProcess === 0) {
          console.log("\u0010" + JSON.stringify({results: results, problems: problems}));
      }
  }

  function reportError(source, error) {
      problems.push({
          message: error,
          severity: "error",
          source: source
      });
      console.error(error);
      parseDone();
  }

  var results = [];
  var problems = [];
  var sourcesToProcess = sourceFileMappings.length;
  sourceFileMappings.forEach(function(sourceFileMapping) {
    var input = sourceFileMapping[0];
    var output = path.join(target, sourceFileMapping[1]).match(/(.*)[/\\]{1}[^/\\]+/)[1];

    try {
      imagemin([input], output, {
        plugins: [
          jpegtran({ progressive: progressive }),
          gifsicle({ interlaced: interlaced }),
          optipng({ optimizationLevel: optimizationLevel }),
          svgo()
        ]
      }).then(function () {
        results.push({
          source: input,
          result: {
            filesRead: [input],
            filesWritten: [output]
          }
        });
        parseDone();
      }, function (err) {
        reportError(input, err);
      })
    } catch (err) {
      reportError(input, err);
    }
  });
})();
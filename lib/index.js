/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var path = require("path");
var tmp = require("tmp");
var execSync = require("execSync");

var phantomPath = require('slimerjs').path;
var soziToPdf = path.join(__dirname, "sozi-to-pdf.js");

exports.convertToPDF = function (inputFileName, options) {
    // If not set, compute the output file name from the input file name
    if (!options.output) {
        var inputExt = path.extname(inputFileName).slice(1);
        options.output = inputFileName.replace(new RegExp(inputExt + "$"), "pdf");
    }

    console.log("Converting " + inputFileName + " to " + options.output);

    // Create a temporary directory.
    // Force deletion on cleanup, even if not empty.
    var tmpDir = tmp.dirSync({unsafeCleanup: true});

    // Play the presentation and export each frame to its own file
    var resp = execSync.exec([
        phantomPath, soziToPdf,
        inputFileName, tmpDir.name,
        options.width * options.resolution, options.height * options.resolution,
        options.include, options.exclude
    ].join(" ")).stdout;

    console.log(resp);

    // Join all frames into a single PDF document
    resp = execSync.exec([
        "pdfjam",
        // The desired page size
        "--paper", options.paper,
        // Fit images to pages, do not override page size
        "--rotateoversize", false,
        // Page orientation
        options.portrait ? "--no-landscape" : "--landscape",
        // Output PDF file name
        "--outfile", options.output,
        // The list of files to join
        path.join(tmpDir.name, "*.png"),
        // Keep the first page of each document
        1
    ].join(" ")).stdout;

    console.log(resp);

    // Delete the temporary directory
    tmpDir.removeCallback();
};


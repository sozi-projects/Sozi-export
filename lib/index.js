/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var fs = require("fs");
var path = require("path");
var tmp = require("tmp");
var execSync = require("sync-exec");

var phantomPath = require('slimerjs').path;
var soziToPdf = path.join(__dirname, "sozi-to-pdf.js");
var soziToVideo = path.join(__dirname, "sozi-to-video.js");

function setOutputFileName(inputFileName, options, ext) {
    if (!options.output) {
        var inputExt = path.extname(inputFileName).slice(1);
        options.output = inputFileName.replace(new RegExp(inputExt + "$"), ext);
    }
}

exports.convertToPDF = function (inputFileName, options) {
    // If not set, compute the output file name from the input file name
    setOutputFileName(inputFileName, options, "pdf");

    console.log("Converting " + inputFileName + " to " + options.output);

    // Create a temporary directory.
    // Force deletion on cleanup, even if not empty.
    var tmpDir = tmp.dirSync({unsafeCleanup: true});

    // Play the presentation and export each frame to its own file
    var resp = execSync([
        phantomPath, soziToPdf,
        inputFileName, tmpDir.name,
        options.width * options.resolution, options.height * options.resolution,
        options.include, options.exclude
    ].join(" ")).stdout;

    console.log(resp);

    // Join all frames into a single PDF document
    resp = execSync([
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
};

exports.convertToPPTX = function (inputFileName, options) {
    // If not set, compute the output file name from the input file name
    setOutputFileName(inputFileName, options, "pptx");

    console.log("Converting " + inputFileName + " to " + options.output);

    // Create a temporary directory.
    // Force deletion on cleanup, even if not empty.
    var tmpDir = tmp.dirSync({unsafeCleanup: true});

    // Play the presentation and export each frame to its own file
    var resp = execSync([
        phantomPath, soziToPdf,
        inputFileName, tmpDir.name,
        options.width * options.resolution, options.height * options.resolution,
        options.include, options.exclude
    ].join(" ")).stdout;

    console.log(resp);

    // Join all frames into a single PPTX document
    var pptx = require("officegen")("pptx");

    pptx.on("finalize", function (written) {
        console.log("Finished creating PowerPoint file: " + options.output );
    });
    pptx.on("error", function (err) {
        console.log(err);
    });
    fs.readdirSync(tmpDir.name).forEach(function(file) {
        var slide = pptx.makeNewSlide();
        slide.addImage(path.join(tmpDir.name, file), {y: 0, x: 0, cy: "100%", cx: "100%" });
    });
    var out = fs.createWriteStream(options.output);
    out.on("error", function(err) {
        console.log(err);
    });
    pptx.generate(out);
};

exports.convertToVideo = function (inputFileName, options) {
    // If not set, compute the output file name from the input file name
    setOutputFileName(inputFileName, options, "ogv");

    console.log("Converting " + inputFileName + " to " + options.output);

    // Create a temporary directory.
    // Force deletion on cleanup, even if not empty.
    var tmpDir = tmp.dirSync({unsafeCleanup: true});

    // Play the presentation and export each animation step to its own file
    var resp = execSync([
        phantomPath, soziToVideo,
        inputFileName, tmpDir.name,
        options.width, options.height
    ].join(" ")).stdout;

    console.log(resp);

    // Join all images to a single video
    resp = execSync([
        "avconv",
        // Frames per second
        "-r", 50,
        // Convert a sequence of image files
        "-f", "image2",
        // The list of image files
        "-i", path.join(tmpDir.name, "%d.png"),
        // The video bit rate
        "-b:v", options.bitRate,
        // Overwrite the output file without asking
        "-y",
        // The name of the output video file
        options.output
    ].join(" ")).stdout;

    console.log(resp);
};

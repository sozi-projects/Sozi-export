#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var cmd = require("commander");
var path = require("path");
var soziExport = require("../lib");

cmd.option("-o, --output <file>", "Output video file, or output folder for an image sequence")
   .option("-i, --images", "Generate a sequence of PNG image files", false)
   .option("-W, --width <number>", "Video width, in pixels (defaults to 1024)", 1024)
   .option("-H, --height <number>", "Video height, in pixels (defaults to 768)", 768)
   .option("-c, --png-compression <number>", "Compression level of the generated PNG files (0 to 100, higher means smaller files, defaults to 100)", 100)
   .option("-b, --bit-rate <number>", "Video bit rate, in bits/second (defaults to 2M)", "2M")
   .parse(process.argv);

// The input file name is the last argument
var inputFileName = cmd.args[0];

// An input file name must be given
if (!inputFileName) {
    console.log("No input file given.");
    process.exit(1);
}

// The input file must be an HTML document
if (!/\.html?$/i.test(path.extname(inputFileName))) {
    console.log("Input file is not an HTML document.");
    process.exit(1);
}

soziExport.convertToVideo(inputFileName, cmd);

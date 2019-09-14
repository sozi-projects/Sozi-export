#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var cmd = require("commander");
var path = require("path");
var soziExport = require("../lib");

cmd.option("-o, --output <file>", "Output file")
   .option("-W, --width <number>", "Page width (defaults to 29.7)", 29.7)
   .option("-H, --height <number>", "Page height (defaults to 21)", 21)
   .option("-c, --png-compression <number>", "Compression level of the generated PNG files (0 to 100, higher means smaller files, defaults to 100)", 100)
   .option("-r, --resolution <number>", "Pixels per width/height unit (defaults to 72)", 72)
   .option("-i, --include <list>", "Frames to include (defaults to 'all')", "all")
   .option("-x, --exclude <list>", "Frames to exclude (defaults to 'none')", "none")
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

soziExport.convertToPPTX(inputFileName, cmd);

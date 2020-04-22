/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var system = require("system");
var fs = require("fs");
var page = require("webpage").create();
var tmpDir, compressionLevel;

/*
 * Custom implementation of console.log().
 * Called from sandboxed Javascript.
 */
page.onConsoleMessage = function (msg) {
    console.log("export-frames.js> " + msg);
};

/*
 * Render the current page into a PNG file.
 * Called from sandboxed Javascript.
 */
page.onCallback = function (index) {
    page.render(tmpDir + fs.separator + "img" + index + ".png", {format: "png", quality: 100 - compressionLevel});
};

/*
 * Sandboxed function
 */
function main(options) {
    function markInterval(list, first, last, step, value) {
        if (step > 0) {
            for (var i = first; i <= last; i += step) {
                if (i >= 0 && i < list.length) {
                    list[i] = value;
                }
            }
        }
    }

    /*
     * Parse an expression and mark the corresponding frames with the given value.
     *
     * expr ::= interval ("," interval)*
     *
     * interval ::=
     *      INT                     // frame number
     *    | INT? ":" INT?           // first:last
     *    | INT? ":" INT? ":" INT?  // first:second:last
     *
     * If first is omitted, it is set to 1.
     * If second is omitted, it is set to first + 1.
     * If last is omitted, it is set to list.length.
     */
    function markFrames(list, expr, value) {
        switch (expr) {
            case "all":
                markInterval(list, 0, list.length - 1, 1, value);
                break;
            case "none":
                break;
            default:
                expr.split(",").forEach(function (intervalDef) {
                    var interval = intervalDef.split(":").map(function (s) { return s.trim(); });
                    if (interval.length > 0) {
                        var first = interval[0] !== "" ? parseInt(interval[0]) - 1 : 0;
                        var last = interval[interval.length - 1] !== "" ? parseInt(interval[interval.length - 1]) - 1 : list.length - 1;
                        var second = interval.length > 2 && interval[1] !== "" ? parseInt(interval[1]) - 1 : first + 1;
                        if (!isNaN(first) && !isNaN(second) && !isNaN(last)) {
                            markInterval(list, first, last, second - first, value);
                        }
                    }
                });
        }
    }

    function zeroPadded(value, digits) {
        var result = value.toString();
        while(result.length < digits) {
            result = "0" + result;
        }
        return result;
    }

    var frameCount = sozi.presentation.frames.length;

    var frameSelection = new Array(frameCount);
    markInterval(frameSelection, 0, frameCount - 1, 1, false);
    markFrames(frameSelection, options.include, true);
    markFrames(frameSelection, options.exclude, false);

    var digits = frameCount.toString().length;

    if (sozi.player.disableMedia) {
        sozi.player.disableMedia();
    }

    sozi.player.addListener("frameChange", function () {
        var frameIndex = sozi.player.currentFrameIndex; // Sozi < 18
        if (typeof frameIndex !== "number") {
            frameIndex = sozi.player.currentFrame.index; // Sozi 18
        }
        window.callPhantom(zeroPadded((frameIndex + 1).toString(), digits));
    });

    document.querySelector(".sozi-blank-screen").style.display = "none";

    frameSelection.forEach(function (frameIsSelected, frameIndex) {
        if (frameIsSelected) {
            console.log("Exporting frame: " + (frameIndex + 1));
            sozi.player.jumpToFrame(frameIndex);
        }
    });
}

if (system.args.length < 7) {
    console.log("Usage: export-frames.js url.html tmpDir widthPx heightPx compressionLevel incList exclList");
    phantom.exit();
}
else {
    var url    = system.args[1];
    tmpDir     = system.args[2];
    var width  = system.args[3];
    var height = system.args[4];
    compressionLevel = system.args[5];

    // PhantomJS seems to consistently add 16 rows to the rendered images.
    page.viewportSize = {
        width:  parseFloat(width),
        height: parseFloat(height) - 16
    };

    page.clipRect = {top: 0, left: 0, width: Math.floor(width), height: Math.floor(height)};

    page.onInitialized = function () {
        page.evaluate(function () {
            // PhantomJS 1.9 doesn't support Function.bind
            Function.prototype.bind = Function.prototype.bind || function (thisp) {
                var fn = this;
                return function () {
                    return fn.apply(thisp, arguments);
                };
            };
        });
    };

    page.onLoadFinished = function (status) {
        if (status === "success") {
            page.evaluate(main, {include: system.args[6], exclude: system.args[7]});
        }
        phantom.exit();
    };

    page.open(url, function (status) {
        if (status !== "success") {
            console.log("export-frames.js> Unable to load the document: " + url);
        }
    });
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var system = require("system");
var page = require("webpage").create();
var tmpDir;

/*
 * Custom implementation of console.log().
 * Called from sandboxed Javascript.
 */
page.onConsoleMessage = function (msg) {
    console.log("sozi-to-pdf.js> " + msg);
};

/*
 * Render the current page into a PDF file.
 * Called from sandboxed Javascript.
 */
page.onCallback = function (fileName) {
//    page.zoomFactor = 0.5;
    page.render(tmpDir + "/" + fileName + ".png", {format: "png", quality: 100});
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

    sozi.player.addListener("frameChange", function () {
        window.callPhantom(zeroPadded((sozi.player.currentFrameIndex + 1).toString(), digits));
    });

    frameSelection.forEach(function (frameIsSelected, frameIndex) {
        if (frameIsSelected) {
            console.log("Exporting frame: " + (frameIndex + 1));
            sozi.player.jumpToFrame(frameIndex);
        }
    });
}

if (system.args.length < 7) {
    console.log("Usage: sozi-to-pdf.js url.html tmpDir widthPx heightPx incList exclList");
    phantom.exit();
}
else {
    var url = system.args[1];
    tmpDir = system.args[2];

    page.paperSize = {
        width:  system.args[3] + "px",
        height: system.args[4] + "px"
    };

    page.viewportSize = {
        width:  parseFloat(system.args[3]),
        height: parseFloat(system.args[4])
    };

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
            page.evaluate(main, {include: system.args[5], exclude: system.args[6]});
        }
        phantom.exit();
    };

    page.open(url, function (status) {
        if (status !== "success") {
            console.log("sozi-to-pdf.js> Unable to load the document: " + url);
        }
    });
}

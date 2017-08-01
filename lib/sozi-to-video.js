/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var system = require("system");
var fs = require("fs");
var page = require("webpage").create();
var tmpDir;
var Timing = require("./Timing");

/*
 * Custom implementation of console.log().
 * Called from sandboxed Javascript.
 */
page.onConsoleMessage = function (msg) {
    console.log("sozi-to-video.js> " + msg);
};

/*
 * Render the current page into a PDF file.
 * Called from sandboxed Javascript.
 */
page.onCallback = function (index) {
    page.render(tmpDir + fs.separator + "img" + index + ".png", {format: "png", quality: 100});
};

/*
 * Sandboxed function
 */
function main() {
    var TIME_STEP_MS = 20;
    var frameCount = sozi.presentation.frames.length;
    var imageIndex = 0;

    sozi.presentation.frames.forEach(function (currentFrame, currentFrameIndex) {
        console.log("Exporting frame: " + (currentFrameIndex + 1));

        sozi.player.jumpToFrame(currentFrameIndex);

        // Generate images for the duration of the current frame
        for (var timeMs = 0; timeMs < currentFrame.timeoutMs; timeMs += TIME_STEP_MS, imageIndex ++) {
            window.callPhantom(imageIndex);
        }

        // Generate images for the transition to the next frame.
        // If the last frame has a timeout enabled, transition to the first frame.
        if (currentFrameIndex < frameCount - 1 || currentFrame.timeoutEnable) {
            sozi.player.targetFrameIndex = sozi.player.nextFrameIndex;

            sozi.viewport.cameras.forEach(function (camera) {
                var lp = sozi.player.targetFrame.layerProperties[camera.layer.index];
                sozi.player.setupTransition(camera, sozi.Timing[lp.transitionTimingFunction], lp.transitionRelativeZoom, lp.transitionPath, false);
            });

            for (timeMs = 0; timeMs < sozi.player.targetFrame.transitionDurationMs; timeMs += TIME_STEP_MS, imageIndex ++) {
                sozi.player.onAnimatorStep(timeMs / sozi.player.targetFrame.transitionDurationMs);
                window.callPhantom(imageIndex);
            }
        }
    });
}

if (system.args.length < 5) {
    console.log("Usage: sozi-to-video.js url.html tmpDir widthPx heightPx");
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
            page.evaluate(Timing.setupTimingFunctions);
            page.evaluate(main);
        }
        phantom.exit();
    };

    page.open(url, function (status) {
        if (status !== "success") {
            console.log("sozi-to-video.js> Unable to load the document: " + url);
        }
    });
}

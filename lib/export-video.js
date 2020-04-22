/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var system = require("system");
var fs = require("fs");
var page = require("webpage").create();
var tmpDir, compressionLevel;
var Timing = require("./Timing");

/*
 * Custom implementation of console.log().
 * Called from sandboxed Javascript.
 */
page.onConsoleMessage = function (msg) {
    console.log("export-video.js> " + msg);
};

/*
 * Render the current page into a PDF file.
 * Called from sandboxed Javascript.
 */
page.onCallback = function (data) {
    function getFileName(index) {
        return tmpDir + fs.separator + "img" + index + ".png";
    }
    if (data.copy) {
        fs.copy(getFileName(data.index - 1), getFileName(data.index));
    }
    else {
        page.render(getFileName(data.index), {format: "png", quality: 100 - compressionLevel});
    }
};

/*
 * Sandboxed function
 */
function main() {
    var TIME_STEP_MS = 20;
    var frameCount = sozi.presentation.frames.length;
    var imageIndex = 0;

    document.querySelector(".sozi-blank-screen").style.display = "none";

    // Workaround to force the desired image height.
    var height = window.innerHeight + "px";
    document.body.style.overflow  = "hidden";
    document.body.style.height    = height;
    document.body.style.maxHeight = height;

    if (sozi.player.disableMedia) {
        sozi.player.disableMedia();
    }

    sozi.presentation.frames.forEach(function (currentFrame, currentFrameIndex) {
        console.log("Exporting frame: " + (currentFrameIndex + 1));

        sozi.player.jumpToFrame(currentFrameIndex);

        // Generate images for the duration of the current frame
        for (var timeMs = 0; timeMs < currentFrame.timeoutMs; timeMs += TIME_STEP_MS, imageIndex ++) {
            window.callPhantom({index: imageIndex, copy: timeMs > 0});
        }

        // Generate images for the transition to the next frame.
        // If the last frame has a timeout enabled, transition to the first frame.
        if (currentFrameIndex < frameCount - 1 || currentFrame.timeoutEnable) {
            if (typeof sozi.player.nextFrameIndex === "number") {
                sozi.player.targetFrameIndex = sozi.player.nextFrameIndex; // Sozi < 18
            }
            else {
                sozi.player.targetFrame = sozi.player.nextFrame; // Sozi 18
            }

            sozi.viewport.cameras.forEach(function (camera) {
                var lp = sozi.player.targetFrame.layerProperties[camera.layer.index];
                sozi.player.setupTransition(camera, sozi.Timing[lp.transitionTimingFunction], lp.transitionRelativeZoom, lp.transitionPath, false);
            });

            for (timeMs = 0; timeMs < sozi.player.targetFrame.transitionDurationMs; timeMs += TIME_STEP_MS, imageIndex ++) {
                sozi.player.onAnimatorStep(timeMs / sozi.player.targetFrame.transitionDurationMs);
                window.callPhantom({index: imageIndex});
            }
        }
    });
}

if (system.args.length < 5) {
    console.log("Usage: export-video.js url.html tmpDir widthPx heightPx compressionLevel");
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
            page.evaluate(Timing.setupTimingFunctions);
            page.evaluate(main);
        }
        phantom.exit();
    };

    page.open(url, function (status) {
        if (status !== "success") {
            console.log("export-video.js> Unable to load the document: " + url);
        }
    });
}

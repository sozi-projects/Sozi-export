
:warning: Since Sozi 20.10, export features are integrated in the
[Sozi presentation editor](https://github.com/sozi-projects/Sozi).
Development of the standalone Sozi-export tool is halted and there is no plan
to do any maintenance work on it.

Export Sozi presentations to PDF, PPTX or video
===============================================

This tool is separate from the Sozi presentation editor.

Install
-------

The PDF exporter depends on [pdfjam](http://www2.warwick.ac.uk/fac/sci/statistics/staff/academic-research/firth/software/pdfjam), a shell script for manipulating PDF files.
The video exporter is based on [libav](https://libav.org).
Users of Debian-based distributions can install the *texlive-extra-utils* and *libav-tools* packages.

```bash
sudo apt install texlive-extra-utils libav-tools
```

The Sozi export tool is available as an NPM package.
Install [node.js](https://nodejs.org/) 0.10 or later
(Linux users can use the [NodeSource distributions](https://github.com/nodesource/distributions)),
then:

```bash
sudo npm install -g sozi-export
```

With NPM 5, the installation is known to fail with this message:

```
Phantom installation failed { Error: EACCES: permission denied, link '/tmp/phantomjs/phantomjs-2.1.1-linux-x86_64.tar.bz2-extract-1522473900842/phantomjs-2.1.1-linux-x86_64' -> '/usr/lib/node_modules/sozi-export/node_modules/phantomjs-prebuilt/lib/phantom'
```

This can be fixed with the following command:

```bash
sudo npm install -g sozi-export --unsafe-perm
```

Convert a Sozi presentation to PDF
----------------------------------

```bash
sozi-to-pdf [options] presentation.sozi.html
```

Options:

* `-h`, `--help` Usage information
* `-o`, `--output <file>` Output file
* `-W`, `--width <number>` Page width (defaults to 29.7)
* `-H`, `--height <number>` Page height (defaults to 21)
* `-r`, `--resolution <number>` Pixels per width/height unit (defaults to 72)
* `-p`, `--paper <size>` A LaTeX paper size (defaults to a4paper)
* `-P`, `--portrait` Set the paper orientation to portrait (disabled by default)
* `-c`, `--png-compression <number>`, Compression level of the generated PNG files (0 to 100, higher means smaller files, defaults to 100)
* `-i`, `--include <list>` Frames to include (defaults to 'all')
* `-x`, `--exclude <list>` Frames to exclude (defaults to 'none')

The width, height and resolution options specify the geometry of the browser window
where the presentation is rendered.
The paper and portrait options specify the page format to use in the final PDF document.

The `include` option is always applied before the `exclude` option.
Frames lists have the following syntax:

* `all` selects all frames in the presentation.
* `none` selects no frame.
* A comma-separated list of frame numbers or ranges.
  A range is in the form `first:last` or `first:second:last` where `first`, `second` and `last` are frame numbers.

For instance : `-i 2,4:6,10:12:18` will include frames 2, 4, 5, 6, 10, 12, 14, 16, 18.

Convert a Sozi presentation to PPTX
-----------------------------------

```bash
sozi-to-pptx [options] presentation.sozi.html
```

Options:

* `-h`, `--help` Usage information
* `-o`, `--output <file>` Output file
* `-W`, `--width <number>` Page width (defaults to 29.7)
* `-H`, `--height <number>` Page height (defaults to 21)
* `-r`, `--resolution <number>` Pixels per width/height unit (defaults to 72)
* `-c`, `--png-compression <number>`, Compression level of the generated PNG files (0 to 100, higher means smaller files, defaults to 100)
* `-i`, `--include <list>` Frames to include (defaults to 'all')
* `-x`, `--exclude <list>` Frames to exclude (defaults to 'none')

The width, height and resolution options specify the geometry of the browser window
where the presentation is rendered.

The `include` option is always applied before the `exclude` option.
Frames lists have the following syntax:

* `all` selects all frames in the presentation.
* `none` selects no frame.
* A comma-separated list of frame numbers or ranges.
  A range is in the form `first:last` or `first:second:last` where `first`, `second` and `last` are frame numbers.

For instance : `-i 2,4:6,10:12:18` will include frames 2, 4, 5, 6, 10, 12, 14, 16, 18.

Convert a Sozi presentation to video
------------------------------------

```bash
sozi-to-video [options] presentation.sozi.html
```

Options:

* `-h`, `--help` Usage information
* `-o`, `--output <file>` Output video file, or target folder when exporting to a sequence of images
* `-i`, `--images` Export as a sequence of PNG files instead of a single video file
* `-W`, `--width <number>` Video width, in pixels (defaults to 1024)
* `-H`, `--height <number>` Video height (defaults to 768)
* `-b`, `--bit-rate <number>` Video bit rate (defaults to 2M)
* `-c`, `--png-compression <number>`, Compression level of the generated PNG files (0 to 100, higher means smaller files, defaults to 100)

Known issues and limitations
----------------------------

This tool uses a *headless* web browser for rendering.
[PhantomJS](http://phantomjs.org) and [SlimerJS](https://slimerjs.org/) both have benefits and limitations:

* PhantomJS can render a web page to a PDF document, which preserves the vector graphics and text.
  However, PhantomJS 1.9.19 fails to render the SVG content of a Sozi presentation.
* SlimerJS renders SVG content correctly but it does not support the PDF format.

Currently, the PDF and PPTX export tools render each frame to a PNG image and joins them into a single document.

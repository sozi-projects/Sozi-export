Export Sozi presentations to PDF or video
=========================================

This tool is separate from the Sozi presentation editor.

Install
-------

The PDF exporter depends on [pdfjam](http://www2.warwick.ac.uk/fac/sci/statistics/staff/academic-research/firth/software/pdfjam), a shell script for manipulating PDF files.
Users of Debian-based distributions can install the *texlive-extra-utils* package.

```bash
apt-get install texlive-extra-utils
```

The Sozi export tool is available as an NPM package.
Install [node.js](https://nodejs.org/), then:

```bash
npm install -g sozi-export
```

Convert a Sozi presentation to PDF
----------------------------------

```bash
sozi-to-pdf [options] presentation.sozi.html
```

Options:

* `-h`, `--help` output usage information
* `-o`, `--output <file>` Output file
* `-W`, `--width <number>` Page width (defaults to 29.7)
* `-H`, `--height <number>` Page height (defaults to 21)
* `-r`, `--resolution <number>` Pixels per width/height unit (defaults to 72)
* `-p`, `--paper <size>` A LaTeX paper size (defaults to a4paper)
* `-P`, `--portrait` Set the paper orientation to portrait (disabled by default)
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

Convert a Sozi presentation to video
------------------------------------

This is not implemented yet.

Known issues and limitations
----------------------------

This tool uses a *headless* web browser for rendering.
[PhantomJS](http://phantomjs.org) and [SlimerJS](https://slimerjs.org/) both have benefits and limitations:

* PhantomJS can render a web page to a PDF document, which preserves the vector graphics and text.
  However, PhantomJS 1.9.19 fails to render the SVG content of a Sozi presentation.
* SlimerJS renders SVG content correctly but it does not support the PDF format.

Currently, the PDF export tool renders each frame to a PNG image and joins them into a PDF document.

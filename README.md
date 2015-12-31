Export Sozi presentations to PDF or video
=========================================

This tool is separate from the Sozi presentation editor.

Known issues and limitations
----------------------------

This tool uses a *headless* web browser for rendering.
[PhantomJS](http://phantomjs.org) and [SlimerJS](https://slimerjs.org/) both have benefits and limitations:

* PhantomJS can render a web page to a PDF document, which preserves the vector graphics and text.
  However, PhantomJS 1.9.19 fails to render the SVG content of a Sozi presentation.
* SlimerJS renders SVG content correctly but it does not support the PDF format.

Currently, the PDF export tool renders each frame to a PNG image and joins them into a PDF document.

/**
 * sampler.js is a plugin to display code samples from specially-formatted
 * source files in reveal.js slides.
 *
 * See https://github.com/ldionne/reveal-sampler for documentation,
 * bug reports and more.
 *
 *
 * Author: Louis Dionne
 * License: MIT (see https://github.com/ldionne/reveal-sampler/blob/master/LICENSE.md)
 */

(function() {

    /**
     * @param {Number} lineNumber
     * @param {string} text
     * @constructor
     *
     * @property {Number} lineNumber
     * @property {string} text
     */
    var SampleLine = function(lineNumber, text) {
        this.lineNumber = lineNumber;
        this.text = text || '';
    };

    /**
     * SampleFile provides access to the lines and named samples in a file
     *
     * @param {string} content
     * @constructor
     */
    var SampleFile = function(content) {
        var line, currentSnippets = [], token, i, c, k;
        var parseLine = function(line) {
            var match, token_definition;
            for (var i = 0, c = SampleFile.TOKENS.length; i < c; i++) {
                token_definition = SampleFile.TOKENS[i];
                match = line.match(token_definition.pattern);
                if (match) {
                    return {
                        type : token_definition.type,
                        name : token_definition.nameIndex ? match[token_definition.nameIndex] : null
                    }
                }
            }
            return false;
        };
        this._lines = content.split(/\r?\n/);
        this._samples = {};
        for (i = 0, c = this._lines.length; i < c; i++) {
            line = this._lines[i];
            token = parseLine(line);
            if (token) {
                switch (token.type) {
                    case SampleFile.TOKEN_START_NAMED :
                        currentSnippets.push(token.name);
                        break;
                    case SampleFile.TOKEN_END_NAMED :
                        for (k = currentSnippets.length - 1; k >= 0; k--) {
                            if (currentSnippets[k] === token.name) {
                                currentSnippets.slice(k, 1);
                            }
                        }
                        break;
                    case SampleFile.TOKEN_END :
                        if (currentSnippets.length > 0) {
                            currentSnippets.pop();
                        }
                        break;
                }
            } else {
                currentSnippets
                    .filter(
                        function(value, index, self) { return self.indexOf(value) === index; }
                    )
                    .forEach(
                        function(index, line) {
                            return function(name) {
                                if (!this._samples.hasOwnProperty(name)) {
                                    this._samples[name] = [];
                                }
                                this._samples[name].push(new SampleLine(index + 1, line));
                            }.bind(this);
                        }.bind(this)(i, line)
                    )
            }
        }
    };

    SampleFile.TOKEN_START_NAMED = 'SAMPLE_START_NAMED';
    SampleFile.TOKEN_END_NAMED = 'SAMPLE_END_NAMED';
    SampleFile.TOKEN_END = 'SAMPLE_END';

    // define patterns for snippet delimiters
    SampleFile.TOKENS = [
        {
            type: SampleFile.TOKEN_START_NAMED,
            // expects: sample(snippet-name)
            pattern : /^[/*#\s]*sample\(([^)\r\n]+)\)/,
            nameIndex : 1
        },
        {
            type: SampleFile.TOKEN_END_NAMED,
            // expects: end-sample(snippet-name)
            pattern: /^[/*#\s]*end-sample\(([^)\r\n]+)\)/,
            nameIndex: 1
        },
        {
            type: SampleFile.TOKEN_END,
            // expects: end-sample
            pattern: /^[/*#\s]*end-sample/,
            nameIndex: null
        }
    ];

    /**
     * Get an array of lines
     *
     * @param {string} name
     * @returns {SampleLine[]}
     */
    SampleFile.prototype.getSample = function(name) {
        return this._samples[name] || null;
    };

    /**
     * Get an array of lines specified by start index and size
     *
     * @param {number} start
     * @param {number} length
     * @returns {SampleLine[]}
     */
    SampleFile.prototype.getLines = function(start, length) {
        var lines = [];
        var maximum = this._lines.length - 1;
        var end;
        if (maximum < 0) {
            return null;
        }
        start = (start < 0) ? maximum + start : start;
        end = (length < 0) ? maximum + length : start + length - 1;

        for (var i = start; i <= end; i++) {
            lines.push(new SampleLine(i + 1, this._lines[i]));
        }
        return lines;
    };

    /**
     * @returns {SampleLine[]}
     */
    SampleFile.prototype.getAll = function() {
        return this.getLines(0, this._lines.length);
    };


    /**
     * Fetches the files, create and return SampleFile objects
     *
     * @constructor
     */
    var SampleFiles = function() {
        this._files = {};
        this._requests = {};
    };

    /**
     * @callback SampleFilesFetchSuccess
     * @param {SampleFile} file
     */

    /**
     * Fetch file and execute callback with created SampleFile object
     *
     * @param {string} url
     * @param {SampleFilesFetchSuccess} success
     */
    SampleFiles.prototype.fetch = function(url, success) {
        var file, request;
        file = this._files[url] || null;
        if (file instanceof SampleFile) {
            // found existing file object, execute callback
            success(file);
        }
        request = this._requests[url] || null;
        if (request instanceof Object) {
            // found a request. store callback
            request.success.push(success);
        } else if (request === null) {
            // create and store a new request
            this._requests[url] = request = {
                xhr : new XMLHttpRequest(),
                success : [success]
            };
            request.xhr.onreadystatechange = function(url, request) {
                return function() {
                    if (request.xhr.readyState === XMLHttpRequest.DONE) {
                        if (
                            (request.xhr.status >= 200 && request.xhr.status < 300) ||
                            (request.xhr.status === 0 && request.xhr.responseText !== '')
                        ) {
                            this._files[url] = file = new SampleFile(request.xhr.responseText);
                            request.success.forEach(
                              function(file) {
                                  return function(success) {
                                      success(file);
                                  }
                              }(file)
                            );
                            this._requests[url] = true;
                        } else {
                            console.log('Failed to get file: ' + url);
                            this._requests[url] = false;
                        }
                    }
                }.bind(this)
            }.bind(this)(url, request);
            request.xhr.open("GET", url);
            try {
                request.xhr.send();
            }
            catch (e) {
                console.log('Error requesting file: ' + url);
            }
        }
    };

    /**
     * @constructor
     */
    var Sample = function() {
        this._lines = [];
    };

    Sample.RANGE_NUMBERS = 'NUMBERS';
    Sample.RANGE_NAMED = 'NAMED';

    /**
     * Create a Sample from a file using a selector
     * @param {SampleFile} file
     * @param {string} selector
     */
    Sample.createFromFile = function(file, selector) {
        var sample = new Sample();
        var ranges;
        if (selector) {
            ranges = Sample.parseSelector(selector);
            ranges.forEach(
                function(file) {
                    return function(range) {
                        var lines = null;
                        switch (range.type) {
                            case Sample.RANGE_NUMBERS :
                                lines = file.getLines(range.start, range.length);
                                break;
                            case Sample.RANGE_NAMED :
                                lines = file.getSample(range.name);
                                break;
                        }
                        if (lines) {
                            this.add(lines);
                        }
                    }.bind(this)
                }.bind(sample)(file)
            );
        } else {
            sample.add(file.getAll() || []);
        }
        return sample;
    };

    Sample.parseSelector = function(selector) {
        var ranges = selector.split(",") || [];
        var range, start, end;
        var result = [];
        for (var i = 0, c = ranges.length; i < c; i++) {
            // try to match a line number or range
            range = ranges[i].match(/^\s*(\d+)(?:-(\d+))?\s*$/);
            if (range) {
                start = parseInt(range[1]) || 0;
                end = parseInt(range[2]) || start;
                result.push(
                    {
                        type: Sample.RANGE_NUMBERS,
                        start: start - 1,
                        length: end - start + 1
                    }
                )
            } else {
                // otherwise treat it as a name
                range = ranges[i].trim();
                if (range !== '') {
                    result.push(
                        {
                            type: Sample.RANGE_NAMED,
                            name: range
                        }
                    )
                }
            }
        }
        return result.length > 0 ? result : null;
    };

    Sample.parseSelectorToLineIndex = function(selector) {
        var lines = {};
        var ranges = Sample.parseSelector(selector);
        if (ranges instanceof Array && ranges.length > 0) {
            for (var i = 0, c = ranges.length; i < c; i++) {
                if (ranges[i] instanceof Object && ranges[i].type === Sample.RANGE_NUMBERS) {
                    for (var x = 0; x < ranges[i].length; x++) {
                        lines[ranges[i].start + x] = true;
                    }
                }
            }
            return lines;
        }
        return null;
    };

    /**
     * @param {SampleLine[]} lines
     */
    Sample.prototype.add = function(lines) {
        this._lines.push.apply(
            this._lines,
            lines.filter(
                /**
                 * Skip lines that contain the `skip-sample` tag.
                 *
                 * @param {SampleLine} line
                 * @returns {boolean}
                 */
                function(line) {
                    return (
                        line instanceof SampleLine &&
                        line.text.indexOf('skip-sample') === -1
                    );
                }
            )
        );
    };

    /**
     * @param {HTMLElement} parentNode
     * @param {{removeIndentation: boolean, marked: string, lineNumbers}} options
     */
    Sample.prototype.appendTo = function(parentNode, options) {
        var line, lineNode, previousLineNode = null;
        var document = parentNode.ownerDocument;
        var indentationOffset = (options.removeIndentation) ? this.getIndentationLength() : 0;
        var marked = Sample.parseSelectorToLineIndex(options.marked || '') || {};
        var lineNumberStart =  parseInt(options.lineNumbers) || 0;
        if (options.lineNumbers === true || options.lineNumbers === 'true' || options.lineNumbers === 'yes') {
            lineNumberStart = 1;
        }
        parentNode.setAttribute('data-noescape', '');
        for (var i = 0, c = this._lines.length; i < c; i++) {
            line = this._lines[i];
            lineNode = parentNode.appendChild(document.createElement('span'));
            lineNode.setAttribute('class', 'line');
            if (options.lineNumbers === 'original') {
                lineNode.setAttribute('data-line-number', line.lineNumber);
            } else if (lineNumberStart > 0) {
                lineNode.setAttribute('data-line-number', lineNumberStart + i);
            }
            if (marked[i]) {
                lineNode
                    .appendChild(document.createElement('mark'))
                    .appendChild(document.createTextNode(line.text.substr(indentationOffset)));
            } else {
                lineNode.appendChild(document.createTextNode(line.text.substr(indentationOffset)));
            }
            if (previousLineNode) {
                previousLineNode.appendChild(document.createTextNode('\n'));
            }
            previousLineNode = lineNode;
        }
    };

    Sample.prototype.getIndentationLength = function() {
        return Math.min.apply(
            null,
            this
                ._lines
                .filter(
                    function (line) {
                        return line.text.trim() !== '';
                    }
                )
                .map(
                function (line) {
                    var indentation = line.text.match(/^[ \t]+/);
                    return indentation ? indentation[0].length : 0
                }
            )
        ) || 0;
    };

    // Read configuration options
    var config = Reveal.getConfig() || {};
    config.sampler = config.sampler || {};
    var options = {
        proxyURL: config.sampler.proxyURL || '',
        removeIndentation: !!config.sampler.removeIndentation,
        lineNumbers: [true, 'original'].indexOf(config.sampler.lineNumbers) !== -1
            ? config.sampler.lineNumbers : false
    };

    var files = new SampleFiles();
    var elements = document.querySelectorAll('[data-sample]');
    elements.forEach(
        /**
         *
         * @param {HTMLElement} element
         */
        function(element) {
            var slug = element.getAttribute('data-sample').match(/([^#]+)(?:#(.+))?/);
            var url = options.proxyURL + slug[1];
            var selector = slug[2] || '';

            files.fetch(
                url,
                function (sampleFile) {
                    var sample = Sample.createFromFile(sampleFile, selector);
                    var attributes = {
                        mark : element.getAttribute('data-sample-mark') || '',
                        indent: element.getAttribute('data-sample-indent'),
                        lineNumbers: element.getAttribute('data-sample-line-numbers')
                    };

                    sample.appendTo(
                        element,
                        {
                            // marked lines selector
                            marked: attributes.mark,
                            // indentation behaviour defined by attribute or global option
                            removeIndentation:
                                attributes.indent === 'remove' ||
                                (options.removeIndentation && attributes.indent !== 'keep'),
                            // line numbers behaviour
                            lineNumbers: attributes.lineNumbers || options.lineNumbers
                        }
                    );

                    // Add the right `language-xyz` class to the code block, if required.
                    var extension = url.split('.').pop();
                    var classString = element.getAttribute('class') || '';
                    if (!classString.match(/(^|\s)lang(uage)?-/)) {
                        element.setAttribute('class', classString + ' language-' + extension);
                    }
                    if (typeof hljs !== 'undefined') {
                        hljs.highlightBlock(element);
                    }
                }
            );
        }
    );

})();

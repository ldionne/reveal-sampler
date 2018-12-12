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
     *
     * @param {string} value
     * @param {number} targetLength
     * @param {string} [padString= ]
     * @returns {string}
     */
    var stringPadStart = function(value, targetLength, padString) {
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (value.padStart instanceof Function) {
            return value.padStart(targetLength, padString);
        } else {
            targetLength = targetLength >> 0;
            value = String(value);
            if (value.length >= targetLength) {
                return value;
            } else {
                targetLength = targetLength - value.length;
                if (targetLength > padString.length) {
                    padString += padString.repeat(targetLength / padString.length);
                }
                return padString.slice(0, targetLength) + value;
            }
        }
    };

    /**
     * @param {Number} lineNumber
     * @param {string} text
     * @param {string|null} [tokenType]
     * @constructor
     *
     * @property {Number} lineNumber
     * @property {string} text
     * @property {string|null} [tokenType]
     */
    var SampleLine = function(lineNumber, text, tokenType) {
        this.lineNumber = lineNumber;
        this.text = text || '';
        this.tokenType = tokenType || null;
    };

    /**
     * SampleFile provides access to the lines and named samples in a file
     *
     * @param {string} content
     * @constructor
     */
    var SampleFile = function(content) {
        var lines = content.split(/\r?\n/);
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
        this._lines = [];
        this._samples = {};
        for (i = 0, c = lines.length; i < c; i++) {
            token = parseLine(lines[i]);
            if (token) {
                this._lines.push(new SampleLine(i + 1, lines[i], token.type));
                switch (token.type) {
                    case SampleFile.TOKEN_START_NAMED :
                        currentSnippets.push(token.name);
                        break;
                    case SampleFile.TOKEN_END_NAMED :
                        for (k = currentSnippets.length - 1; k >= 0; k--) {
                            if (currentSnippets[k] === token.name) {
                                currentSnippets.splice(k, 1);
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
                this._lines.push(line = new SampleLine(i + 1, lines[i]));
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
                                this._samples[name].push(line);
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
     * @param {number} [start=0]
     * @param {number} [length]
     * @returns {SampleLine[]}
     */
    SampleFile.prototype.getLines = function(start, length) {
        start = start > 0 ? start : 0;
        if (typeof length === 'undefined') {
            return this._lines.slice(start);
        }
        return this._lines.slice(start, start + length);
    };

    /**
     * Fetches the files, creates and returns SampleFile objects. It keeps
     * track of requests so that each file is requested once only.
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
            sample.add(file.getLines() || []);
        }
        return sample;
    };

    /**
     * Parse the selector in a list of range objects
     * @param selector
     * @returns {({type, start, length}[]|{type, name}[])}
     */
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

    /**
     * Expands line numbers and ranges to an object with the line index as key.
     *
     *     3-6,12 => {2: true, 3: true, 4: true, 5: true, 11: true}
     *
     * @param selector
     * @returns {(null|{})}
     */
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
                        !line.text.match(/\bskip-sample\b/)
                    );
                }
            )
        );
    };

    /**
     * @param {boolean} skipDelimiters
     * @param {number[]} skipLines - skip lines by index
     * @returns {SampleLine[]}
     */
    Sample.prototype.getLines = function(skipDelimiters, skipLines) {
        var lines = this._lines;
        if (skipDelimiters) {
            lines = lines.filter(
                function (line) {
                    // skip delimiter lines if option is set
                    return !(skipDelimiters && line.tokenType !== null);
                }
            )
        }
        if (skipLines) {
            lines = lines.filter(
                function (line, index) {
                    // skip lines defined by index
                    return !skipLines[index];
                }
            )
        }
        return lines;
    };

    /**
     * @param {HTMLElement} parentNode
     * @param {{removeIndentation: boolean, marked: string, lineNumbers, skip: {}}} options
     */
    Sample.prototype.appendTo = function(parentNode, options) {
        var line, lineNode, previousLineNode, lineText = null;
        var markedLinePattern = /(\s*(\/\/|#)\s*mark-sample\s*$)|(\s*\/\*\s*mark-sample\s*\*\/(\s*$)?)|(\s*<!--\s*mark-sample\s*-->(\s*$)?)/;
        var document = parentNode.ownerDocument;
        var marked = Sample.parseSelectorToLineIndex(options.marked || '') || {};
        var lineNumberStart =  parseInt(options.lineNumbers) || 0, lineNumberSize;
        var lines = this.getLines(options.skip.delimiters, options.skip.lines);
        var indentationOffset = (options.removeIndentation) ? this.getIndentationLength(lines) : 0;
        if (lines.length < 1) {
            return;
        }
        if (options.lineNumbers === true || options.lineNumbers === 'true' || options.lineNumbers === 'yes') {
            lineNumberStart = 1;
        }
        if (options.lineNumbers === 'original') {
            lineNumberSize = lines[lines.length - 1].lineNumber.toString().length;
        } else {
            lineNumberSize = (lineNumberStart + this._lines.length).toString().length;
        }
        parentNode.setAttribute('data-noescape', '');
        for (var i = 0, c = lines.length; i < c; i++) {
            line = lines[i];
            lineText = line.text.substr(indentationOffset);
            lineNode = parentNode.appendChild(document.createElement('span'));
            lineNode.setAttribute('class', 'line');
            if (options.lineNumbers === 'original') {
                lineNode.setAttribute('data-line-number', stringPadStart(line.lineNumber.toString(), lineNumberSize));
            } else if (lineNumberStart > 0) {
                lineNode.setAttribute('data-line-number', stringPadStart((lineNumberStart + i).toString(), lineNumberSize));
            }
            if (lineText.match(markedLinePattern)) {
                lineNode
                    .appendChild(document.createElement('mark'))
                    .appendChild(document.createTextNode(lineText.replace(markedLinePattern, '')));
            } else if (marked[i]) {
                lineNode
                    .appendChild(document.createElement('mark'))
                    .appendChild(document.createTextNode(lineText));
            } else {
                lineNode.appendChild(document.createTextNode(lineText));
            }
            if (previousLineNode) {
                previousLineNode.appendChild(document.createTextNode('\n'));
            }
            previousLineNode = lineNode;
        }
    };

    /**
     * Get the length of the shortest whitespace sequence at a line start
     *
     * @param {SampleLine[]} [lines]
     * @returns {number}
     */
    Sample.prototype.getIndentationLength = function(lines) {
        lines = lines instanceof Array ? lines : this._lines;
        return Math.min.apply(
            null,
            lines
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
        skip: config.sampler.skip instanceof Array
            ? config.sampler.skip : (config.sampler.skip || '').split(/[,\s]+/),
        lineNumbers: [true, 'original'].indexOf(config.sampler.lineNumbers) !== -1
            ? config.sampler.lineNumbers : false
    };

    // add some CSS to make the line numbers visible
    var style =
        "[data-sample] [data-line-number]:before {\n" +
        "   content: attr(data-line-number) ': ';\n" +
        "}";
    var styleNode = document.createElement('style');
    styleNode.setAttribute('type', 'text/css');
    styleNode.appendChild(document.createTextNode(style));
    document.head.appendChild(styleNode);

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
                        skip: (element.getAttribute('data-sample-skip') || options.skip.join(',')),
                        lineNumbers: element.getAttribute('data-sample-line-numbers')
                    };

                    sample.appendTo(
                        element,
                        {
                            // marked lines selector
                            marked: attributes.mark,
                            // skip lines
                            skip: {
                                // (sample start/end) delimiter lines)
                                delimiters: attributes.skip.match(/\bdelimiters?\b/),
                                // expand ranges to line index array
                                lines: Sample.parseSelectorToLineIndex(attributes.skip)
                            },
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

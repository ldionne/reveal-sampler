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
    // Escape a string so it can be used to match in a regular expression, even
    // if it contains characters that are special for regular expressions.
    var escapeForRegexp = function(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };

    // Fetches a file at the given URL, and calls the `done` callback with the
    // contents of the file as a string.
    var fetch = function(url, done) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = (function(xhr) {
            return function() {
                if (xhr.readyState === 4) {
                    if ((xhr.status >= 200 && xhr.status < 300) ||
                        (xhr.status === 0 && xhr.responseText !== '')) {
                        done(xhr.responseText);
                    }
                }
            };
        })(xhr);
        xhr.open("GET", url);
        try {
            xhr.send();
        }
        catch (e) {
            console.log('Failed to get the file ' + url);
        }
    };

    // Given a string, returns a sub-string starting at the `index`th line,
    // and stopping at the `index + length`th line.
    var getLines = function(s, index, length) {
        var match = s.match(
            new RegExp('(?:.*\n){' + index + '}((?:.*(?:\n|$)){' + length + '})')
        );
        return match[1] || '';
    };

    // Parses a string representing a single line number, a (start-end) range,
    // or a comma-separated list thereof, and returns a list of ranges
    // representing the union of those ranges. An individual line is
    // considered a single-line range for that purpose.
    var parseRanges = function(value) {
        var result = [];
        var ranges, range, start, end;
        if (ranges = value.match(/(^|[,\s])\d+(-\d+)?/g)) {
            for (var i = 0, c = ranges.length; i < c; i++) {
                if (range = ranges[i].match(/(\d+)(?:-(\d+))?/)) {
                    start = parseInt(range[1]) || 0;
                    end = parseInt(range[2]) || start;
                    result.push(
                        {
                            index: start - 1,
                            length: end - start + 1
                        }
                    )
                }
            }
        }
        return result.length > 0 ? result : null;
    };

    // Given ranges (as returned by `parseRanges`), returns a list of all the
    // individual lines contained in that set of ranges.
    var expandRangesToLinesIndex = function(ranges) {
        var lines = {};
        if (ranges instanceof Array && ranges.length > 0) {
            for (var i = 0, c = ranges.length; i < c; i++) {
                for (var x = 0; x < ranges[i].length; x++) {
                    lines[ranges[i].index + x] = true;
                }
            }
            return lines;
        }
        return null;
    };

    var slug;
    var elements = document.querySelectorAll('[data-sample]');
    for (var i = 0, c = elements.length; i < c; i++) {
        slug = elements[i].getAttribute('data-sample').match(/([^#]+)(?:#(.+))?/);
        fetch(
            slug[1],
            function(element, file, snippet) {
                return function(code) {
                    var sample = '', match, ranges, i, c;

                    if (snippet === undefined) {
                        sample = code;
                    } else if (ranges = parseRanges(snippet)) {
                        for (i = 0, c = ranges.length; i < c; i++) {
                            sample += getLines(code, ranges[i].index, ranges[i].length);
                        }
                    } else {
                        var sampleRegexp = new RegExp(
                            // match 'sample(sampleName)'
                            /sample\(/.source + escapeForRegexp(snippet) + /\)[^\n]*\n/.source +
                            // match anything in between
                            /^([\s\S]*?)/.source +
                            // match 'end-sample'
                            /^[^\n]*end-sample/.source, 'mg');
                        while ((match = sampleRegexp.exec(code)) !== null) {
                            sample += match[1];
                        }
                    }

                    // Strip trailing newline in the sample (if any), since that is
                    // only required to insert the 'end-sample' tag.
                    sample = sample.replace(/\n$/, "");

                    if (sample === '') {
                        throw "Could not find sample '" + snippet + "' in file '" + file + "'.";
                    }

                    var marked = expandRangesToLinesIndex(
                        parseRanges(element.getAttribute('data-sample-mark') || '')
                    );
                    if (marked) {
                        element.textContent = '';
                        element.setAttribute('data-noescape', '');
                        var lines = sample.split("\n");
                        for (i = 0, c = lines.length; i < c; i++) {
                            if (i > 0) {
                                element.appendChild(document.createTextNode("\n"));

                            }
                            if (marked[i]) {
                                element
                                    .appendChild(document.createElement('mark'))
                                    .appendChild(document.createTextNode(lines[i]))
                            } else {
                                element.appendChild(document.createTextNode(lines[i]));
                            }
                        }
                    } else {
                        element.textContent = sample;
                    }

                    var extension = file.split('.').pop();
                    var classString = element.getAttribute('class') || '';
                    if (!classString.match(/(^|\s)lang(uage)?-/)) {
                        element.setAttribute('class', classString + ' language-' + extension);
                    }
                    if (typeof hljs !== 'undefined') {
                        hljs.highlightBlock(element);
                    }
                }
            }(elements[i], slug[1], slug[2])
        );
    }
})();

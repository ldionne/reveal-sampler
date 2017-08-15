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
    var escapeForRegexp = function(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };

    var fetch = function(url, done) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = (function(xhr) {
            return function() {
                if (xhr.readyState === 4) {
                    if (
                        ( xhr.status >= 200 && xhr.status < 300 ) ||
                        ( xhr.status === 0 && xhr.responseText !== '')
                    ) {
                       done(xhr.responseText);
                    }
                }
            };
        })(xhr);
        xhr.open( "GET", url);
        try {
            xhr.send();
        }
        catch ( e ) {
            console.log('Failed to get the file ' + url);
        }
    };

    var getLines = function(code, start, length) {
        var match = code.match(
            new RegExp('(?:.*\n){' + start + '}((?:.*(?:\n|$)){' + length +'})')
        );
        return match[1] || '';
    };

    var slug;
    var elements = document.querySelectorAll('.sample, [data-sample]');
    for (var i = 0, c= elements.length; i < c; i++) {
        slug = (
            elements[i].getAttribute('data-sample') ||
            elements[i].getAttribute('sample') ||
            ''
        ).match(/([^#]+)(?:#(.+))?/);
        fetch(
            slug[1],
            function(element, file, snippet) {
                return function(code) {
                    var sample = '', lines, match, start, end;

                    if (snippet === undefined) {
                        sample = code;
                    } else if (lines = snippet.match(/(^|[,\s])\d+(-\d+)?/g)) {
                      for (i = 0, c = lines.length; i < c; i++) {
                          if (match = lines[i].match(/(\d+)(?:-(\d+))?/)) {
                              start = parseInt(match[1]) || 0;
                              end = parseInt(match[2]) || start;
                              sample += getLines(code, start - 1, end - start + 1);
                          }
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

                    var extension = file.split('.').pop();
                    element.textContent = sample;
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

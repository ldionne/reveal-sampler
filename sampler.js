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

    var slug;
    var elements = document.querySelectorAll('.sample');
    for (var i = 0, c= elements.length; i < c; i++) {
        slug = elements[i].getAttribute('sample').match(/([^#]+)(?:#(.+))?/);
        fetch(
            slug[1],
            function(element, file, sampleName) {
                return function(code) {
                    var sample = null;

                    if (sampleName === undefined) {
                        sample = code;
                    } else {
                        var sampleRegexp = new RegExp(
                            // match 'sample(sampleName)'
                            /sample\(/.source + escapeForRegexp(sampleName) + /\)[^\n]*\n/.source +
                            // match anything in between
                            /^([\s\S]*?)/.source +
                            // match 'end-sample'
                            /^[^\n]*end-sample/.source, 'mg');
                        var match = null;
                        while ((match = sampleRegexp.exec(code)) !== null) {
                            sample = (sample || "") + match[1];
                        }
                    }

                    // Strip trailing newline in the sample (if any), since that is
                    // only required to insert the 'end-sample' tag.
                    sample = sample.replace(/\n$/, "");

                    if (sample === null) {
                        throw "Could not find sample '" + sampleName + "' in file '" + file + "'.";
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

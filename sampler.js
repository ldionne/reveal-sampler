/**
 * sampler.js is a plugin to display code samples from specially-formatted
 * source files in reveal.js slides.
 *
 * See https://github.com/ldionne/reveal-sampler for documentation,
 * bug reports and more.
 *
 *
 * Author: Louis Dionne
 * License: sampler.js is placed in the public domain
 */

(function() {
    var escapeForRegexp = function(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };

    if (typeof $ === 'undefined') {
        throw 'The sampler.js plugin for reveal.js requires jQuery to be loaded.';
    }

    $(".sample").each(function(i, element) {
        var slug = element.getAttribute('sample').match(/([^#]+)(?:#(.+))?/);
        var file = slug[1], sampleName = slug[2];

        $.ajax({url: file, success: function(code) {
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

            if (sample === null) {
                throw "Could not find sample '" + sampleName + "' in file '" + file + "'.";
            }

            var extension = file.split('.').pop();
            $(element).text(sample);
            if (!$(element).is('[class*="language-"]') && !$(element).is('[class*="lang-"]')) {
                $(element).addClass("language-" + extension);
            }
            if (typeof hljs != 'undefined') {
                hljs.highlightBlock(element);
            }
        }});
    });
})();

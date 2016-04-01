/**
 * sampler.js is a plugin to display code samples from specially-formatted
 * source files in reveal.js slides. See https://github.com/ldionne/sampler.js
 * for documentation, bug reports and others.
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
        var slug = element.getAttribute('sample').match(/([^#]+)#(.+)/);
        var file = slug[1], sampleName = slug[2];
        var sampleRegexp = new RegExp(
            /^\/\/\s*sample\(/.source + escapeForRegexp(sampleName) + /\)\s*/.source + // match '// sample(sampleName)'
            /^([\s\S]*?)/.source +                                                     // match anything in between
            /^\/\/\s*end-sample/.source, 'm');                                         // match '// end-sample'

        $.ajax({url: file, success: function(code) {
            var sample = code.match(sampleRegexp);
            if (sample == null) {
                throw "Could not find sample '" + sampleName + "' in file '" + file + "'.";
            }

            element.innerHTML = sample[1];
            $(element).addClass("cpp");
        }});
    });
})();

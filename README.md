## sampler.js
> A [reveal.js][] plugin to include code samples in slides


### Dependencies
This plugin depends on jQuery, so make sure it is loaded before the plugin is
loaded.


### Usage
First, initialize the plugin in the `dependencies` part of the reveal.js config:

```js
{ src: 'plugin/sampler.js' }
```

This assumes that you copied the `sampler.js` file to `plugin/sampler.js` in
your reveal.js tree, but you can pick whatever you want. To include a code
sample in a slide, use `<code>` tags as follows:

```html
<pre><code class='sample' sample='path/to/source#sample-name'></code></pre>
```

The plugin will extract the sample named `sample-name` from the source file
whose path is given, and write it inside the `<code>` tag. If no `sample-name`
is given, the whole file is included. The plugin will also add the `language-xxx`
class to the `<code>` tag, where `xxx` is the extension of the source file, so
that code highlighting triggers properly if set up. This usually works out of
the box, because [highlight.js][] can recognize the extensions associated to
most languages. If you need to explicitly set the language to use (e.g. because
the file extension is misleading), set the `language-xxx` class yourself on the
`<code>` tag and the plugin will leave it alone. To define a sample inside a
source file, use the following syntax to delimit code samples:

```
...

sample(sample-name)
code-inside-the-sample
end-sample

...
```

`sampler.js` will parse the source file, and anything between the `sample(...)`
and the `end-sample` tags will be taken to be a code sample named `sample-name`.
Including that code sample in a slide will cause all the code between the two
special tags to be included in that slide. However, anything on the same line
as one of the special tags will not be taken as part of the sample, which
allows commenting the tags:

```c++
// sample(sample-name)
...
// end-sample
```

Multiple samples can appear in the same source file, as long as they have
different names. If many samples have the same name, they will be considered
as a single sample and concatenated together, which can be useful to avoid
showing unimportant bits of code in a slide. For example, the following code
will create a single sample with name 'sample-name':

```c++
// sample(sample-name)
first part of the sample
// end-sample

some code not in the sample

// sample(sample-name)
second part of the sample
// end-sample
```

It's that simple! To get started, you can find an example of using the plugin
in the `example/` directory.


### License
`sampler.js` is placed in the public domain.


<!-- Links -->
[highlight.js]: https://highlightjs.org
[reveal.js]: https://github.com/hakimel/reveal.js/

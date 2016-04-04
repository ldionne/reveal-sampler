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
your reveal.js tree, but you can pick whatever you want. Then, inside C++
source files, use the following syntax to delimit code samples:

```c++
some code here

// sample(sample-name)
...
// end-sample

more code here
```

Including the code sample named `sample-name` in a slide will cause all
the code between the two special comments to be included in that slide.
Multiple samples can appear in the same source file, as long as they have
different names. Finally, to include a code sample in a slide, use `<code>`
tags as follows:

```html
<code class='sample' sample='path/to/source#sample-name'></code>
```

The plugin will take the sample named `sample-name` in the source file
whose path is given, and write it inside the `<code>` tag. It will also
add the `cpp` class to the `<code>` tag, so that code highlighting triggers
properly if set up.

You can find an example of using the `sampler.js` plugin in the `example/`
directory.


### License
`sampler.js` is placed in the public domain.


<!-- Links -->
[reveal.js]: https://github.com/hakimel/reveal.js/

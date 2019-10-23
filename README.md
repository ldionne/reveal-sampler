## sampler.js
> A [reveal.js][] plugin to include code samples in slides


### Usage
First, initialize the plugin in the `dependencies` part of the reveal.js config:

```js
{ src: 'plugin/sampler.js' }
```

This assumes that you copied the `sampler.js` file to `plugin/sampler.js` in
your reveal.js tree, but you can obviously pick whatever path you want. To
include a code sample in a slide, use `<code>` tags as follows:

```html
<pre><code data-sample='path/to/source#sample-name'></code></pre>
```

The plugin will extract the sample named `sample-name` from the source file
whose path is given, and write it inside the `<code>` tag. If no `sample-name`
is given, the whole file is included. It is also possible to use line numbers
instead of a sample name to delimit a code snippet. The basic syntax is
`path/to/file#start-end`, but multiple ranges or individual line numbers
are supported too:

```html
<pre><code data-sample='path/to/source#5-9'></code></pre>
<pre><code data-sample='path/to/source#5-9,14-18'></code></pre>
<pre><code data-sample='path/to/source#5,7,9'></code></pre>
<pre><code data-sample='path/to/source#5-9,14,15'></code></pre>
```

The plugin will also add the `language-xxx` class to the `<code>` tag, where
`xxx` is the extension of the source file, so that code highlighting triggers
properly if set up. This usually works out of the box, because [highlight.js][]
can recognize the extensions associated to most languages. If you need to
explicitly set the language to use (e.g. because the file extension is
misleading), set the `language-xxx` class yourself on the `<code>` tag and
the plugin will leave it alone.

### Annotating source files

To define a named sample inside a source file, use the following syntax:

```
sample(sample-name)
code-inside-the-sample
end-sample
```

`sampler.js` will parse the source file, and anything between the `sample(sample-name)`
and the `end-sample` tags will be taken to be a code sample named `sample-name`.
Note that anything on the same line as one of the special tags will not be taken
as part of the sample, which is what allows this plugin to be language-agnostic,
by commenting the tags in your source code. For example:

```c++
// sample(main)
int main() {
    std::cout << "this is C++ code" << std::endl;
}
// end-sample
```

Multiple samples can appear in the same source file, as long as they have
different names. If many samples have the same name, they will be considered
as a single sample and concatenated together. For example, the following code
will create a single sample with name 'foo':

```c++
// sample(foo)
first part of the sample
// end-sample

some code not in the sample

// sample(foo)
second part of the sample
// end-sample
```

Within a sample, any line containing `skip-sample` will be skipped, which
allows leaving implementation details out of slides:

```c++
// sample(foo)
class Foo {
    void implementation_detail(); // skip-sample
    void hello() { std::cout << "hello!" << std::endl; }
};
// end-sample
```

Lines containing a comment `mark-sample` will be marked and the comment will be removed.
The plugin recognizes the following strings as mark comments:
 
 * `// mark-sample`
 * `# mark-sample`
 * `/* mark-sample */`
 * `<!-- mark-sample -->` 

```c++
// sample(foo)
class Foo {
    void hello() { std::cout << "hello!" << std::endl; } // mark-sample
};
// end-sample
```

### Marking lines in a sample
Specific lines or line ranges can be marked in a sample. To do this, use the
`data-sample-mark` attribute as follows:

```html
<pre><code data-sample='path/to/source#sample-name' data-sample-mark="1,3"></code></pre>
```

The line numbers specified in `data-sample-mark` are relative to the snippet
itself, not to the file from which the snippet was extracted. Also, line
ranges are supported, just like for extracting snippets from a file.

### Line numbers
You can let the plugin add line numbers to the sample. `true` adds line numbers starting with 1, a number
adds line number starting with it and `original` copies the line numbers from the source file.

```html
<pre><code data-sample='path/to/source#sample-name' data-sample-line-numbers="true"></code></pre>
<pre><code data-sample='path/to/source#sample-name' data-sample-line-numbers="42"></code></pre>
<pre><code data-sample='path/to/source#sample-name' data-sample-line-numbers="original"></code></pre>
```

The global option `sampler.lineNumbers` allows for `true`, `false` and `'original'` it controls the
line numbers on code blocks without the `data-sample-line-numbers`. The default value is `false` (no line numbers).

```js
{ 
    sampler : {
        lineNumbers: true
    } 
}
```

### Remove indentation
If all lines of the sample have an overall indentation you can remove it using the 
attribute `data-sample-indent`.

```html
<pre><code data-sample='path/to/source#sample-name' data-sample-indent="remove"></code></pre>
<pre><code data-sample='path/to/source#sample-name' data-sample-indent="keep"></code></pre>
```

You can change the default behaviour (snippets without the attribute) using
the option `sampler.removeIndentation`. The default value is `false`.

```js
{ 
    sampler : {
        removeIndentation: true
    } 
}
```

### Skip lines 
To skip lines add a the attribute `data-sample-skip`. 

```html
<pre><code data-sample='path/to/source' data-sample-skip="delimiter"></code></pre>
<pre><code data-sample='path/to/source' data-sample-skip="1-3,4"></code></pre>
<pre><code data-sample='path/to/source' data-sample-skip="delimiter,12"></code></pre>
```

#### Skip: delimiter, delimiters

`delimiter` or `delimiters` will skip lines that mark the start/end of a sample. Add this to the option to skip these 
lines for whole file or line number samples. This will not affect named samples (they never include that lines).

You can set this globally using the option `sampler.skip`.

```js
{ 
    sampler : {
        skip: ['delimiter']
    } 
}
```

#### Skip: line ranges

The line numbers and ranges specified in `data-sample-skip` are relative to the snippet
itself, not to the file from which the snippet was extracted.

Delimiter lines will count if included, only. 

### Proxy URL
Defining the proxy URL will prefix all snippet requests with it. This allows you to use a script to access the
snippet files.

```js
{ 
    sampler : {
        proxyURL: 'task.php?file='
    } 
}
```

If you're trying to load a language that your webserver understands (for example PHP) you
can create a proxy script that passes the source of the file trough. Be careful to 
limit the script to the source files you would like to deliver.

### Example

It's that simple! To get started, you can find an example of using the plugin
in the `example/` directory.


<!-- Links -->
[highlight.js]: https://highlightjs.org
[reveal.js]: https://github.com/hakimel/reveal.js/

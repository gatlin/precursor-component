precursor-component
===

(c) 2021-, Gatlin Johnson.

This is an example embedding of my [Precursor][precursor] programming language
in a webcomponent.

[precursor]: https://github.com/gatlin/precursor-ts

run the example
===

Clone this repo, then

```shell
npm i
npm run example
```

Then visit http://localhost:8000/ to see it in action.

generate bundle
===

```shell
npm i
npm run bundle
```

Now `precursor.component.bundled.js` will exist in the project root.
You can include this in HTML documents to use the component.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <script
      type="module"
      src="precursor.component.bundled.js">
    </script>
  <body>
    <precursor-component>
(op:writeln "hello there")
    </precursor-component>
  </body>
</html>
```


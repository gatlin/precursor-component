precursor-component
===

(c) 2021-, Gatlin Johnson.

what is all this (people ask this a lot)
===

**PURPOSE**: The purpose of this project is to show off the power and
flexibility of a toy [call-by-push-value][cbpv-wiki] programming language I
wrote, **[Precursor][precursor]**.

Precursor is written specifically to be embedded in other applications.
By itself though it is not a complete interpreter;
thus **I have built a web component containing a [REPL interpreter][repl-wiki]
for the language** which you may [visit][demosite] and play with!

**Building a REPL accomplishes my purpose in two basic ways:**

1. The examples demonstrate how features enjoyed in other programming languages
can be written straightforwardly with Precursor's operators
[(even though the grammar is small)][cbpvgrammar]:
  - sample 1: a generator pattern á la JavaScript or Python is built from scratch;
  - sample 2: non-linear control flow without loops or conditionals;
  - sample 3: an [Actor][actormodel] is created that safely encapsulates state
    mutation;
  - sample 4: a list data type is defined and then a list of numbers is reduced
    to a sum;
  - sample 5: I define an extensible [effect system][effsys] to write
    asynchronous I/O applications, and then do so!
  - and of course you can modify them (or write your own).

2. The design and implementation of the REPL itself is intended to be
instructive to anyone who wants to start building an interpreter or language.

The [component UI](src/precursor.component.ts) and the
[virtual machine itself](src/precursor.controller.ts) are completely separate;
the latter could easily be adapted for embedding elsewhere.

**Below is the documentation for building the code and afterward is more
explanatory text.**

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

quick overview of the language
===

Precursor's grammar is unusual; the examples should cover just about everything
but it may be helpful to read these notes (WIP, sadly).

There is no substitute for the [Call-By-Push-Value paper][cbpvpaper] but I can
summarize the main ideas.

In CBPV terms are **polarized** either *positive* or *negative*.

Positive term
: Static *data* with no behavior. Positive terms are fully evaluated, passed as
arguments, and bound to variable symbols.

Positive terms:

- literals
- variables
- suspended terms of any polarity
- the result of built-in operations the language implementation provides.

Negative term
: Dynamic *behavior*; a term in need of further evaluation. Must be *suspended*
into a **positive** term with `!` to be manipulated as an argument or variable;
it may be *resumed* with `?` later to continue execution.

Negative terms:

- Function literals (eg, `(\ (a b) (op:multiply a b))`);
- Function application (eg, `((? square) 4.2)`)
- Terms resumed with `?`;
- `let` expressions (not `letrec`);
- any use of `shift`, `reset`, or `if`.

The `letrec` form allows you to define a number of expressions and assign them
names.

```
(letrec (
  ; definitions begin
  (expr-1 (\ (foo bar) ...))
  (expr-2 ((? expr-1) "foo-value" 4))
  ...
  ; definitions end
)
; body begin
(let baz ( (? expr-2) ...)
...
)
; body end
)
```

Every term defined in a given `letrec` is visible to all the others.

Only terms defined at the top of a `letrec` may be recursive, and they may
reference symbols defined in scopes outside the `letrec` as well as any sibling
terms defined along with it.

Finally, all variables in Precursor **must** contain *positive* terms; in the
above `letrec`, even though `expr-1` is a function and thus *negative* it is
automatically suspended, which is why `expr-2` resumes it first.

[precursor]: https://github.com/gatlin/precursor-ts
[repl-wiki]: https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop
[demosite]: https://niltag.net/code/precursor
[cbpvgrammar]: https://github.com/gatlin/precursor-ts/blob/cd345f2/src/grammar.ts#L18
[cbpv-wiki]: https://en.wikipedia.org/wiki/Call-by-push-value
[actormodel]: https://en.wikipedia.org/wiki/Actor_model
[effsys]: https://en.wikipedia.org/wiki/Effect_system
[cbpvpaper]: https://www.cs.bham.ac.uk/~pbl/papers/thesisqmwphd.pdf


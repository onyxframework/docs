# Installation

## Crystal

Onyx Framework is powered by [Crystal](https://crystal-lang.org/), a compiled language on top of LLVM. To use the framework, you **must** have the language installed on your computer. Please follow the official [Crystal installation guide](https://crystal-lang.org/reference/installation/index.html) from the core team. Make yourself familiar with the [using the compiler](https://crystal-lang.org/reference/using_the_compiler/) section at least, or better read the whole language documentation before continuing, as it is very simple and enjoyable.

Make sure that you have Crystal installed by running `crystal -v` command.

## Framework

To add Onyx Framework to your Crystal application, you should add it to the `shard.yml` file:

```yaml
dependencies:
  onyx:
    github: onyxframework/onyx
    version: ~> 0.3.0
```

The framework consists of multiple components. You must add the components you're going to use explicitly into your `shard.yml` file along with `onyx`, for example, [`onyx-http`](https://github.com/onyxframework/http):

```yaml {5-7}
dependencies:
  onyx:
    github: onyxframework/onyx
    version: ~> 0.3.0
  onyx-http:
    github: onyxframework/http
    version: ~> 0.7.0
```

Then, in your application code, you should require the component like this:

```crystal
require "onyx/http" # Note the slash instead of hyphen
```

::: tip
You can also use the "raw" dependencies, for example `"onyx-http"` instead of `"onyx/http"`, but it is usually an advanced level topic.
:::

---
sidebarDepth: 0
---

# Getting started

To use Onyx Framework, you'll need [Crystal](https://crystal-lang.org) installed on your machine. There is an awesome [guide](https://crystal-lang.org/reference/installation/index.html) on installation by the core team. Please also make yourself familiar with the [using the compiler](https://crystal-lang.org/reference/using_the_compiler/) section at least, or better read the whole language documentation before continuing, as it is very simple and enjoyable.

This mini-tutorial will guide your through running your first Onyx-powered web application:

1. Initialize a brand new Crystal application:

```sh
> crystal init app hello-onyx && cs hello-onyx
```

2. Add these lines to the `shards.yml` file:

```yaml
dependencies:
  onyx:
    github: onyxframework/onyx
    version: ~> 0.1.0
  onyx-rest:
    github: onyxframework/rest
    version: ~> 0.6.0
```

3. Run this command to install the dependencies:

```sh
> shards install
```

4. Replace the contents of `./src/hello-onyx.cr` file:

```crystal
require "onyx/rest"

Onyx.get "/" do |env|
  env.response << "Hello, Onyx!"
end

Onyx.listen
```

5. Launch the server:

```bash
> crystal src/hello-onyx.cr
I, [12:34:56.332] Onyx::REST is listening at http://127.0.0.0:5000
```

6. Test the endpoint:

```bash
> curl http://127.0.0.0:5000
Hello, Onyx!
```

That's it. For more information on the framework components, continue to the [Components Overview](/components-overview.md) section.

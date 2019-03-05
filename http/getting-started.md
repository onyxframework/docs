---
sidebarDepth: 0
---

# Getting started

This mini-tutorial will guide your through running your first Onyx::HTTP-powered web application. Make sure you've read the [Introduction](/http/).

::: tip
To use Onyx Framework, you'll need [Crystal](https://crystal-lang.org) installed on your machine.
:::

## Hello, Onyx!

1. Initialize a brand new Crystal application:

```sh
> crystal init app hello-onyx && cd hello-onyx
```

2. Add these lines to the `shards.yml` file:

```yaml
dependencies:
  onyx:
    github: onyxframework/onyx
    version: ~> 0.2.0
  onyx-http:
    github: onyxframework/http
    version: ~> 0.7.0
```

3. Run this command to install the dependencies:

```sh
> shards install
```

4. Replace the contents of `./src/hello-onyx.cr` file:

```crystal
require "onyx/http"

Onyx.get "/" do |env|
  env.response << "Hello, Onyx!"
end

Onyx.listen
```

5. Launch the server:

```bash
> crystal src/hello-onyx.cr
I, [12:34:56.332] Onyx::REST is listening at http://127.0.0.1:5000
```

6. Test the endpoint:

```bash
> curl http://127.0.0.1:5000
Hello, Onyx!
```

Congratulations on your very first endpoint! 🎉

## View

Encapsulating HTTP views is a good idea for better scaling. Views are responsible for rendering.

1. Create a new file called `./src/hello_view.cr`:

```crystal
struct HelloView
  include Onyx::HTTP::View

  def initialize(@who : String)
  end

  def render(env)
    env.response << "Hello, " << @who << "!"
  end
end
```

2. Update the server code (`./src/hello-onyx.cr`):

```crystal{2,5}
require "onyx/http"
require "./hello-view"

Onyx.get "/" do |env|
  HelloView.new("Onyx")
end

Onyx.listen
```

3. Test the endpoint again:

```bash
> curl http://127.0.0.1:5000
Hello, Onyx!
```

## Echo

Let's add a simple echo websocket to our application.

1. Add some lines to `./src/hello-onyx.cr`:

```crystal{7-12}
require "onyx/http"
require "./hello-view"

Onyx.get "/" do |env|
  HelloView.new("Onyx")
end

Onyx.ws "/" do |socket, env|
  socket.send("Hello!")
  socket.on_message do |message|
    socket.send(message)
  end
end

Onyx.listen
```

2. Test the websocket ([wscat](https://www.npmjs.com/package/wscat) is used here):

```sh
TODO:
```

To continue learning about Onyx::HTTP, please visit the [Routing](/http/routing) section.

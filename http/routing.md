# Routing

Routing in Onyx::HTTP is pretty intuitive.

## Verbs

There are methods for most HTTP verbs like `Onyx.get` and `Onyx.post`. A method expects rither a block with a single [`HTTP::Server::Context`](https://crystal-lang.org/api/latest/HTTP/Server/Context.html) argument (we call it `env`):

```crystal
require "onyx/http"

# Will be available at GET /
Onyx::HTTP.get "/" do |env|
  env.response << "Hello, Onyx!"
end

# Crystal allows to omit blocks' arguments,
# this endpoint will just return 200
Onyx::HTTP.get "/healthcheck" do
end
```

::: warning
The proc return value is ignored unless it is a [View](/http/views). For example, this endpoint does not print anything:

```crystal
Onyx::HTTP.get "/" do |env|
  "Hello, Onyx!"
end
```

:::

Or an [Endpoint](/http/endpoints) class:

```crystal
Onyx::HTTP.get "/", MyEndpoint
```

## Websockets

Websockets are handled a bit differently. There is a special `Onyx.ws` method, which expects either a block with **two** arguments: [`HTTP::WebSocket`](https://crystal-lang.org/api/latest/HTTP/WebSocket.html) and [`HTTP::Server::Context`](https://crystal-lang.org/api/latest/HTTP/Server/Context.html):

```crystal
# A simple echo endpoint, will be avaialble at ws://host:port/
Onyx::HTTP.ws "/" do |socket, env|
  socket.on_message do |message|
    socket.send(message)
  end
end
```

Or a [Channel](/http/channels) class:

```crystal
Onyx::HTTP.ws "/", MyChannel
```

## Path params

You can define path params in routes. These params will then be accessible via [`context.request.path_params`](https://api.onyxframework.org/http/HTTP/Request.html#path_params%3AHash%28String%2CString%29-instance-method) getter:

```crystal
Onyx::HTTP.get "/users/:id" do |env|
  env.response << "id = #{env.request.path_params["id"]}"
end
```

```sh
> curl http://localhost:5000/users/42
id = 42
```

Params can be safely and conveniently parsed in [Endpoints](/http/endpoints) and [Channels](/http/channels), see their docs for details.

## Nested routes

You can nest routes and create a tree-like structure inspired by [Roda](http://roda.jeremyevans.net/):

```crystal
Onyx::HTTP.on "/users" do |r|
  r.post "/", Endpoints::User::Create
  r.get "/", Endpoints::User::Index
  r.get "/:id", Endpoints::User::Get

  # Sub-nested routes!
  r.on "/posts" do
    r.get "/", Endpoints::Posts::ByUser
    r.get "/:id", Endpoints::Posts::ByUserAndID
  end
end
```

The resulting route paths would consist of all namespaces contatenated, for example, `"GET /users/posts/:id"`.

## Request ID

The request would also have an unique identifier accessible via [`context.request.id`](https://api.onyxframework.org/http/HTTP/Request.html#id-instance-method) getter:

```crystal
Onyx::HTTP.get "/" do |env|
  pp env.request.id # e6fa3c3e-93ce-4ad4-b480-957cb13b56eb
end
```

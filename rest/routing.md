# Routing

Routing in Onyx is pretty simple. There are methods for all HTTP verbs like `Onyx.get` and `Onyx.post`. A method expects either a block with a single [`HTTP::Server::Context`](https://crystal-lang.org/api/latest/HTTP/Server/Context.html) argument (we call it `env`):

```crystal
# Will be available at GET /
Onyx.get "/" do |env|
  env.response << "Hello, Onyx!"
end

# Crystal allows to omit blocks' arguments,
# this endpoint will just return 200
Onyx.get "/healthcheck" do
end
```

Or an [Action](/rest/actions) class:

```crystal
# Will be available at POST /users/
Onyx.post "/users", CreateUser
```

## Websockets

Websockets are handled a bit differently. There is a special `Onyx.ws` method, which expects either a block with **two** arguments: [`HTTP::WebSocket`](https://crystal-lang.org/api/latest/HTTP/WebSocket.html) and [`HTTP::Server::Context`](https://crystal-lang.org/api/latest/HTTP/Server/Context.html):

```crystal
# A simple echo endpoint, will be avaialble at ws://<host>/
Onyx.ws "/" do |socket, env|
  socket.on_message do |message|
    socket.send(message)
  end
end
```

Or a [Channel](/rest/channels) class:

```crystal
# Will be avaialble at ws://<host>/notifications
Onyx.ws "/notifications", NotificationsChannel
```

## Path params

You can define path params in routes. These params will then be accessible via [`context.request.path_params`](https://api.onyxframework.org/http/HTTP/Request.html#path_params%3AHash%28String%2CString%29-instance-method) getter:

```crystal
Onyx.get "/users/:id" do |env|
  env.response << "id = #{env.request.path_params["id"]}"
end
```

```sh
> curl http://localhost:5000/users/42
id = 42
```

These path params can be safely and conveniently parsed in [Actions](/rest/actions) and [Channels](/rest/channels), see their docs for details.

## Request ID

The request would also have an unique identifier accessible via [`context.request.id`](https://api.onyxframework.org/http/HTTP/Request.html#id-instance-method) getter:

```crystal
Onyx.get "/" do |env|
  pp env.request.id # e6fa3c3e-93ce-4ad4-b480-957cb13b56eb
end
```

## Headers

The responses are automatically enriched with different headers.

### CORS

[CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) is a vital thing if you're going to make requests to your API from browsers. By default, Onyx has the following CORS policies:

```crystal
allow_origin = "*"
allow_headers = ["accept", "content-type"]
allow_methods = ["GET", "HEAD", "POST", "DELETE", "OPTIONS", "PUT", "PATCH"]
allow_credentials = false
max_age = 0
```

```sh
< Access-Control-Allow-Origin: *
```

You can change these settings on the server run:

```crystal
Onyx.listen(
  cors: {
    # Will be merged with default settings
    allow_headers: ["accept", "content-type", "authorization"]
  }
)
```

::: tip
It is also possible to alter the middleware completely, read about it at the [Custom middleware](/rest/advances/custom-middleware) section.
:::

### Request ID

The same request ID is put into the `"X-Request-ID"` header:

```sh
< X-Request-ID: e6fa3c3e-93ce-4ad4-b480-957cb13b56eb
```

### Response time

An amount of **microseconds** elapsed to process the request is available at `"X-Response-Time"` header:

```sh
< X-Response-Time: 123
```

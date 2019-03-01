# Channels

[Onyx::REST::Channel](https://api.onyxframework.org/rest/Onyx/REST/Channel.html) module allows to conveniently bind to and handle websocket events. It includes the following methods:

* `on_open` is invoked once on bind
* `on_message(String)` is called everytime a new string message frame arrives
* `on_binary(Bytes)` is called when a new binary message framew arrives
* `on_ping(String)` is called on the ping frame
* `on_pong(String)` is called on the pong frame

These methods are expected to be redefined in your channels:

```crystal
class Echo
  include Onyx::REST::Channel

  def on_bind
    socket.send("Hello")
  end

  def on_message(message)
    socket.send(message)
  end
end

Onyx.ws "/echo", Echo
```

```sh
> wscat http://localhost:5000/echo
< Hello
> Foo
< Foo
```

## Getters

Onyx::REST::Channel module includes some getters:

* `context` to access the current [`HTTP::Server::Context`](https://crystal-lang.org/api/latest/HTTP/Server/Context.html)
* `socket` to access the bound [`HTTP::WebSocket`](https://crystal-lang.org/api/latest/HTTP/WebSocket.html)

## Params

Channels also have the `.params` macro, which is equivalent to the [Action's](/rest/actions#params). The only difference is that the error code is `4000` instead of `400`. Read more about websocket close codes at the [MDN page](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Properties).

## Errors

Channels have the `.errors` macro as well similar to the [Action's](/rest/actions#expected-errors), but the difference is that any errors (even an unexpected one) is handled within the channel itself, without passing to a [renderer](/rest/renderers#error-handling). That is so because websockets have [standard way](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Properties) to close the connection, which also enforces the error codes in your application to be in range 4000-4999.

```crystal
class ProtectedEcho
  include Onyx::REST::Channel

  params do
    path do
      type username : String
    end

    query do
      type password : String
    end
  end

  errors do
    type Unauthorized(4001)
  end

  def on_bind
    raise Unauthorized.new unless params.query.password == "s3cr3t"
    socket.send("Hello, #{params.path.username}")
  end

  def on_message(message)
    socket.send(message)
  end
end

Onyx.ws "/echo/:username", ProtectedEcho
```

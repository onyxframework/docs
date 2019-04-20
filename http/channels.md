# Channels

[Onyx::HTTP::Channel](https://api.onyxframework.org/http/Onyx/HTTP/Channel.html) module allows to conveniently bind to and handle websocket events. It **includes** the [Onyx::HTTP::Endpoint](/http/endpoint) module. It also has the following methods:

* `on_open` is invoked once on socket bind
* `on_message(String)` is called everytime a new string message frame arrives
* `on_binary(Bytes)` is called when a new binary message framew arrives
* `on_ping(String)` is called on the ping frame
* `on_pong(String)` is called on the pong frame
* `on_close` is invoked when the socket is closed (including when a [error](#errors) is raised)

These are expected to be overridden in your channels:

```crystal
class Echo
  include Onyx::HTTP::Channel

  def on_bind
    socket.send("Hello")
  end

  def on_message(message)
    socket.send(message)
  end
end

Onyx::HTTP.ws "/echo", Echo
```

```sh
> wscat --connect http://localhost:5000/echo
< Hello
> Foo
< Foo
```

## Getters

Onyx::HTTP::Channel module includes some getters:

* `context` to access the current [`HTTP::Server::Context`](https://crystal-lang.org/api/latest/HTTP/Server/Context.html)
* `socket` to access the bound [`HTTP::WebSocket`](https://crystal-lang.org/api/latest/HTTP/WebSocket.html)

## Params

Channels also have the `.params` macro, which is equivalent to the [Endpoint's](/http/endpoints#params). If params parsing failed for some reason, then a 400 HTTP error returned, just as with Endpoint. The request is not even upgraded to a websocket in this case.

## Errors

Channels have the `.errors` macro which is also similar to the [Endpoint's](/http/endpoints#errors) with some differences:

* Those errors which are expected to be raised when the requst is already upgraded to a websocket must have code in range 4000-4999 according to the [specification](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Properties)
* Errors raised when the request already upgraded are rendered within the channel itself, but still logged

### Example:

```crystal
class ProtectedEcho
  include Onyx::HTTP::Channel

  params do
    path do
      # Would return 400 HTTP error if room is missing
      type room : String
    end

    query do
      # Would return 400 HTTP error if any of these is missing
      #

      type username : String
      type password : String
    end
  end

  errors do
    # This error is expected to be raised before the upgrade happens
    type Unauthorized(401)

    # This one is expected to be raised when the request is already upgraded
    type BadWording(4003)
  end

  before do
    raise Unauthorized.new unless params.query.password == "s3cr3t"
  end

  def on_bind
    socket.send("Hello, #{params.query.username}")
  end

  def on_message(message)
    raise BadWording.new if message =~ /bad/
    socket.send(message)
  end
end

Onyx::HTTP.ws "/echo/:room", ProtectedEcho
```

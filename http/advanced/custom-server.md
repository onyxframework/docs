# Server from scratch

In this guide, you'll learn how to build your own Onyx::HTTP server with default middleware. Once understanding this, you'll be able to easily create custom servers serving your very own needs.

## Dependencies

You are not obligated to install `"onyx"` shard if you're planning to work with custom servers. Or you can simply do not `require "onyx/http"`.

## Simple server

Start with a simple [`Onyx::HTTP::Server`](https://api.onyxframework.com/http/Onyx/HTTP/Server.html) example:

```crystal
require "onyx-http" # Note the hyphen, it's not "onyx/http"

server = Onyx::HTTP::Server.new do |env|
  env.response << "Hello Onyx"
end

server.bind_tcp(5000)
server.listen
```

```sh
> curl http://localhost:5000
Hello Onyx
```

![Screenshot #1](https://user-images.githubusercontent.com/7955682/52903116-5c4bd680-322a-11e9-9163-53edea029f89.png)

## Logging

We'd like to see the actual request in the STDOUT. Use [`Onyx::HTTP::Logger`](https://api.onyxframework.com/http/Onyx/HTTP/Logger.html) for that:

```crystal
require "onyx-http"

logger = Onyx::HTTP::Logger.new

server = Onyx::HTTP::Server.new(logger) do |env|
  env.response << "Hello Onyx"
end

server.bind_tcp(5000)
server.listen
```

```sh
> curl http://localhost:5000
Hello Onyx
```

![Screenshot #2](https://user-images.githubusercontent.com/7955682/52903118-5fdf5d80-322a-11e9-84b2-2658a0051d08.png)

## Request meta

It's a good idea to add an ID to the request and also a time elapsed to process it for further analysis. There are [`Onyx::HTTP::RequestID`](https://api.onyxframework.com/http/Onyx/HTTP/RequestID.html) and [`Onyx::HTTP::ResponseTime`](https://api.onyxframework.com/http/Onyx/HTTP/ResponseTime.html) handlers:

```crystal
require "onyx-http"

logger = Onyx::HTTP::Logger.new
request_id = Onyx::HTTP::RequestID.new
response_time = Onyx::HTTP::ResponseTime.new

server = Onyx::HTTP::Server.new(response_time, request_id, logger) do |env|
  env.response << "Hello Onyx"
end

server.bind_tcp(5000)
server.listen
```

```sh
> curl http://localhost:5000 -v
* Rebuilt URL to: http://localhost:5000/
*   Trying 127.0.0.1...
* Connected to localhost (127.0.0.1) port 5000 (#0)
> GET / HTTP/1.1
> Host: localhost:5000
> User-Agent: curl/7.47.0
> Accept: */*
>
< HTTP/1.1 200 OK
< Connection: keep-alive
< X-Request-ID: 14c0259b-c020-4c85-931c-556e1ff266da
< X-Response-Time: 120
< Content-Length: 10
<
* Connection #0 to host localhost left intact
Hello Onyx
```

![Screenshot #3](https://user-images.githubusercontent.com/7955682/52903120-6372e480-322a-11e9-9273-ca7bc478b32d.png)

## CORS

Modern APIs usually require proper [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) handling. It is achievable with [`Onyx::HTTP::CORS`](https://api.onyxframework.com/http/Onyx/HTTP/CORS.html):

```crystal
require "onyx-http"

logger = Onyx::HTTP::Logger.new
request_id = Onyx::HTTP::RequestID.new
response_time = Onyx::HTTP::ResponseTime.new
cors = Onyx::HTTP::CORS.new

server = Onyx::HTTP::Server.new(response_time, request_id, logger, cors) do |env|
  env.response << "Hello Onyx"
end

server.bind_tcp(5000)
server.listen

```

```sh
> curl http://localhost:5000 -v
* Rebuilt URL to: http://localhost:5000/
*   Trying 127.0.0.1...
* Connected to localhost (127.0.0.1) port 5000 (#0)
> GET / HTTP/1.1
> Host: localhost:5000
> User-Agent: curl/7.47.0
> Accept: */*
>
< HTTP/1.1 200 OK
< Connection: keep-alive
< X-Request-ID: af4ded9e-2f72-41aa-bac2-308b38198af6
< Access-Control-Allow-Origin: *
< X-Response-Time: 233
< Content-Length: 10
<
* Connection #0 to host localhost left intact
Hello Onyx
```

## Routing

Almost every web application requires routing. It is quite simple with [`Onyx::HTTP::Router`](https://api.onyxframework.com/http/Onyx/HTTP/Router.html):

```crystal
require "onyx-http"

logger = Onyx::HTTP::Logger.new
request_id = Onyx::HTTP::RequestID.new
response_time = Onyx::HTTP::ResponseTime.new

router = Onyx::HTTP::Router.new do
  get "/" do |env|
    env.response << "Hello Onyx"
  end

  post "/echo" do |env|
    env.response << env.request.body.try &.gets_to_end
  end
end

server = Onyx::HTTP::Server.new(response_time, request_id, logger, router)

server.bind_tcp(5000)
server.listen
```

```sh
> curl http://localhost:5000
Hello Onyx
> curl -X POST -d "Knock-knock" http://localhost:5000/echo
Knock-knock
```

![Screenshot #4](https://user-images.githubusercontent.com/7955682/52903121-68379880-322a-11e9-9d45-0517d9e29dda.png)

## Rescuing

By default, an unhandled exception would halt the request processing, put the error backtrace into `STDERR` and print `500 Internal Server Error` into the response body. We can change this behaviour with [`Onyx::HTTP::Rescuer`](https://api.onyxframework.com/http/Onyx/HTTP/Rescuer.html).

This shard comes with [`Onyx::HTTP::Rescuers::Standard`](https://api.onyxframework.com/http/Onyx/HTTP/Rescuers/Standard.html), [`Onyx::HTTP::Rescuers::Silent`](https://api.onyxframework.com/http/Onyx/HTTP/Rescuers/Silent.html) and [`Onyx::HTTP::Rescuers::RouteNotFound`](https://api.onyxframework.com/http/Onyx/HTTP/Rescuers/RouteNotFound.html):

```crystal
require "onyx-http"

logger = Onyx::HTTP::Logger.new
request_id = Onyx::HTTP::RequestID.new
response_time = Onyx::HTTP::ResponseTime.new
rescuer = Onyx::HTTP::Rescuers::Standard(Exception).new
router_rescuer = Onyx::HTTP::Rescuers::RouteNotFound.new

router = Onyx::HTTP::Router.new do
  get "/" do |env|
    env.response << "Hello Onyx"
  end

  post "/echo" do |env|
    env.response << env.request.body.try &.gets_to_end
  end

  get "/error" do
    raise "Oops!"
  end
end

server = Onyx::HTTP::Server.new(response_time, request_id, logger, rescuer, router_rescuer, router)

server.bind_tcp(5000)
server.listen
```

```sh
> curl http://localhost:5000/error
500 Internal Server Error
> curl http://localhost:5000/unknown
404 Route Not Found: GET /unknown
```

![Screenshot #5](https://user-images.githubusercontent.com/7955682/52903125-6c63b600-322a-11e9-908a-87d73948c24e.png)

# Headers

An Onyx::HTTP server response is automatically enriched with various headers.

## CORS

[CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) is a vital thing if you're going to make requests to your API from browsers. By default, Onyx::HTTP has the following CORS policies:

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
Onyx::HTTP.listen(
  cors: {
    # Will be merged with the default settings
    allow_headers: ["accept", "content-type", "authorization"]
  }
)
```

::: tip
It is also possible to alter the middleware completely, read about it at the [Custom middleware](/http/advanced/custom-middleware) section.
:::

## Request ID

An unique request identifier ([`context.request.id`](https://api.onyxframework.com/http/HTTP/Request.html#id%3AString%3F-instance-method)) is also put into the `"X-Request-ID"` header:

```sh
< X-Request-ID: e6fa3c3e-93ce-4ad4-b480-957cb13b56eb
```

## Response time

An amount of **microseconds** elapsed to process the request is available at `"X-Response-Time"` header:

```sh
< X-Response-Time: 123
```

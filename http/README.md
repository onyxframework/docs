# Onyx::HTTP

Onyx::HTTP component includes powerful modules to build scalable web applications. It allows to build REST APIs which have separate business logic and rendering layers, type-safe params parsing, greater control flow and also convenient websocket channels. The framework allows a developer to write less code in general, as it comes with meaningful defaults, for example, [CORS headers](/http/headers) and beautiful logging.

## Installation

To install Onyx::HTTP, you'll need to add both `"onyx"` and `"onyx-http"` into your `shard.yml`:

```yaml
dependencies:
  onyx:
    github: onyxframework/onyx
    version: ~> 0.2.0
  onyx-http:
    github: onyxframework/http
    version: ~> 0.7.0
```

Then, in your application code:

```crystal
require "onyx/http"
```

## Guide

The Onyx::HTTP guide is split to these sections:

* [Routing](/http/routing) demonstates how to draw routes for your application
* [Headers](/http/headers) describes HTTP headers set in responses
* [Errors](/http/errors) guides through errors rescuing and rendering
* [Views](/http/views) introduces to rendering layer
* [Endpoints](/http/endpoints) shows how to use encapsulated endpoints
* [Channels](/http/channels) reveals powerful websocket wrappers
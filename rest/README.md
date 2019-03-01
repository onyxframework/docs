# Onyx::REST

Onyx::REST is purposed to build REST APIs with ease. It consists of:

* [Routing](/rest/routing) to route the requests
* [Actions](/rest/actions) for business logic
* [Views](/rest/views) for rendering logic
* [Renderers](/rest/renderers) for rendering the views
* [Channels](/rest/channels) for websockets

You **must** explicitly add the `onyx-rest` dependency into your `shard.yml` file along with `onyx`:

```yaml
dependencies:
  onyx:
    github: onyxframework/onyx
    version: ~> 0.1.0
  onyx-rest:
    github: onyxframework/rest
    version: ~> 0.6.0
```

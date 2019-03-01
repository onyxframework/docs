# Renderers

An Onyx server instance utilizes Renderers to render [Views](/rest/views) into the response. To specify the renderer, use the following syntax:

```crystal
Onyx.render(:renderer)
```

Where `:renderer` can be one of the following:

* `:plain_text` (**default**) to enable the [Plain Text](#plain-text) renderer
* `:json` to enable the [JSON](#json) renderer

## Error handling

Renderers also take care of rendering REST errors raised by [Actions](/rest/actions#errors) and unhandled errors raised anywhere during the request processing. If a error is a REST error, then its code, class and message are respected. And if a error is unhandled one, then the `500` error code and standard messages are used. The actual way a error is put into the response depends on the renderer chosen.

::: warning NOTE
The `Content-Type` header is updated **only** if there is either a view or an error to render
:::

## Plain Text

Plain Text renderer sets the `Content-Type` header to `plain/text` and calls `#to_text` method on a view. See the details on how to implement this method in the [Plain Text views](/rest/views#plain-text-views) section.

Errors are rendered like this: `500 Internal Server Error` or `404 Post Not Found`. The response status code is updated accordingly.

## JSON

JSON renderer sets the `Content-Type` header to `application/json` and calls `#to_json` method on a view. See the details on how to implement this method in the [JSON views](/rest/views#json-views) section.

An unhandled error is rendered like this:

```json
{
  "error": {
    "class": "Exception",
    "message": "Unhandled server error",
    "code": 500
  }
}
```

[Action Errors](/rest/actions#errors) are rendered in the same way, but with actual error values, for example:

```crystal
struct GetPost
  include Onyx::REST::Action

  errors do
    type InvalidCredentials(403)
    type PostNotFound(404), id : Int32 do
      super("Post not found with id #{id}")
    end
  end
end
```

```json
{
  "error": {
    "class": "InvalidCredentials",
    "message": "Invalid credentials",
    "code": 403
  }
}
```

```json
{
  "error": {
    "class": "PostNotFound",
    "message": "Post not found with id 42",
    "code": 404,
    "payload": {
      "id": 42
    }
  }
}
```

In all error cases, the response status code is updated accordingly.

## Template

TODO:

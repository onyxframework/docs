# Views

## Introduction

To actually modify the response body, you usually print right into it, as it's being an IO:

```crystal
Onyx::HTTP.get "/" do |env|
  env.response << "Hello, Onyx!"
end
```

However, sometimes you want to:

- Render the same response differently depending on the user device (effectively `Accept` header)
- Re-use the rendering logic (for example, rendering a single user and array of users is almost equal)
- Move the rendering logic away from business layer

For this, Onyx::HTTP has a [View](https://api.onyxframework.com/rest/Onyx/REST/View.html) module. Include the `Onyx::HTTP::View` module into an object (preferrably struct) to mark it as a view:

```crystal
struct Hello
  include Onyx::HTTP::View

  def initialize(@who : String)
  end
end

Onyx::HTTP.get "/" do |env|
  # You can either set the response view explicitly
  env.response.view = Hello.new("Onyx")

  # Or make it the return value of the proc
  # (ignored if already set before)
  Hello.new("Onyx")
end
```

You can also use the views in encapsulated [Endpoints](/http/endpoints) in the same way:

```crystal
struct HelloWorld
  include Onyx::HTTP::Endpoint

  def call
    # Use the `#view` method...
    view(Hello.new("Onyx"))

    # Or just return a view
    Hello.new("Onyx")
  end
end
```

Every view requires the `#render(::HTTP::Server::Context)` method to be defined (it is abstract, thus will raise in compilation time if missing). You can define it manually:

```crystal
struct Hello
  include Onyx::HTTP::View

  def initialize(@who : String)
  end

  def render(context)
    context.response << "Hello, " << @who << "!"
  end
end
```

Or you can make use of built-in `.json`, `.xml`, `.text` and `.template` macros:

```crystal
struct Hello
  include Onyx::HTTP::View

  def initialize(@who : String)
  end

  # Will be rendered if `Accept` header is `application/json`
  json message: "Hello, #{@who}!"

  # Will be rendered if `Accept` header is `application/xml`
  xml do
    element "hello" do
      attribute "who", @who
    end
  end

  # Will be rendered if `Accept` header is `text/html`
  template "./hello.html.ecr"

  # Will be rendered if `Accept` header is `text/plain`,
  # `*/*` or missing (i.e. fallback)
  text "Hello, #{@who}!"
end
```

Note that the last macro called is the fallback one — it will be rendered if no other content types are matched. Also note that the rendered respects [q-factors](https://developer.mozilla.org/en-US/docs/Glossary/Quality_values) in the `Accept` header, matching whichever is the highest. And if there is only **one** macro called, then it will always be rendered, despite of the `Accept` header value.

Below is information on how to use these three macros:

## JSON

To render a view as a JSON, you'd need to call the `.json` macro. It has multiple overloaders. The first one accepts an object which will be called `.to_json(IO)` or `.to_json(JSON::Builder)` upon rendering:

```crystal
struct Hello
  include Onyx::HTTP::View

  def initialize(@who : String)
  end

  json({
    message: "Hello, #{@who}!"
  })
end
```

Which expands to:

```crystal
struct Hello
  include Onyx::HTTP::View

  def initialize(@who : String)
  end

  # Defined unless `to_json` is already defined
  def to_json(io : IO)
    {message: "Hello, #{@who}!"}.to_json(io)
  end

  # Defined unless `to_json` is already defined
  def to_json(builder : JSON::Builder)
    {message: "Hello, #{@who}!"}.to_json(builder)
  end

  def render_to_application_json(context)
    context.response.content_type = "application/json"
    to_json(context.response)
  end
end
```

You can make use of the [`JSON::Serializable`](https://crystal-lang.org/api/latest/JSON/Serializable.html) module as well:

```crystal
struct Hello
  include Onyx::HTTP::View
  include JSON::Serializable

  def initialize(@who : String)
  end

  # `self.to_json` will be called, which is already
  # defined in the `JSON::Serializable` module
  json(self)
end
```

The second overloader accepts named arguments which will be treated as a single NamedTuple:

```crystal
struct Hello
  include Onyx::HTTP::View

  def initialize(@who : String)
  end

  json message: "Hello, #{@who}!"

  # Effectively the same as:
  #

  json({
    message: "Hello, #{@who}!"
  })
end
```

The third overloader accepts a block, which will be yielded `with` [`JSON::Builder`](https://crystal-lang.org/api/latest/JSON/Builder.html) instance:

```crystal
struct Hello
  include Onyx::HTTP::View

  def initialize(@who : String)
  end

  json do
    object do
      field "message", "Hello, #{@who}!"
    end
  end
end
```

Which expands to:

```crystal
struct Hello
  include Onyx::HTTP::View

  def initialize(@who : String)
  end

  def to_json(io : IO)
    builder = JSON::Builder.new(io)
    builder.document do
      builder.object do
        builder.field "message", "Hello, #{@who}!"
      end
    end
  end

  def to_json(builder : JSON::Builder)
    builder.object do
      builder.field "message", "Hello, #{@who}!"
    end
  end

  def render_to_application_json(context)
    context.response.content_type = "application/json"
    to_json(context.response)
  end
end
```

It is convenient to re-use JSON views:

```crystal
record User, id : Int32, name : String

struct SingleUser
  include Onyx::HTTP::View

  def initialize(@user : User)
  end

  json do
    object do
      field "id", @user.id
      field "name", @user.name
    end
  end
end

struct ManyUsers
  include Onyx::HTTP::View

  def initialize(@users : Array(User))
  end

  # `#to_json` will be called on every `SingleUser` instance
  json(@users.map{ |u| SingleUser.new(u) })
end
```

## XML

`xml` macro accepts a block just like the builder variant of [`json`](#json), but instead of `JSON::Builder` it uses [`XML::Builder`](https://crystal-lang.org/api/latest/XML/Builder.html):

```crystal
struct Hello
  include Onyx::HTTP::View

  def initialize(@who : String)
  end

  xml do
    element "hello" do
      attribute "who", @who
    end
  end
end
```

## Template

Templates are rendered with [Kilt](https://github.com/jeromegn/kilt) shard. Templates have access to the view context, for example:

```erb
<!-- ./hello.html.ecr -->
<p>Hello, <%= @who %>!</p>
```

```crystal
struct Hello
  include Onyx::HTTP::View

  def initialize(@who : String)
  end

  template("./hello.html.ecr")

  # Expands to:
  #

  def render_to_text_html(context)
    context.response.content_type = "text/html"
    Kilt.render("./hello.html.ecr", context.response)
  end
end
```

By default, `.template` macro has `content_type: "text/html"` and `accept: {"text/html"}` arguments, which means that it would be rendered only if `Accept` header value is included into `{"text/html"}` tuple and set the `Content-Type` header to `text/html` afterwards. You can override these arguments and even define multiple templates to render depending on the `Accept` header:

```crystal
struct Hello
  include Onyx::HTTP::View

  def initialize(@who : String)
  end

  # `Content-Type: text/html`, `Accept: text/html`
  template("./hello.html.ecr")

  # `Content-Type: application/xml`, `Accept: application/xml`
  template("./hello.ecr.xml", content_type: "application/xml", accept: {"application/xml"})

  # Expands to:
  #

  def render_to_text_html(context)
    context.response.content_type = "text/html"
    Kilt.render("./hello.html.ecr", context.response)
  end

  def render_to_application_xml(context)
    context.response.content_type = "application/xml"
    Kilt.render("./hello.ecr.xml", context.response)
  end
end
```

::: tip

The same `content_type` and `accept` arguments rule is applied to `.json` and `.text` macros as well.

:::

## Text

`.text.` macro is the simplest one, it just renders the text value into the response IO:

```crystal
struct Hello
  include Onyx::HTTP::View

  def initialize(@who : String)
  end

  text "Hello, #{@who}!"

  # Expands to:
  #

  def render_to_text_plain(context)
    context.response.content_type = "text/plain"
    context.response << "Hello, #{@who}!"
  end
end
```

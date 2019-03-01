# Views

Include the [`Onyx::REST::View`](https://api.onyxframework.org/rest/Onyx/REST/View.html) module to mark an object as a view. It then will be rendered depending on the currently active [Renderer](/rest/renderers) in the stack.

Views are read from the [`HTTP::Context::Response#view`](https://api.onyxframework.org/rest/HTTP/Server/Response.html#view%3AOnyx%3A%3AREST%3A%3AView%3F-instance-method) variable. It can be set either in an [Action](/rest/actions), or manually, for example:

```crystal
Onyx.get "/foo" do |env|
  env.response.view = MyView.new
end
```

A view is usually just a plain object with data. The active renderer would call an according method on it:

* [JSON Renderer](/rest/renderers#json) would call `to_json(json_builder)` method
* [Plain Text Renderer](/rest/renderers#plain-text) would call `to_text(io)` method
* *TODO: Template Renderer would call `render(io)`*

The module includes convenient macros for faster renderering rules definition.

## JSON views

If you're using the [JSON Renderer](/rest/renderers#json), then your views must implement `to_json(builder : JSON::Builder)` method. You have multiple ways to define how the view is going to be rendered into the JSON response:

1. Use `json(object)` macro:

```crystal
struct MyView
  include Onyx::REST::View

  def initialize(@foo : String, @bar : Int32)
  end

  json({
    foo: @foo,
    bar: @bar
  })
end

Onyx.render(:json)
```

It is effectively expanded to:

```crystal
  def to_json(builder)
    {
      foo: @foo,
      bar: @bar
    }.to_json(builder)
  end
```

I.e. it calls `.to_json(builder)` on the passed object (the argument). That means that the argument must implement this method. In the example, the argument is `NamedTuple(foo: String, bar: Int32)`, which obviously [implements it](https://crystal-lang.org/api/latest/NamedTuple.html#to_json%28json%3AJSON%3A%3ABuilder%29-instance-method).

::: tip
The argument can be or include other view as well! See more examples in the [Best practices](/rest/best-practices/view) section
:::

2. Use `json(&block)` macro:

```crystal
  json do
    object do
      field "foo", @foo
      field "bar", @bar
    end
  end
```

All these methods (`object`, `field`) are called on the `builder` argument of type [`JSON::Builder`](https://crystal-lang.org/api/latest/JSON/Builder.html) using the [`with yield` syntax](https://crystal-lang.org/reference/syntax_and_semantics/blocks_and_procs.html#with--yield). The code expands to this:

```crystal
  def to_json(builder)
    builder.object do
      builder.field "foo", @foo
      builder.field "bar", @bar
    end
  end
```

Such a syntax is particularly handy when re-using views to render nested structures and arrays. See the examples in the [Best practices](/rest/best-practices/view) section.

3. Include the [`JSON::Serializable`](https://crystal-lang.org/api/latest/JSON/Serializable.html) module to automatically define the `to_json` method:

```crystal
struct MyView
  include Onyx::REST::View
  include JSON::Serializable

  def initialize(@foo : String, @bar : Int32)
  end
end

MyView.new("baz", 42).to_json # => {"foo":"baz","bar":42}
```

4. Manually define the `to_json(builder : JSON::Builder)` method.

If you're using the JSON Renderer and accidentaly forget to somehow define the `to_json` method, then a compilation-time error will be raised. The same rule applies to other renderers.

## Plain Text views

If you're using the [Plain Text Renderer](/rest/renderers#plain-text), then your views must implement `to_text(io)` method. You can do it either manually or with some handy macros:

1. `text(object)`, for example:

```crystal
struct MyView
  include Onyx::REST::View

  def initialize(@foo : String, @bar : Int32)
  end

  text("foo = #{@foo}, bar = #{@bar}")
end

Onyx.render(:plain_text)
```

2. `text(&block)`:

```crystal
  text do
    "foo = #{@foo}, bar = #{@bar}"
  end
```

These two approaches are mostly equal, use the one you like.

## Template views

TODO:

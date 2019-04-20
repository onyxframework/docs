---
sidebarDepth: "2"
---

# Endpoints

`Onyx::HTTP::Endpoint` is an encapsulated HTTP endpoint which is expected (but not forced) to execute business logic only and return a [View](/http/views) to render.

```crystal
require "onyx/http"

struct UserView
  include Onyx::HTTP::View

  def initialize(@id : Int32, @name : String)
  end
end

struct RandomUser
  include Onyx::HTTP::Endpoint

  def call
    user = random_user # Business logic, e.g. fetch from DB
    return UserView.new(user.id, user.name)
  end
end

Onyx::HTTP.get "/random_user", RandomUser
```

## Call

The `call` method is abstract and is required to be implemented in all your endpoints. This is where the *action*, i.e. business-logic of your endpoint, takes place. Think about fetching a user or inserting a post into database.

The resulting view is determined either with the [`view`](https://api.onyxframework.org/http/Onyx/HTTP/Endpoint.html#view%28view%3AView%29-instance-method) call or by the return value. The former takes precedence:

```crystal
def call
  view(ViewA.new)
  view(ViewB.new)
  return ViewC.new
end

# The resulting view is ViewB
```

## Callbacks

`Onyx::HTTP::Endpoint` includes the `Callbacks` module from the [callbacks.cr](https://github.com/vladfaust/callbacks.cr) shard. You can define `before` and `after` callbacks which would be run in the context of this endpoint (effectively giving an access to the `self` variable and also `params`):

```crystal
struct CallbackEndpoint
  include Onyx::HTTP::Endpoint

  before do
    puts "Before N1"
  end

  before do
    puts "Before N2"
  end

  def call
    puts "Call"
  end

  after do
    puts "After N1"
  end

  after do
    puts "After N2"
  end
end
```

The code expands to this:

```crystal
struct CallbackEndpoint
  include Onyx::HTTP::Endpoint

  def call_with_callbacks
    puts "Before N1"
    puts "Before N2"
    call
    puts "After N1"
    puts "After N2"
  end

  def call
    puts "Call"
  end
end
```

::: warning NOTE
Callbacks are run in the context of the endpoint, but not within the `call` method itself. Their return values do not matter unless they raise.
:::

And the expected output is:

```sh
> curl /callback_endpoint
Before N1
Before N2
Call
After N1
After N2
```

## Helpers

The `Onyx::HTTP::Endpoint` module also includes some helper methods:

* `context` to access the current [`HTTP::Server::Context`](https://crystal-lang.org/api/latest/HTTP/Server/Context.html)
* [`view`](https://api.onyxframework.org/http/Onyx/HTTP/Action.html#view%28view%3AView%29-instance-method) to set the resulting view
* `status` to update the response status (e.g. `status(201)`)
* `header` to set the response header (e.g. `header("X-Foo", "bar")`)
* `redirect` to set the status to `302` and the `"Location"` header to the destination, e.g. `redirect("https://google.com")`. Note that it does **not** halt the execution of the action, it just modifies the response

All [Callbacks](#callbacks) have access to these helpers:

```crystal
struct CallbackEndpoint
  include Onyx::HTTP::Endpoint

  before do
    header("X-Bar", "baz")
  end

  before do
    save_request(context.request)
  end
end
```

## Params

Endpoints and [Channels](/http/channels) include powerful `params` macro which allows to define endpoint parameters (or *params* for short) from many sources:

* Path params with `path` macro
* Query params with `query` macro
* Form (`Content-Type: x-www-urlformencoded`) params with `form` macro
* JSON (`Content-Type: application/json`) params with `json` macro

A single endpoint can have params defined to parse from any of these sources (or even all four simultaneously).

### Type

`type` method cheatsheet (detailed information is in below sections):

* The syntax is `type <param_name> : <param_type>( = <default_value>)`, for example, `type name : String = "John"`
* Params are accessible with `params.<param_source>.<param_name>` getters, for example, `params.path.name`
* The param type can be *nilable* (e.g. `type name : String?`), which means that if the parameter is absent in the request, the getter will return `nil` value
* If the param type is *not nilable* **and** absent in the request, a 400 error is returned
* If the param type has a `<default_value>` **and** absent in the request, the getter returns the default value
* `query`, `form` and `json` params support nested, arrays and (*soon*) hash params
* Parsing is powered by the [http-params-serializable](https://github.com/vladfaust/http-params-serializable) shard; all the options are passed to it as-is, for example `type from_time : Time, key: "from", converter: Time::EpochConverter`

### Path params

Any of these four macros **must** be called inside the `params` macro like this:

```crystal
struct GetUser
  include Onyx::HTTP::Endpoint

  params do
    path do
      type id : Int32
    end
  end

  def call
    pp params.path.id
  end
end
```

In this example we've defined a *path parameter* named `id`. The endpoint would parse it from an incoming request's URI (in fact, it is parsed by the router internally, not the action itself). The route should look like this:

```crystal
Onyx::HTTP.get "/users/:id", GetUser
```

Note the `:id` part. This is a *path parameter*. When doing a `GET /users/42/` request, the `id` equals to `42`. Therefore this line would print `42`:

```crystal
  def call
    pp params.path.id # 42
  end
```

The `:id` parameter is a mandatory part of this request (otherwise it won't match, for example, `/users/` is completely another route), thus `params.path.id` is never empty.

But what if a hacker (or someone else) tries the `/users/foo` route? `"foo"` cannot be cast to an `Int32`! Worry not, we've got you. Once a parameter is failed to cast, a 400 error is returned in the response and the `call` method is not even invoked. So if you've defined `type id : Int32` you (and the compiler) can be sure that it is **always** `Int32`.

Of course, you're not limited to `Int32` only. You can define any type you want. The same rules apply to all other param types as well.

### Query params

Query params are parsed from URL queries:

```crystal
struct IndexUsers
  include Onyx::HTTP::Endpoint

  params do
    query do
      type offset : Int32?
      type limit : Int32 = 10
    end
  end

  def call
    pp typeof(params.query.offset) # Int32 | Nil
    pp typeof(params.query.limit)  # Int32

    users = repo.query(User
      .all
      .offset(params.query.offset)
      .limit(params.query.limit)
    )
  end
end
```

In this example, the URL query is expected to contain `offset` and `limit` parameters, for example:

```sh
"/?offset=10&limit=20"
```

Note that `offset` type is `Int32?`. The `?` symbol expands to `Int32 | Nil`, which effectively means that the `offset` parameter is *nilable*. So queries `/?limit=20` and even `/?offset=&limit=20` are still valid and `params.query.offset` will be `nil`.

In contrary, `limit` type is `Int32` and it has a default value of `10`. That means that if the `limit` parameter is absent from a request query, `params.query.limit` will be equal to `10`.

Summing it up, these are example of queries with corresponding resulting param values:

```crystal
context.request.query == "/?offset=10&limit=20"
pp params.query.offset # => 10
pp params.query.limit # => 20

context.request.query == "/?offset=10"
pp params.query.offset # => 10
pp params.query.limit # => 10

context.request.query == "/?offset="
context.request.query == "/"
pp params.query.offset # => nil
pp params.query.limit # => 10

context.request.query == "/?limit=20"
pp params.query.offset # => nil
pp params.query.limit # => 20
```

::: tip NOTE

These typing rules apply to all the params — `path`, `query`, `form` and `json`.

:::

Query params also support nesting, arrays and hashes:

```crystal
struct ComplexEndpoint
  include Onyx::HTTP::Endpoint

  params do
    query do
      type user do
        type name : String
        type interests : Array(String)

        type settings, nilable: true do
          type messages_limit : Int32
        end
      end
    end
  end

  def call
    pp params.query.user.interests.first
  end
end
```

### Form params

Form params are parsed from the request body with the `Content-Type: x-www-urlformencoded` header:

```crystal
struct CreateUser
  include Onyx::HTTP::Endpoint

  params do
    form do
      type user do
        type name : String
        type email : String
      end
    end
  end

  def call
    if form = params.form
      user = User.new(name: form.user.name, email: form.user.email)
    end
  end
end

Onyx::HTTP.post "/users", CreateUser
```

```sh
> curl -X POST -H "Content-Type: x-www-urlformencoded" \
-D "user[name]=John&user[email]=foo@example.com" /users
```

Note that `params.form` can be `nil` if the request `Content-Type` header is not `x-www-urlformencoded`. This is because a single endpoint can have both `form` and `json` params, parsed depending on the `Content-Type` header. If your action expects a single type of content, you can use the `require: true` option:

```crystal
struct CreateUser
  include Onyx::HTTP::Endpoint

  params do
    form require: true do
      type user do
        type name : String
        type email : String
      end
    end
  end

  def call
    user = User.new(name: params.form.user.name, email: params.form.user.email)
  end
end
```

In this case, the form is **always** attempted to be parsed from the request body, regardless of the `Content-Type` header, returning 400 error if the body is empty. Therefore, the `params.form` getter is never `nil`.

### JSON params

JSON params are the same as the [Form](#form-params) ones, but with `Content-Type: application/json` header.

```crystal
struct CreateUser
  include Onyx::HTTP::Endpoint

  params do
    json require: true do
      type user do
        type name : String
        type email : String
      end
    end
  end

  def call
    user = User.new(name: params.json.user.name, email: params.json.user.email)
  end
end
```

```sh
> curl -X POST -H "Content-Type: application/json" \
-D '{"user":{"name":"John","email":"foo@example.com"}}' /users
```

You can use both `form` and `json` params in one endpoint. They will be parsed depending on the `Content-Type` header:

```crystal
struct CreateUser
  include Onyx::HTTP::Endpoint

  params do
    form do
      type user do
        type name : String
        type email : String
      end
    end

    json do
      type user do
        type name : String
        type email : String
      end
    end
  end

  def call
    if form = params.form
      pp form.user
    elsif json = params.json
      pp json.user
    end
  end
end
```

You obviously should not use `require: true` in this case.

## Errors

Endpoints and [Channels](/http/channels) have convenient `.errors` macro to define HTTP errors:

::: tip

Read more about types of errors in the [Errors section](/http/errors).

:::

```crystal
struct GetPost
  include Onyx::HTTP::Endpoint

  params do
    path do
      type id : Int32
    end
  end

  errors do
    type PostNotFound(404)
  end

  def call
    post = Onyx.query(Post.where(id: params.path.id)).first?
    raise PostNotFound.new unless post

    # Will be called only if `post` is truthy
    return Views::Post.new(post)
  end
end

Onyx::HTTP.get "/posts/:id", GetPost
```

In this case, `PostNotFound` is `< Onyx::HTTP::Error(404)`. Onyx renders the error properly:

```sh
> curl /posts/42
404 Post Not Found
```

You can provide additional context to your errors:

```crystal
errors do
  type PostNotFound(404) do
    super("Post not found with this id")
  end
end

# Expands to:
#

class PostNotFound < Onyx::HTTP::Error(404)
  def initialize
    super("Post not found with this id")
  end
end
```

Or even:

```crystal
errors do
  type PostNotFound(404), id : Int32 do
    super("Post not found with id #{id}")
  end
end

# Expands to:
#

class PostNotFound < Onyx::HTTP::Error(404)
  def initialize(@id : Int32)
    super("Post not found with id #{id}")
  end

  def payload
    {id: @id}
  end
end
```

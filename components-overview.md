---
sidebarDepth: "1"
---

# Components overview

Onyx Framework consists of a number of components. You can combine them as much as you want in your applications, for example, you can take the ORM but stay with your favorite web framework and vice versa.

## HTTP

[Onyx::HTTP](/http/) component includes powerful modules to build scalable web applications. It allows to build REST APIs which have separate business logic and rendering layers, type-safe params parsing, greater control flow and also convenient websocket channels.

A model for example:

```crystal
class Models::User
  property id : Int32?
  property name : String?

  def initialize(@id : Int32?, @name : String?)
  end
end
```

Views take care of rendering:

```crystal
struct Views::User
  include Onyx::HTTP::View

  def initialize(@user : Models::User)
  end

  json do
    object do
      field "id", @user.id
      field "name", @user.name
    end
  end
end
```

Endpoints encapsulate business logic:

```crystal
struct Endpoints::Users::Get
  include Onyx::HTTP::Endpoint

  params do
    path do
      type id : Int32
    end
  end

  errors do
    type UserNotFound(404)
  end

  def call
    raise UserNotFound.new unless path.id == 42

    user = Models::User.new(42, "John")
    return Views::User.new(user)
  end
end
```

Channels conveniently wrap websockets:

```crystal
class Channels::Echo
  include Onyx::HTTP::Channel

  def on_message(message)
    socket.send(message)
  end
end
```

Server puts it all together:

```crystal
require "onyx/http"

require "models/**"
require "endpoints/**"
require "views/**"
require "channels/**"

Onyx::HTTP.get "/users/:id", Endpoints::Users::Get
Onyx::HTTP.ws "/echo", Channels::Echo

Onyx::HTTP.listen
```

## SQL

[Onyx::SQL](/sql/) is an SQL ORM for databases implementing [crystal-db](https://github.com/crystal-lang/crystal-db) interface. This includes [SQLite](https://github.com/crystal-lang/crystal-sqlite3), [MySQL](https://github.com/crystal-lang/crystal-mysql), [PostgreSQL](https://github.com/will/crystal-pg), [Cassandra](https://github.com/kaukas/crystal-cassandra) and more.

The component includes convenient mapping schema defintion:

```crystal
require "onyx/sql"

class Models::User
  include Onyx::SQL::Model

  schema do
    pkey id : Int32
    type name : String, not_null: true
    type age : Int32
    type created_at : Time, not_null: true, default: true
    type updated_at : Time
    type posts : Array(Post), foreign_key: "author_id"
  end
end

class Models::Post
  include Onyx::SQL::Model

  schema do
    pkey id : Int32
    type content : String, not_null: true
    type created_at : Time, not_null: true, default: true
    type updated_at : Time
    type author : User, key: "author_id"
  end
end
```

A powerful type-safe SQL query builder:

```crystal
user = User.new(name: "John", age: 18)
user.insert.to_s # => "INSERT INTO users (name, age) VALUES (?, ?)"

query = User.where(name: "John").or("age >= 18").select(:id)
query.to_s # "SELECT users.id FROM users WHERE name = ? or age >= ?"

query = User.where(name: 42) # Compile-time error (name must be String, not Int32)
```

And a repository to wrap a database instance and execute the queries:

```crystal
user = Onyx.query(User.where(id: 42)).first
pp user # <User @name="John" @age=18>
```

## EDA

[Onyx::EDA](/eda/) allows to implement [Event-Driven Architecture](https://en.wikipedia.org/wiki/Event-driven_architecture) in your applications to make them reactive. See the [**Distributed websocket chat in 40 lines of code**](https://blog.onyxframework.org/posts/distributed-websocket-chat-in-40-loc/) blog post for a real-life example.

```crystal
require "onyx/eda"

struct MyEvent
  include Onyx::EDA::Event

  def initialize(@foo : String)
  end
end

Onyx.subscribe(Object, MyEvent) do |event|
  puts "Got MyEvent with foo = #{event.foo}"
end

spawn Onyx.emit(MyEvent.new("bar"))
```

## Helpers

The framework also includes some helper modules for everyday development. These helpers are **automatically** required whenever you require any of the Onyx components or just the `"onyx"` itself.

### Env

First of all, it sets `CRYSTAL_ENV` environment variable to `"development"` if not set yet. Then it loads other environment variables from `.env` files in this order, overwriting if defined multiple times:

1. `.env` file
2. `.env.local` file
3. `.env.#{CRYSTAL_ENV}` file
4. `.env.#{CRYSTAL_ENV}.local` file

It also enables `runtime_env` and `buildtime_env` top-level macros which raise if an environment variable is not defined.

```crystal
require "onyx"
# or
require "onyx/env"

# At this point, all variables are loaded from .env files
#

# Will raise on program start if DATABASE_URL variable is missing
runtime_env DATABASE_URL
```

### Logger

Enables the beautiful singleton `Logger` instance.

```crystal
require "onyx"
# or
require "onyx/logger"

Onyx.logger.info("Hello world!")
```

```sh
 INFO [12:45:52.520] Hello world!
```

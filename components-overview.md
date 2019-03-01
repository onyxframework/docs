---
sidebarDepth: "1"
---

# Components overview

Onyx Framework consists of a number of loosely coupled components:

## REST

[Onyx::REST component](/rest/) is used to create [REST](https://en.wikipedia.org/wiki/Representational_state_transfer) API applications:

```crystal
require "onyx/rest"

Onyx.get "/" do |env|
  env.response << "Hello World!"
end

Onyx.listen(5000)
```

Inspired by Hanami, the component follows the practice of splitting business and rendering layers, achieved with Action and View modules:

```crystal
struct Views::User
  include Onyx::REST::View

  def initialize(@user : Models::User)
  end

  json({
    id:   @user.id,
    name: @user.name
  })
end

struct Actions::GetUser
  include Onyx::REST::Action

  params do
    path do
      type id : Int32
    end
  end

  errors do
    type UserNotFound(404)
  end

  def call
    user = Onyx.query(Models::User.where(id: params.path.id)).first?
    raise UserNotFound.new unless user

    return Views::User.new(user)
  end
end

Onyx.get "/users/:id", Actions::GetUser

Onyx.render(:json)
Onyx.listen
```

Read more about Onyx::REST at the [relevant documentation section](/rest/).

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
    type created_at : Time, default: true, not_null: true
    type updated_at : Time
    type posts : Array(Post), foreign_key: "author_id"
  end
end

class Models::Post
  include Onyx::SQL::Model

  schema do
    pkey id : Int32
    type content : String, not_null: true
    type created_at : Time, default: true, not_null: true
    type updated_at : Time
    type author : User, key: "author_id"
  end
end
```

It also has a powerful type-safe SQL query builder:

```crystal
user = User.new(name: "John", age: 18)
user.insert.to_s # => "INSERT INTO users (name, age) VALUES (?, ?)"

query = User.where(name: "John").or("age >= 18").select(:id)
query.to_s # "SELECT id FROM users WHERE name = ? or age >= ?"

query = User.where(name: 42) # Compile-time error (name must be String, not Int32)
```

And the repository to actually execute the queries:

```crystal
user = Onyx.query(User.where(id: 42)).first
pp user # <User @name="John" @age=18>
```

To know more about Onyx::SQL, please visit the [relevant docs section](/sql/).

## EDA

[Onyx::EDA](/eda/) allows to implement [Event-Driven Architecture](https://en.wikipedia.org/wiki/Event-driven_architecture) in your applications to make them reactive. See the [**Distributed websocket chat in 40 lines of code**](https://blog.onyxframework.org/posts/distributed-websocket-chat-in-40-loc/) blog post for the real-life example.

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

sleep(0.1)
```

To know more about Onyx::EDA, please visit the [relevant docs section](/eda/).

## Helpers

The framework also includes some helper modules for everyday development. These helpers are **automatically** required whenever you require any of the Onyx components or just the `"onyx"`.

### Env

First of all, it sets `CRYSTAL_ENV` environment variable to `"development"` if not set yet. Then it loads other environment variables from `.env` files in this order, overwriting if defined multiple times:

1. `.env` file
2. `.env.local` file
3. `.env.#{CRYSTAL_ENV}` file
3. `.env.#{CRYSTAL_ENV}.local` file

It also enables `runtime_env` and `buildtime_env` top-level macros which raise if an environment variable is not defined.

```crystal
require "onyx"

# At this point, all variables are loaded from .env files
#

# Will raise on program start if DATABASE_URL variable is missing
runtime_env DATABASE_URL
```

### Logger

Enables the singleton `Logger` instance.

```crystal
require "onyx"

Onyx.logger.info("Hello world!")
```

```sh
 INFO [12:45:52.520] Hello world!
```

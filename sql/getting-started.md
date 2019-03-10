# Getting started

To add the Onyx::SQL functionality into your application, you must explicitly add the `onyx-sql` dependency into your `shard.yml` file along with `onyx` **and** the database shard you're planning to work with (for example, [crystal-pg](https://github.com/will/crystal-pg)):

```yaml
dependencies:
  onyx:
    github: onyxframework/onyx
    version: ~> 0.3.0
  onyx-sql:
    github: onyxframework/sql
    version: ~> 0.7.0
  pg:
    github: will/crystal-pg
    version: ~> 0.15.0
```

Then in your Crystal code you should require both `onyx-sql` and the database shard requiring the database shard **before** the ORM:

```crystal
require "pg"
require "onyx/sql"
```

::: warning
From now on, your application **requires** `DATABASE_URL` environment variable to be set. See more about loading environment variables in the [Onyx Helpers section](/components-overview#env).
:::

Afterwards you can define your models. Assuming that you have the following tables in your PostgreSQL database:

```sql
CREATE TABLE users (
  id          SERIAL      PRIMARY KEY,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL  DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

CREATE TABLE posts (
  id          SERIAL  PRIMARY KEY,
  author_id   INT     NOT NULL  REFERENCES users(id),
  content     TEXT    NOT NULL,
  cover       TEXT, -- Cover image URL
  created_at  TIMESTAMPTZ NOT NULL  DEFAULT now(),
  updated_at  TIMESTAMPTZ
);
```

The mapping should look like this:

```crystal
class User
  include Onyx::SQL::Model

  schema users do
    pkey id : Int32
    type name : String, not_null: true
    type created_at : Time, not_null: true, default: true
    type updated_at : Time
    type posts : Array(Post), foreign_key: "author_id"
  end
end

class Post
  include Onyx::SQL::Model

  schema posts do
    pkey id : Int32, converter: PG::Any(Int32)
    type author : User, not_null: true, key: "author_id"
    type content : String, not_null: true
    type cover : String
    type created_at : Time, not_null: true, default: true
    type updated_at : Time
  end
end
```

The [Schema](/sql/schema) mapping is pretty self-descripting. `not_null: true` means that the column is `NOT NULL` in the database, `default: true` means that the column has a `DEFAULT` value. The mapping generates according properties (i.e. `User.id`).

Note how simply references are defined. From the mapping we easily understand that `User` has one-to-many `posts` reference of type `Post` with foreign key (i.e. column in the foreign table `posts`) `"author_id"`; and `Post` has many-to-one reference `author` of type `User` with the same key (i.e. column in the `posts` table) `"author_id"`.

You can then interact with the database by either utilizing raw SQL queries and direct `DB` instance:

```crystal
db = DB.open(ENV["DATABASE_URL"])
user = User.from_rs(db.query("SELECT * FROM users WHERE id = ?", 42)).first?
```

Or make use of the powerful [Repository](/sql/repository) class wrapping the DB connection and [Query](/sql/query) struct providing a convenient and type-safe way to build SQL queries:

```crystal
user = Onyx.query(User.where(id: 42)).first?
```

With powerful joins:

```crystal
# Fetch all posts by author named "John"
posts = Onyx.query(Post
  .join(author: true) do |x|
    x.where(name: "John")
  end
)
```

Continue reading the essential sections to know more!

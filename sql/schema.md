# Schema

`Onyx::SQL::Model` module includes powerful `schema` macro to define model mapping.

## Basic example

The following example is for PostgreSQL. Assuming that you have these tables in your database:

```sql
CREATE TABLE users (
  id          SERIAL      PRIMARY KEY,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL  DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

CREATE TABLE tags (
  id      SERIAL  PRIMARY KEY,
  content TEXT    NOT NULL
);

CREATE TABLE posts (
  id          SERIAL  PRIMARY KEY,
  author_id   INT     NOT NULL  REFERENCES users(id),
  tag_ids     INT[]   NOT NULL  DEFAULT '{}',
  content     TEXT    NOT NULL,
  cover       TEXT, -- Cover image URL
  created_at  TIMESTAMPTZ NOT NULL  DEFAULT now(),
  updated_at  TIMESTAMPTZ
);
```

The mapping would look like this:

```crystal
class User
  # Including the `Onyx::SQL::Model` module is mandatory
  include Onyx::SQL::Model

  # You're defining a mapping schema for `users` table.
  # You can also use string or symbol syntax:
  # `schema "users" do` or `schema :users do`
  schema users do
    # @id is primary key of type Int32.
    # It implicitly has `not_null: true` and `default: true` options.
    # It is expanded to `property id : Int32?`, meaning that it is nilable
    pkey id : Int32

    # The @name field is of type String (TEXT in PostgreSQL) and `NOT NULL`.
    # It is expanded to `property name : String?`
    type name : String, not_null: true

    # The @created_at field is of type Time (TIMESTAMPTZ in PostgreSQL).
    # It is also `DEFAULT` and `NOT NULL` and
    # expanded to `property created_at : Time?`
    type created_at : Time, not_null: true, default: true

    # The @update_at field is also of type Time, but is
    # neither `DEFAULT` or `NOT NULL`.
    # It is expanded to `property updated_at : Time?`
    type updated_at : Time

    # @posts is one-to-many reference to `Post` class
    # with foreign table key "author_id".
    # It is expanded to `property posts : Array(Post)?`
    type posts : Array(Post), foreign_key: "author_id"
  end
end

class Tag
  include Onyx::SQL::Model

  schema tags do
    # Ditto, but `Tag` class is referenced as enumerable direct reference
    # in the `Post` class, meaning that an array of Tags could be mapped
    # from the `tag_ids INT[]` array. But what if the database was SQLite3?
    # SQLite3 handles arrays diffrently (doesn't handle at all to be specific).
    # That why we must explicitly specify a converter for this primary key field
    pkey id : Int32, converter: PG::Any(Int32)

    type content : String, not_null: true
    type posts : Array(Post), foreign_key: "tag_ids"
  end
end

class Post
  include Onyx::SQL::Model

  schema posts do
    pkey id : Int32

    # `Post` class has direct singular reference to `User` class with
    # same-table key "author_id". Additionaly, it is `NOT NULL` in the SQL.
    # It is expanded to `property author : User?`
    type author : User, not_null: true, key: "author_id"

    # @tags is a direct enumerable reference to `Tag` class with key "tag_ids".
    # It has both `NOT NULL` and `DEFAULT` in the database table.
    # It is expanded to `property tags : Array(Tag)?`
    type tags : Array(Tag), not_null: true, default: true, key: "tag_ids"

    type content : String, not_null: true
    type cover : String
    type created_at : Time, not_null: true, default: true
    type updated_at : Time
  end
end
```

You can initialize models with an arbitrary amount of variables:

```crystal
user = User.new(name: "John")
post = Post.new(author: user, content: "Blah-blah")
```

Models have nilable properties:

```crystal
pp post.author.not_nil!.name # => "John"
```

Instead of `not_nil!`, you can call a bang getter on a property:

```crystal
pp post.author!.name
```

## Field

Fields are mappings to database columns. A model can have an arbitrary amount of fields.

::: danger IMPORTANT
You must map **all** the columns, otherwise a `DB::MappingException` would be raised on reading from database!
:::

### Primary key

Primary key field is defined with `pkey` macro. There **must** be a **single** primary key in the schema mapping. It can be any type apart from `Int32`. If it is not of a basic [`DB::Any`](http://crystal-lang.github.io/crystal-db/api/latest/DB/Any.html) type (which is `Bool | Float32 | Float64 | Int32 | Int64 | Slice(UInt8) | String | Time | Nil`), then a [converter](#converter) must be set. Furthermore, if this primary key is referenced somewhere as enumerable (e.g. the `tags` example in the code above), then it must have a [converter](#converter) set as well.

::: tip NOTE
Compositional (i.e. multi-field) primary keys will be implemented in the future
:::

### `converter` option

Often the mapping is intiutive, for example, `INTEGER` SQL column is usually an `Int32` in Crystal. However, some types are complex, and other are handled differently in different databases, thus requiring a converter. A converter is also required in case if the field is a primary key and the model is referenced as enumerable reference from another model (or self).

Most of the times you'll get an understandable compilation-time error if a field requires a converter.

#### `crystal-sqlite3` types

Shard homepage: [crystal-lang/crystal-sqlite3](https://github.com/crystal-lang/crystal-sqlite3)

Crystal type | SQLite3 type | Required converter
--- | --- | --- | ---
Bool* | INTEGER
Float | REAL
Int | INTEGER
Bytes | BLOB
String | TEXT
Time** | TEXT
Nil | NULL
Enumerable | TEXT | [SQLite3::Any](https://api.onyxframework.org/sql/Onyx/SQL/Converters/SQLite3/Any.html)
Enum | INTEGER | [SQLite3::EnumInt](https://api.onyxframework.org/sql/Onyx/SQL/Converters/SQLite3/EnumInt.html)
Enumerable(Enum) | TEXT | [SQLite3::EnumInt](https://api.onyxframework.org/sql/Onyx/SQL/Converters/SQLite3/EnumInt.html)
Enum | TEXT | [SQLite3::EnumText](https://api.onyxframework.org/sql/Onyx/SQL/Converters/SQLite3/EnumText.html)
Enumerable(Enum) | TEXT | [SQLite3::EnumText](https://api.onyxframework.org/sql/Onyx/SQL/Converters/SQLite3/EnumText.html)
JSON* | TEXT | [SQLite3::JSON](https://api.onyxframework.org/sql/Onyx/SQL/Converters/SQLite3/JSON.html)
UUID | BLOB | [SQLite3::UUIDBlob](https://api.onyxframework.org/sql/Onyx/SQL/Converters/SQLite3/UUIDBlob.html)
UUID | TEXT | [SQLite3::UUIDText](https://api.onyxframework.org/sql/Onyx/SQL/Converters/SQLite3/UUIDBlob.html)

\* `0` for `false`, `1` for `true`<br>
\*\* Stored in [`SQLite3::DATE_FORMAT`](https://github.com/crystal-lang/crystal-sqlite3/blob/master/src/sqlite3.cr#L5)<br>
\*\*\* Any type with `#to_json` and `.from_json` method, e.g. [JSON::Serializable](https://crystal-lang.org/api/0.27.2/JSON/Serializable.html). Note that `Enumerable` (e.g. `Array(String)` or `Hash(String, String)`) won't work in this case, use custom serializable struct instead

#### `crystal-pg` types

Shard homepage: [will/crystal-pg](https://github.com/will/crystal-pg)

Crystal type | Postgres type | Required converter
--- | --- | --- | ---
Bool | BOOLEAN
Float32 | REAL
Float64 | FLOAT8
Int16 | SMALLINT | [PG::Any](https://api.onyxframework.org/sql/Onyx/SQL/Converters/PG/Any.html)
Int32 | INTEGER
Int64 | BIGINT
Bytes | BYTEA
String | TEXT, CHAR etc.
Time | TIME, TIMESTAMP etc.
Nil | NULL
Enumerable* | *varies* | [PG::Any](https://api.onyxframework.org/sql/Onyx/SQL/Converters/PG/Any.html)
Enum, Enumerable(Enum) | ENUM | [PG::Enum](https://api.onyxframework.org/sql/Onyx/SQL/Converters/PG/Enum.html)
JSON** | JSON | [PG::JSON](https://api.onyxframework.org/sql/Onyx/SQL/Converters/PG/JSON.html)
JSON** | JSONB | [PG::JSONB](https://api.onyxframework.org/sql/Onyx/SQL/Converters/PG/JSONB.html)
UUID | BLOB | [PG::UUID](https://api.onyxframework.org/sql/Onyx/SQL/Converters/PG/UUID.html)

\* Actual type depends on enumerable type (e.g. `int[]` for `Array(Int32)`)<br>
\*\* Any type with `#to_json` and `.from_json` method, e.g. [JSON::Serializable](https://crystal-lang.org/api/0.27.2/JSON/Serializable.html). Note that `Enumerable` (e.g. `Array(String)` or `Hash(String, String)`) won't work in this case, use custom serializable struct instead

#### `crystal-mysql` types

Shard homepage: [crystal-lang/crystal-mysql](https://github.com/crystal-lang/crystal-mysql)

TODO: Fill the MySQL table.

### `key` option

By default Onyx::SQL uses the column name equal to the field name (i.e. `name` column for `type name : String` field), but you can change this behavior with the `key:` option:

```crystal
class User
  schema users do
    type name : String, key: "the_name"
  end
end

User.select(:name)
```

```sql
SELECT users.the_name FROM users
```

This affects the SQL requests only, without changing the field name. So it should not affect your Crystal code (i.e. [Query](/sql/query) methods will still require `name` argument).

### `not_null` option

Setting this option to `true` makes impossible to call certain Query methods with nilable values, for example:

```sql
CREATE TABLE users (
  name  TEXT  NOT NULL
);
```

```crystal
class User
  schema users do
    type name : String, not_null: true
  end
end

User.insert(name: nil) # Compilation-time error
```

However, it does **not** affect model getters, they are still nilable.

### `default` option

If `default` option is set to `true`, then whenever a field is `nil`, it is ignored on inserting, allowing the database to set the column to the `DEFAULT` value:

```sql
CREATE TABLE users (
  created_at  TIMESTAMPTZ NOT NULL  DEFAULT now()
);
```

```crystal
class User
  schema users do
    type name : String, not_null: true
    type created_at : Time, not_null: true, default: true
  end
end

User.new.insert(name: "John")
```

```sql
INSERT INTO users (name) VALUES (?)
```

## Reference

You may have noticed in the example above that mapping references is pretty intuitive as well.  A reference is determined by the type, i.e. the compiler knows that `Post` is an `Onyx::SQL::Model` too, so `type posts : Array(Post)` is treated as a reference instead of a field. For the sake of tutorial, here is reduced code from above:

```sql
CREATE TABLE users (
  id          SERIAL      PRIMARY KEY,
);

CREATE TABLE tags (
  id      SERIAL  PRIMARY KEY,
);

CREATE TABLE posts (
  id          SERIAL  PRIMARY KEY,
  author_id   INT     NOT NULL  REFERENCES users(id),
  tag_ids     INT[]   NOT NULL  DEFAULT '{}',
);
```

```crystal
class User
  include Onyx::SQL::Model

  schema users do
    pkey id : Int32
    type posts : Array(Post), foreign_key: "author_id"
  end
end

class Tag
  include Onyx::SQL::Model

  schema tags do
    pkey id : Int32, converter: PG::Any(Int32)
    type posts : Array(Post), foreign_key: "tag_ids"
  end
end

class Post
  include Onyx::SQL::Model

  schema posts do
    pkey id : Int32
    type author : User, not_null: true, key: "author_id"
    type tags : Array(Tag), not_null: true, default: true, key: "tag_ids"
  end
end
```

In Onyx::SQL, there are four types of references:

1. Singular direct (`author` reference of `Post`)
2. Singular foreign (none in this example, but it is essentialy a one-to-one)
3. Enumerable direct (`tags` reference of `Post`)
4. Enumerable foreign (`posts` reference of `User` and `posts` reference of `Tag`)

If a refernce has `key` option, then it is **direct**. Otherwise, if it has `foreign_key` option, it is **foreign**.

### Direct references

Direct reference should be understood as the following:

> This model stores an another model (or self) reference in this instance variable and the reference column in databse is determined by the `:key` option of this variable.

Direct references are **automatically** preloaded whenever the column is present in the query result, for example in this query (queries will be introduced later in the docs):

```crystal
post = Post.where(id: 1)
pp post # <Post @author=<User @id=42 @name=nil> @content="...">
```

Note that the `@author` reference is present, but it only has primary key set, because the `author_id` column is selected in the query. To fetch more of the author's values, use joins (don't worry, you'll learn more about joins later in [Queries](/sql/queries) section):

```crystal
post = Post.where(id: 1).join(:author) { |x| x.select(:id, :name) }
pp post # <Post @author=<User @id=42 @name="John"> @content="...">
```

::: tip
You should explicitly specify all reference's fields to join. For example, if you did `x.select(:name)` instead, the author's `@id` variable would be `nil`.
:::

However, you cannot preload direct **enumerable** references using joins, as it makes no sense, i.e. a single post row cannot hold an arbitrary amount of tag values. But the primary keys are still preloaded by default:

```crystal
post = Post.where(id: 1)
pp post # <Post @tags=[<Tag @id=1 @content=nil>, ...]>
```

### Foreign references

Foreign references are which refer to this model from their tables. You can join them as well:

```crystal
user = User.join(:post){ |x| x.select(Post).where(id: 1) }
pp user # <User @id=42 @name="John" @posts=[<Post @id=1 @content="...">]>
```

---
sidebarDepth: "2"
---

# Query

Onyx::SQL includes **type-safe** SQL query builder which implements most of common SQL. In fact, its syntax resembles SQL, but allows to create queries with fields and references instead of raw SQL columns. Moreover, the builder will raise meaningful errors in compilation time if you, for example, tried to pass a wrong argument type to the query. However, there are some cases where the builder is not fully type safe, they will be highlighted like this:

::: danger UNSAFE
*Description of why is it unsafe.*
:::

## Getting started

The builder is a `Query(T)` *struct*, for example, `Query(User)`:

```crystal
query = Query(User).new
```

To start building the query, call some methods on it:

```crystal
query = Query(User).new.select(:name).where(id: 42)
```

All its methods return `self`, so the calls are chainable.

::: danger NOTE

Keep in mind that `Query(T)` is a **struct**, so you must not do this:

```crystal
query = Query(User).new.select(:name)
query.where(id: 42) # You're calling it on a `query` copy, not itself
query # Doesn't have "where(id: 42)"
```

To avoid such behaviour, either always chain the queries or do like this:

```crystal
query = Query(User).new.select(:name)
query = query.where(id: 42)
query # Actually has "where(id: 42)"
```

:::

A query instance has `#build` and `#to_s` methods. The first one returns a tuple of resulting SQL query and DB-ready params, the second returns the SQL query only:

```crystal
# A empty query builds into a "select all" query
Query(User).new.build == {"SELECT users.* FROM users", []}
Query(User).new.to_s == "SELECT users.* FROM users"

query = Query(User).new.select(:name).where(id: 42)
query.build == {"SELECT users.name FROM users WHERE id = ?", [42]}
query.to_s == "SELECT users.name FROM users WHERE id = ?"
```

Note that all values in SQL string are replaced with `?`. It is made to prevent SQL injections. However, in PostgreSQL variables are denoted in `$1`, `$2`, `$n` style. To build a query with PostgreSQL-type params, pass `true` option to these methods:

```crystal
query = Query(User).new.select(:name).where(id: 42)
query.build(true) == {"SELECT users.name FROM users WHERE id = $1", [42]}
query.to_s(true) == "SELECT users.name FROM users WHERE id = $1"
```

Or replace the question marks manually with this simple script:

```crystal
# TODO:
```

You can use a query with raw [`DB`](http://crystal-lang.github.io/crystal-db/api/0.5.1/DB.html) instance:

```crystal
db = DB.open(ENV["DATABASE_URL"])
query = Query(User).new.select(:name).where(id: 42)

# We use splat, as Query#build returns a tuple of two
user = User.from_rs(db.query(*query.build)).first?

# Equals to the previous one
user = User.from_rs(db.query(query.build[0], query.build[1])).first?
```

::: tip
The [`.from_rs`](https://api.onyxframework.org/sql/Onyx/SQL/Serializable.html#from_rs%28rs%3ADB%3A%3AResultSet%29%3AArray%28self%29-class-method) method is present in all models and it allows to initialize **an array** of such models from a [`DB::ResultSet`](http://crystal-lang.github.io/crystal-db/api/0.5.1/DB/ResultSet.html).
:::

But it is more convenient to make use of [Repository](/sql/repository), which wraps the DB connection, automatically builds query (with knowledge of the underlying DB driver, therefore passing `true` to the `Query#build` if needed) and maps the result to model instances.

```crystal
require "onyx/sql"

Onyx.repo # <= This guy

# You can either use the `Onyx.repo` instance
Onyx.repo.query()
Onyx.repo.exec()
Onyx.repo.scalar()

# Or better use shorcuts:
Onyx.query()
Onyx.exec()
Onyx.scalar()
```

::: warning REMINDER
Remember that once you've required `"onyx/sql"`, the `DATABASE_URL` environment variable **must be set** (put one in `.env.development.local` file, for example).
:::

We will use the shortcut version in the examples:

```crystal
user = Onyx.query(Query(User).new.select(:name).where(id: 42)).first?
```

Great, no need to worry neither about `DB` nor about `?` and `$n`. But it looks kinda long, doesn't it? Worry not, all models include query shortcuts:

```crystal
user = Onyx.query(User.select(:name).where(id: 42)).first?
```

That's what we're talking about! The quality of life must be much higher right now. Of course, you can use the shortcuts outside the repository, they expand to regular `Query(T)` instances:

```crystal
User.where(id: 42) == Query(User).new.where(id: 42)
```

## Changeset

To track changes made to a model instance, a concept of *changeset* exists. When you call the `instance.changeset` method, its snapshot is created:

```crystal
user = User.new(id: 1, name: "John", age: 18)
changeset = user.changeset
```

You can then make updates to the changeset, and they would **not** affect the original model instance:

```crystal
changeset.update(name: "Jake")
pp user.name # Still "John"
```

To get the changeset changes, use the... `Changeset#changes` method:

```crystal
changeset.changes # {"name"=>"John"}
```

Changeset is particularly useful with the `Model#update` method, read below.

## Model instance shortcuts

Models have a number of convenient query builder shortcuts. None of them actually make a query to a database, they only help to build `Query(T)` instances faster.

### insert shortcut

Use it to generate an insertion query for this model instance:

```crystal
user = User.new(name: "John")
user.insert == User.insert(id: nil, name: "John", created_at: nil)

user = Onyx.query(user.insert.returning(User)).first
pp user # <User @id=1 @name="John" created_at=<Time ...>>
```

Note the `nil` values. `Query#insert` will ignore them if a field or reference has the `default: true` option, effectively allowing the database to take care of default values.

::: danger UNSAFE
In case if `User` schema has a field or reference with `not_null` option set to `true` and you're calling the `#insert` shortcut while this field is `nil`, then the [`NilAssetionError`](https://crystal-lang.org/api/0.27.2/NilAssertionError.html) will be raised in **runtime**! For example:

```crystal
class User
  schema users do
    type name : String, not_null: true
  end
end

user = User.new
user.insert # NilAssetionError, because `@name` is `nil`
```

:::

::: danger UNSAFE
If you're inserting a reference instance and its primary key is `nil`, then the [`NilAssetionError`](https://crystal-lang.org/api/0.27.2/NilAssertionError.html) will be raised in **runtime**! For example:

```crystal
class User
  schema users do
    pkey id : Int32
  end
end

class Post
  schema posts do
    type author : User
  end
end

post = Post.new(author: User.new)
post.insert # NilAssetionError, because `@author.id` is `nil`
```

It doesn't matter if reference has the `not_null` option or not.
:::

### update shortcut

The `Model#update` shortcut allows to conveniently update a model with actual changes. It has a mandatory `Changeset` argument:

```crystal
user = User.new(id: 1, name: "John", age: 18)

changeset = user.changeset
changeset.update(name: "Jake")

user.update(changeset) == User.update.set(name: "Jake").where(id: 1)
Onyx.exec(user.update(changeset))
```

::: danger UNSAFE
This shortcut **requires** the primary key value to be set in the model instance, otherwise raising the [`NilAssetionError`](https://crystal-lang.org/api/0.27.2/NilAssertionError.html) in **runtime**.

```crystal
user = User.new(name: "John", age: 18) # `id:` is skipped

changeset = user.changeset
changeset.update(name: "Jake")

user.update(changeset) # NilAssetionError
```

:::

::: danger UNSAFE
This method would also raise [`NoChangesError`](https://api.onyxframework.org/sql/Onyx/SQL/Model/Changeset/NoChanges.html) if the changeset is empty:

```crystal
user = User.new(id: 1, name: "John", age: 18)
changeset = user.changeset
user.update(changeset) # NoChangesError
```

:::

### delete shortcut

The `Model#delete` shortcut is very simple, it generates a deletion query for this model:

```crystal
user = User.new(id: 1)
user.delete == User.delete.where(id: 1)
```

::: danger UNSAFE
This shortcut **requires** the primary key value to be set in the model instance, otherwise raising the [`NilAssetionError`](https://crystal-lang.org/api/0.27.2/NilAssertionError.html) in **runtime**.

```crystal
user = User.new
user.delete # NilAssetionError
```

:::

## Methods

Here goes a comprehensive list of all `Query(T)` methods:

### insert

Generates an `INSERT` query.

```crystal
User.insert(name: "John", age: 18).build ==
  {"INSERT INTO users (name, age) VALUES (?, ?)", ["John", 18]}
```

If a field of reference has the `default: true` option **and** its value `nil` (or absent), then it is ignored, allowing the database to handle the default value by itself:

```crystal
class User
  schema users do
    pkey id : Int32 # `pkey` implicitly has `default: true`
    type name : String
    type created_at : Time, default: true
  end
end

User.insert(id: nil, name: "John", created_at: nil).build ==
  {"INSERT INTO users (name) VALUES (?)", ["John"]}
```

You can also insert a reference:

```crystal
class User
  schema users do
    pkey id : Int32
  end
end

class Post
  schema posts do
    type author : User, key: "author_id"
  end
end

Post.insert(author: User.new(id: 1)).build ==
  {"INSERT INTO posts (author_id) VALUES (?)", [1]}
```

::: danger UNSAFE

If you're inserting a reference and its primary key is `nil`, then the [`NilAssetionError`](https://crystal-lang.org/api/0.27.2/NilAssertionError.html) will be raised in **runtime**!

```crystal
Post.insert(author: User.new) # NilAssetionError, because `author.id` is `nil`
```

You can use the explicit reference key instead:

```crystal
Post.insert(author_id: 1)   # OK
Post.insert(author_id: nil) # Compilation-time error
```

:::

Also see the [`Model#insert` shortcut](#insert-shortcut).

### update

Marks the query as `UPDATE` one. It *requires* at least one [`set`](#set) afterwards.<br>Also see the [`Model#update` shortcut](#update-shortcut).

### set

Adds `SET` clauses to the `UPDATE` query. It works with fields and references:

```crystal
Post.update.set(content: "Blah", author: User.new(id: 1)).where(id: 42) ==
  {"UPDATE posts SET content = ?, author_id = ? WHERE id = ?", ["Blah", 1, 42]}
```

::: danger UNSAFE

If you're updating a reference and its primary key is `nil`, then the [`NilAssetionError`](https://crystal-lang.org/api/0.27.2/NilAssertionError.html) will be raised in **runtime**!

```crystal
Post.update(author: User.new).where(id: 42) # NilAssetionError, because `author.id` is `nil`
```

You can use the explicit reference key instead:

```crystal
Post.update.set(author_id: 1)   # OK
Post.update.set(author_id: nil) # Compilation-time error
```

:::

With explicit SQL clause (obviously **unsafe**):

```crystal
User.update.set("salary = salary * 2").build ==
  {"UPDATE users SET salary = salary * 2", []}
```

With clause and params (obviously **unsafe**, because params are **not validated**):

```crystal
User.update.set("salary = ?", 10_000).where(id: 1) ==
  {"UPDATE users SET salary = ? WHERE id = ?", [10_000, 1]}
```

### returning

::: warning

SQLite does **not** support `RETURNING` statements. To get inserted IDs, use [`DB::ExecResult#last_insert_id`](http://crystal-lang.github.io/crystal-db/api/latest/DB/ExecResult.html#last_insert_id%3AInt64-instance-method) method instead.

:::

With fields:

```crystal
User.insert(name: "Alice").returning(:id).build ==
  {"INSERT INTO users (name) VALUES (?) RETURNING users.id", ["Alice"]}
```

::: tip

If you get a error like `No overload matches Query(User)#returning with Symbol, Symbol`, then you have almost certainly made a typo in the field name, so double-check it.

:::

With explicit columns:

```crystal
User.insert(name: "Alice").returning("id").build ==
  {"INSERT INTO users (name) VALUES (?) RETURNING id", ["Alice"]}
```

::: danger UNSAFE

A `DB` error will be raised if the explicit column to return does not exist.

:::

With model class (equivalent of explicit `"*"`"):

```crystal
User.insert(name: "Alice").returning(User).build ==
  {"INSERT INTO users (name) VALUES (?) RETURNING users.*", ["Alice"]}
```

You can mix argument types for this method, for example `returning(:id, "foo", User)`.

### select

With fields and references:

```crystal
User.select(:name).where(id: 1).build ==
  {"SELECT users.name FROM users WHERE id = ?", [1]}
```

::: tip

If you get a error like `No overload matches Query(User)#returning with Symbol, Symbol`, then you have almost certainly made a typo in the field name, so double-check it.

:::

With explicit columns:

```crystal
User.select("name").where(id: 1).build ==
  {"SELECT name FROM users WHERE id = ?", [1]}
```

::: danger UNSAFE

A `DB` error will be raised if the explicit column to select does not exist.

:::

With model class (equivalent of explict `"*"`):

```crystal
User.select(User).where(id: 1).build ==
  {"SELECT users.* FROM users WHERE id = ?", [1]}
```

You can mix argument types for this method, for example `select(:id, "foo", User)`.

::: warning IMPORTANT

If no `select` is ever called for query, then `.select(self)` is assumed. To cancel this behaviour, call `select(nil)`. **WARNING:** This would raise in runtime if there is nothing to select at the moment of query building.

:::

### where

Appends a `WHERE` clause to the query.

With fields and references:

```crystal
User.select(:name).where(id: 1).build ==
  {"SELECT users.name FROM users WHERE id = ?", [1]}

Post.where(author: User.new(id: 1)).build ==
  {"SELECT posts.* FROM posts WHERE author_id = ?", [1]}
```

If called with multiple argument pairs, clauses concatenated with `AND`:

```crystal
User.select(:id).where(name: "John", age: 18).build ==
  {"SELECT users.id FROM users WHERE (name = ? AND age = ?)", [|John", 18]}
```

::: danger UNSAFE

If you're "wherying" by a reference and its primary key is `nil`, then the [`NilAssetionError`](https://crystal-lang.org/api/0.27.2/NilAssertionError.html) will be raised in **runtime**!

```crystal
Post.where(author: User.new) # NilAssetionError, because `author.id` is `nil`
```

You can use the explicit reference key instead:

```crystal
Post.where(author_id: 1)   # OK
Post.where(author_id: nil) # Compilation-time error
```

:::

With explicit SQL clause (obviously **unsafe**):

```crystal
User.where("balance IS NOT NULL").build ==
  {"SELECT users.* FROM users WHERE balance IS NOT NULL", []}
```

With clause and explict params (obviously **unsafe**, because params are **not validated**):

```crystal
User.where("age > ?", 18).build ==
  {"SELECT users.* FROM users WHERE age > ?", [18]}
```

You can chain `WHERE` clauses with `where_not`, `and_where`, `and_where_not`, `or_where`, `or_where_not` methods, which have the same arguments.

### join

You can join references with block, which yields a sub-query, which in turn would be merged with the main one. In the following example we query all posts from author with ID 1:

```crystal
posts = Onyx.query(Post
  .join(author: true) do |x|
    x.where(id: 1)
  end
)
```

This would generate this SQL query:

```sql
SELECT posts.*
FROM posts
JOIN users AS author ON users.id = posts.author_id
WHERE author.id = ?
```

::: tip

If *parent* query hasn't had any `#select` calls **before** the join with *sub-query*, then it is called with `#select(self)` (i.e. `#select(Post)` in this example). This is made to avoid redundant columns fetching.

:::

Fetched posts would have `@author` variable set to a `User` instance with `@id` variable set to the actual author's ID:

```crystal
pp posts.first # #<Post @id=42, @content="Blah", @author=#<User @id=1, @name=nil>>
```

There is no magic here, because `author_id` column is included into `posts.*`, that why the ORM updates the reference instance. If you want to fetch other author's fields, then call `select` method on the sub-query (which is in fact a `Query(User)` instance):

```crystal
posts = Onyx.query(Post
  .join(author: true) do |x|
    x.select(:name)
    x.where(id: 1)
  end
)
```

```sql
SELECT posts.*, author.name
FROM posts
JOIN users AS author ON users.id = posts.author_id
WHERE author.id = ?
```

```crystal
pp posts.first # #<Post @id=42, @content="Blah", @author=#<User @id=1, @name="John">>
```

::: tip

Only `where`, `select`, `join` and `order_by` methods are merged in the parent query.

:::

You can do nested joins as well:

```crystal
posts = Onyx.query(Post
  .join(author: true) do |x|
    x.join(settings: true) do |y|
      y.select(:foo)
      y.where(active: true)
    end
  end
)
```

```sql
SELECT posts.*, settings.foo
FROM posts
JOIN users AS author ON users.id = posts.author_id
JOIN settings AS settings ON settings.id = author.id
WHERE author.id = ? AND settings.active = ?
```

::: tip

Unlike the parent query, if sub-query doesn't have the `#select` method ever called, then it is treated as "do not select anything from the joined table".

:::

You can also omit the block completely, which could be useful for middle-joins without additional selects:

```crystal
Post.join(:tags).build ==
  {"SELECT posts.* FROM posts JOIN tags AS tags ON tags.id IN posts.tag_ids", []}
```

The last but not least, you can join explicit tables, which is obviously **unsafe**:

```crystal
Post.join("mytable", on: "mytable.id = posts.mytable_id").build ==
  {"SELECT posts.* FROM posts JOIN mytable ON mytable.id = posts.mytable_id", []}
```

### group_by

`GROUP BY` clause is usually applied to columns in specific tables with joins, therefore it supports an explicit SQL syntax only, which is **unsafe**. In this example, we query posts which have more than 1 tag:

```crystal
Post.join(:tags).group_by("posts.id").having("count(tags.id) > 1")
```

```sql
SELECT posts.*
FROM posts
JOIN tags AS tags ON posts.tag_ids @> tags.id
GROUP BY posts.id
HAVING count(tags.id) > 1
```

### having

`HAVING` clause is usually applied to `GROUP BY` clauses or specific columns with joins, therefore it supports an explicit SQL syntax only, which is **unsafe**. In this example, we query posts which have more than 1 tag:

```crystal
Post.join(:tags).group_by("posts.id").having("count(tags.id) > 1")
```

```sql
SELECT posts.*
FROM posts
JOIN tags AS tags ON posts.tag_ids @> tags.id
GROUP BY posts.id
HAVING count(tags.id) > 1
```

You can also use a clause with explict params (they are **not validated**):

```crystal
ditto.having("count(tags.id) > ?", 1)
```

You can chain `HAVING` clauses with `having_not`, `and_having`, `and_having_not`, `or_having`, `or_having_not` methods, which have the same arguments.

### limit

Appends `LIMIT` clause:

```crystal
User.limit(1).build ==
  {"SELECT users.* FROM users LIMIT 1", []}
```

You can call `limit(nil)` to remove the `LIMIT` clause.

### offset

Appends `OFFSET` clause:

```crystal
User.offset(1).build ==
  {"SELECT users.* FROM users OFFSET 1", []}
```

You can call `offset(nil)` to remove the `OFFSET` clause.

### order_by

With field:

```crystal
User.limit(1).order_by(:id).build ==
  {"SELECT users.* FROM users LIMIT 1 ORDER BY users.id", []}
```

With explicit column (obviously **unsafe**):

```crystal
User.limit(1).order_by("id").build ==
  {"SELECT users.* FROM users LIMIT 1 ORDER BY id", []}
```

## Shortcuts

You can chain `where` and `having` calls with `and`, `or`, `and_not`, `or_not` methods depending on the latest call:

```crystal
where(name: "John").and(age: 18) == where(name: "John").and_where(age: 18)
```

Some more shortcuts:

```crystal
query.one == query.limit(1)
query.all == query.limit(nil)
```

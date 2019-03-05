---
sidebarDepth: "2"
---

# Query

Onyx::SQL::Query is a type-safe SQL query builder.

## Methods list

### `insert`

```crystal
User.insert(name: "John", age: 18)
```

```sql
INSERT INTO users (name, age) VALUES (?, ?)
```

### `update`

This method doesn't do anything on itself, but *requires* at least one [`set`](#set) afterwards.

### `set`

With fields and references:

```crystal
User.update.set(name: "Jake").where(id: 1)
```

```sql
UPDATE users SET name = ? WHERE id = ?
```

With explicit SQL clause (unsafe):

```crystal
User.update.set("salary = salary * 2")
```

```sql
UPDATE users SET salary = salary * 2
```

With clause and params (unsafe):

```crystal
User.update.set("salary = ?", 10_000).where(id: 1)
```

```sql
UPDATE users SET salary = ? WHERE id = ?
```

### `returning`

::: warning
SQLite does **not** support `RETURNING` statements. To get inserted IDs, use [`DB::ExecResult#last_insert_id`](http://crystal-lang.github.io/crystal-db/api/latest/DB/ExecResult.html#last_insert_id%3AInt64-instance-method) method instead.
:::

With fields:

```crystal
User.insert(name: "Alice").returning(:id)
```

```sql
INSERT INTO users (name) VALUES (?) RETURNING id
```

With explicit columns (unsafe):

```crystal
User.insert(name: "Alice").returning("id")
```

```sql
INSERT INTO users (name) VALUES (?) RETURNING id
```

With model class (equivalent of `"*"`):

```crystal
User.insert(name: "Alice").returning(User)
```

```sql
INSERT INTO users (name) VALUES (?) RETURNING users.*
```

You can mix argument types for this method, for example `returning(:id, "foo", User)`.

### `select`

With fields and references:

```crystal
User.select(:name).where(id: 1)
```

```sql
SELECT users.name FROM users WHERE id = ?
```

With explicit columns (unsafe):

```crystal
User.select("name").where(id: 1)
```

```sql
SELECT name FROM users WHERE id = ?
```

With model class (equivalent of `"*"`):

```crystal
User.select(User).where(id: 1)
```

```sql
SELECT users.* FROM users WHERE id = ?
```

You can mix argument types for this method, for example `select(:id, "foo", User)`. If no `select` is called for query, then `.select(self)` is assumed.

### `where`

With fields and references:

```crystal
User.select(:name).where(id: 42)
```

```sql
SELECT users.name FROM users WHERE id = ?
```

If called with multiple fields, clauses concatenated with `AND`:

```crystal
User.select(:id).where(name: "John", age: 18)
```

```sql
SELECT users.id FROM users WHERE (name = ? AND age = ?)
```

With explicit SQL clause (unsafe):

```crystal
User.where("balance IS NOT NULL")
```

```sql
SELECT users.* FROM users WHERE balance IS NOT NULL
```

With clause and params (unsafe):

```crystal
User.where("age > ?", 18)
```

```sql
SELECT users.* FROM users WHERE age > ?
```

You can chain `WHERE` clauses with `where_not`, `and_where`, `and_where_not`, `or_where`, `or_where_not` methods, which have the same arguments.

### `join`

You can join references with block, which yields a sub-query, which would be merged with the main one. In the following example we query all posts from author with ID 42:

```crystal
posts = Onyx.query(Post
  .select(:id, :content)
  .join(:author) do |x|
    x.select(:name)
    x.where(id: 42)
  end
)
```

```sql
SELECT posts.id, posts.content, author.name
FROM posts
JOIN users AS author ON users.id = posts.author_id
WHERE author.id = ?
```

Fetched posts would have `@author` variable set to a `User` instance with `@name` variable set to the actual author's name.

You can also omit the block, it could be useful for middle-joins without additional selects. In this example you may want to add the *`on`* argument for SQLite:

```crystal
Post.join(:tags)
```

```sql
SELECT posts.* FROM posts JOIN tags AS tags ON posts.tag_ids @> tags.id
```

The last but not least, you can join explicit tables, which is unsafe:

```crystal
Post.join("mytable", on: "mytable.id = posts.mytable_id")
```

```sql
SELECT posts.* FROM posts JOIN mytable ON mytable.id = posts.mytable_id
```

### `group_by`

`GROUP BY` clause is usually applied to columns in specific tables with joins, therefore it supports an explicit SQL syntax only, which is unsafe. In this example, we query posts which have more than 1 tag:

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

### `having`

`HAVING` clause is usually applied to `GROUP BY` clauses or specific columns with joins, therefore it supports an explicit SQL syntax only, which is unsafe. In this example, we query posts which have more than 1 tag:

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

You can also use clause with params:

```crystal
ditto.having("count(tags.id) > ?", 1)
```

You can chain `WHERE` clauses with `having_not`, `and_having`, `and_having_not`, `or_having`, `or_having_not` methods, which have the same arguments.

```sql
-- ditto
HAVING count(tags.id) > ?
```

### `limit`

```crystal
User.limit(1)
```

```sql
SELECT users.* FROM users LIMIT 1
```

You can call `limit(nil)` to remove the `LIMIT` clause.

### `offset`

```crystal
User.offset(1)
```

```sql
SELECT users.* FROM users OFFSET 1
```

You can call `offset(nil)` to remove the `OFFSET` clause.

### `order_by`

With field:

```crystal
User.limit(1).order_by(:id)
```

```sql
SELECT users.* FROM users LIMIT 1 ORDER BY users.id
```

With explicit column (unsafe):

```crystal
User.limit(1).order_by("id")
```

```sql
SELECT users.* FROM users LIMIT 1 ORDER BY id
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

# :primary_key is expanded correctly in compilation time, e.g. into `order_by(:id)`
query.first == query.order_by(:primary_key, :asc).one
query.last == query.order_by(:primary_key, :desc).one
```

# Serializable

TODO: You can include [`Onyx::SQL::Serializable`](https://api.onyxframework.org/sql/Onyx/SQL/Serializable.html) into any object to make it de-serializable **from** database. It is good for re-usable business objects, for example:

```crystal
struct PopularTag
  include Onyx::SQL::Serializable

  getter tag : String
  getter posts_count : Int32
end

sql <<-SQL
SELECT tag.content AS tag, count(posts.id) AS posts_count ...
SQL

pt = PopularTag.from_rs(db.query(sql))
# or
pt = Onyx.query(PopularTag, sql)
# or
pt = Onyx.query(PopularTag, Tag.join(:posts).etc)
```

::: tip PRO TIP
You can also put the querying logic within the object itself!

```crystal
struct PopularTag
  def query : String
    "SELECT tag.content AS tag, count(posts.id) AS posts_count ..."
  end
end
```
:::

Interesting fact: the [`Onyx::SQL::Model`](https://api.onyxframework.org/sql/Onyx/SQL/Model.html) module actually includes `Onyx::SQL::Serializable`!

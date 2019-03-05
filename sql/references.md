# References

TODO: On reference, the primary key field is read from the reference (for example, `author` reference in `Post` *knows* that its primary key is `id`, as it is a `User`).

TODO: You can use the reference in query builder, for example `Post.where(author: user)`. The primary key of the reference is automatically extracted and this is equivalent to `Post.where(author_id: user.id)`.

TODO: You can use reference in joins, and its even get preloaded. It also gets preloaded without join if it is a direct reference. For example, `Post.first` will return a `<Post @author=<User @id=1 @name=nil>>` if `author_id` is present in the result set. Note that `name` is nil because it is absent. To include the name, you can join it with `Post.first.join(author: true) { |x| x.select(:name) }`.

### `key` option

TODO: Set the column which holds the reference primary key. Must match the `foreign_key` option in the referenced schema. If it is specified, then the reference is *direct*. Direct references can be both singular and enumerable. Direct references are preloaded on full select, but only with their primary keys. If you want to preload more fields, use joins.

TODO: In the example above, `Post@author` is direct singular reference, `Post@tags` is direct enumerable reference.

TODO: Enumerable direct references apply some considerations on reference's primary key field. It must have a converter which would convert it to/from array.

### `foreign_key` option

TODO: Set the foreign table column which holds the reference primary key. Must match the `key` option in the referenced schema. If it is specified, then the reference is *foreign*. Foreign references can be both singular and enumerable. To preload foreign references, use joins.

TODO: In the example above, `User@posts` is foreign enumerable reference, `Tag@posts` is foreign enumerable reference too.

TODO: Foreign enumerable references may require using `converters` too.

### `not_null` option

TODO: See field

### `default` option

TODO: See field

## Converters

TODO:

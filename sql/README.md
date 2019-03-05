# Onyx::SQL

Onyx::SQL is a delightful SQL ORM. It provides tools to map models from an SQL database to your Crystal applications. It also has a convenient and type-safe SQL query builder. It currently does **not** include tools for migration or somehow else manipulating your databases. You can you [migrate.cr](https://github.com/vladfaust/migrate.cr), for example.

The ORM is designed to be as much database-agnotic as possible. It should work with any database shard implementing the [crystal-db](https://github.com/crystal-lang/crystal-db) interface. Currently these are [crystal-sqlite3](https://github.com/crystal-lang/crystal-sqlite3), [crystal-mysql](https://github.com/crystal-lang/crystal-mysql), [crystal-pg](https://github.com/will/crystal-pg) and [crystal-cassandra](https://github.com/kaukas/crystal-cassandra).

However, different databases handle types differently and all have their edges. For example, SQLite3 doesn't have arrays, but PostgreSQL has native support for them. To handle such situations, the concept of [converters](/sql/schema#converters) exists. Currently common converters for these shards only are included into the ORM: [crystal-sqlite3](/sql/cheatsheets/types#crystal-sqlite3), [crystal-pg](/sql/cheatsheets/types#crystal-pg). But it is quite simple to [implement custom converters](/sql/advanced/custom-converters) for a database you want.

## Installation

To add the Onyx::SQL functionality into your application, you must explicitly add the `onyx-sql` dependency into your `shard.yml` file along with `onyx` **and** the database shard you're planning to work with (for example, [crystal-pg](https://github.com/will/crystal-pg)):

```yaml
dependencies:
  onyx:
    github: onyxframework/onyx
    version: ~> 0.1.0
  onyx-sql:
    github: onyxframework/sql
    version: ~> 0.6.0
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

## Guide

The Onyx::SQL docs are split to these sections:

* [Schema](/sql/schema) describes the mapping
* [Query](/sql/query) introduces to the SQL Queries builder

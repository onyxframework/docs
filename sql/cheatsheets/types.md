# Types

Onyx::SQL is designed to be database-agnostic. However, different database shards have different types mapping. Below are convenient tables to help you map between SQL columns and Crystal types. To know more about converters, visit [the relevant section](/sql/schema#converters).

::: warning
These tables are not 100% correct. Shards may have their own considerations on types. Please consult with each shard to know more of its features. Improvements welcome!
:::

## `crystal-sqlite3`

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
\*\*\* Any type with `#to_json` and `.from_json` method, e.g. [JSON::Serializable](https://crystal-lang.org/api/0.27.2/JSON/Serializable.html)

## `crystal-pg`

Shard homepage: [will/crystal-pg](https://github.com/will/crystal-pg)

Crystal type | SQLite3 type | Required converter
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
JSON** | JSON, JSONB | [PG::JSON](https://api.onyxframework.org/sql/Onyx/SQL/Converters/PG/JSON.html)
UUID | BLOB | [PG::UUID](https://api.onyxframework.org/sql/Onyx/SQL/Converters/PG/UUID.html)

\* Actual type depends on enumerable type (e.g. `int[]` for `Array(Int32)`)<br>
\*\* Any type with `#to_json` and `.from_json` method, e.g. [JSON::Serializable](https://crystal-lang.org/api/0.27.2/JSON/Serializable.html)

## `crystal-mysql`

Shard homepage: [crystal-lang/crystal-mysql](https://github.com/crystal-lang/crystal-mysql)

TODO:

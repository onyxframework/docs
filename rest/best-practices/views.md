# Views best practices

Some tips and tricks on mastering [Views](/rest/views).

## Re-use JSON views in arrays

It is typical to have a endpoint which returns a single model instance under the `"user"` key and a endpoint which returns many under the `"users"` key. You can re-use the single instance view with `@nested` variable:

```crystal
struct Views::User
  include Onyx::REST::View

  def initialize(@user : Models::User, @nested = false)
  end

  json do
    object do
      unless @nested
        # If we're not within a nested JSON block,
        # then begin an object with `"user": {`
        field "user"
        start_object
      end

      field "id", @user.id
      field "name", @user.name

      unless @nested
        end_object # End the object with `}`
      end
    end
  end
end

struct Views::Users
  include Onyx::REST::View

  def initialize(@users : Array(Model::User))
  end

  json({
    users: @users.map do |user|
      Views::User.new(user, nested: true)
    end
  })
end
```

Which would result in:

```sh
> curl /user/1
{
  "user": {
    "id": 1,
    "name": "John"
  }
}
> curl /users
{
  "users": [
    {
      "id": 1,
      "name": "John"
    },
    {
      "id": 2,
      "name": "Jake"
    }
  ]
}
```

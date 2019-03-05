# Custom middleware

*This section is TODO:, you can help improving it.*

1. Write custom handlers which include `HTTP::Handler` module
2. Pass a block to `Onyx.listen` and alter the `handlers` array. See actual handlers in the [source code](https://github.com/onyxframework/onyx/blob/master/src/onyx/http.cr):

```crystal
Onyx.listen do |handlers|
  handlers.insert(2, MyHandler.new)
end
```

You can build your own custom server with absolutely custom middleware, see the [Server from scratch](/http/advanced/server-from-scratch) tutorial.

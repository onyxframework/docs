# Custom middleware

*This section is TODO:*

1. Write custom handlers which include `HTTP::Handler` module
2. Pass a block to `Onyx.listen` and alter the `handlers` array. See actual handlers in the [source code](https://github.com/onyxframework/onyx/blob/master/src/onyx/rest.cr):

```crystal
Onyx.listen do |handlers|
  handlers.insert(2, MyHandler.new)
end
```

If want to complete alter the middleware, see [Custom Server](/rest/advanced/custom-server) section.

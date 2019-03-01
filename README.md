---
sidebarDepth: "0"
---

# Onyx Framework

Onyx Framework is a web framework built on [Crystal, the Programming Language](https://crystal-lang.org). Crystal is, in turn, built on top of LLVM, which grants it speed comparable to C. Crystal syntax is heavily inspired by Ruby, which makes it perfect language to replace slow Ruby code in your applications.

In terms of comparison with existing Ruby frameworks, Onyx is inspired by [Hanami](https://hanamirb.org/). In fact, some concepts existing in Onyx were taken from it. For example, Action-View splitting, Action errors and params and also the SQL repository model.

## Design principles

Very deep in the architecture of the framework lies an idea to be perfect from engineering point of view — true SOLID, loosely coupled components and clean architecture. But these idioms may be tedious for newcomers both to language and the framework and also require to write more boilerplate code.

That's why there is also a goal to hide the complexity under beautiful DSL, but still be extendable and avaialble for more explict usage in the later stages of development cycle. The framework expands its limits with your knowledge of Crystal and your application needs.

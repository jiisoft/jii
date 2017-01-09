Jii [![Build Status](https://travis-ci.org/jiisoft/jii.svg)](https://travis-ci.org/jiisoft/jii)
====

[Jii](http://www.jiiframework.ru/) (JavaScript Yii) — Full-Stack JavaScript Framework architecture based on PHP Yii Framework v2

    npm install jii

Supported features
---

- Configuration
- Aliases
- Behaviours
- Events
- Base Model
- Validators
- ActiveRecord (sql, in development)
- Url Manager (routing)
- Basic HTTP Server
- Controllers with inline or instance actions

Bootstrap example
---

```js
require('jii');

Jii.createWebApplication();
```

Unit tests
---

```sh
nodeunit tests/unit
```

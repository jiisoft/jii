Jii
====

Jii (JavaScript Yii) — Full-Stack JavaScript Framework architecture based on PHP Yii Framework v2

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

    require('jii');
  
    Jii.createWebApplication({
      application: {
  		  basePath: __dirname
  	  }
    });

Unit tests
---

    nodeunit tests/unit
    nodeunit framework/data/sql/tests


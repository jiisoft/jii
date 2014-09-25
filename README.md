Jii
====

Jii (JavaScript Yii) — Full-Stack JavaScript Framework architecture based on PHP Yii Framework v2

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

Basic application
---

Basic application supplied with Jii Framework. Application represent is http server
with simple form and model with validation. Run application as:

    node apps/basic/index.js

After run, site will be available at http://localhost:3000/.

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


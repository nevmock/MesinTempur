('use strict');

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV!;
const config = require(__dirname + '/../configs/database.js')[env];
const db: any = {};

let sequelize: any;
if (config.use_env_variable) {
   sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
   sequelize = new Sequelize(
      config.database,
      config.username,
      config.password,
      config,
   );
}

fs.readdirSync(__dirname)
  .filter((file:any) => 
    file !== 'index.ts' &&
    file.endsWith('.ts') &&
    !file.endsWith('.d.ts')
  )
  .forEach((file:any) => {
    const modelModule = require(path.join(__dirname, file));
    const model = modelModule.default
      ? modelModule.default(sequelize, Sequelize.DataTypes)
      : modelModule(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });


Object.keys(db).forEach((modelName) => {
   if (db[modelName].associate) {
      db[modelName].associate(db);
   }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// db.sequelize.sync({ force: true });

export default db;

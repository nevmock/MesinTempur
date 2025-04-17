'use strict';
import { Model } from 'sequelize';

module.exports = (sequelize: any, DataTypes: any) => {
   class tbl_targets extends Model {
      /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
      static associate(models: any) {
         // define association here
      }
   }
   tbl_targets.init(
      {
         id_target: {
            type: DataTypes.INTEGER,
            primaryKey: true,
         },
         ig_username: DataTypes.STRING,
         id_admin: DataTypes.INTEGER,
         id_engine: DataTypes.INTEGER,
      },
      {
         sequelize,
         modelName: 'tbl_targets',
         underscored: true,
         createdAt: 'created',
         updatedAt: 'updated',
         freezeTableName: true,
         tableName: 'tbl_targets',
      },
   );
   return tbl_targets;
};

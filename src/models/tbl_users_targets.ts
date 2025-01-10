'use strict';
import { Model } from 'sequelize';

module.exports = (sequelize: any, DataTypes: any) => {
   class tbl_users_targets extends Model {
      /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
      static associate(models: any) {
         // define association here
         tbl_users_targets.hasMany(models.tbl_targets, {
            foreignKey: 'id_target',
         });
      }
   }
   tbl_users_targets.init(
      {
         id_user: {
            type: DataTypes.INTEGER,
            primaryKey: true,
         },
         id_target: {
            type: DataTypes.INTEGER,
            primaryKey: true,
         },
         category: DataTypes.STRING,
      },
      {
         sequelize,
         modelName: 'tbl_users_targets',
         underscored: true,
         createdAt: 'created',
         updatedAt: 'updated',
         freezeTableName: true,
         tableName: 'tbl_users_targets',
      },
   );
   return tbl_users_targets;
};

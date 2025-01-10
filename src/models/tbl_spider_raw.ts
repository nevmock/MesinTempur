'use strict';
import { Model } from 'sequelize';

module.exports = (sequelize: any, DataTypes: any) => {
   class tbl_spider_raw extends Model {
      /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
      static associate(models: any) {
         // define association here
      }
   }
   tbl_spider_raw.init(
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
         },
         date_time: DataTypes.DATE,
         media_name: DataTypes.TEXT,
         source_url: DataTypes.TEXT,
         title: DataTypes.TEXT,
         content: DataTypes.TEXT,
         sentiment: DataTypes.FLOAT,
         process_id: DataTypes.FLOAT,
         keyword_id: DataTypes.INTEGER,
         group_id: DataTypes.INTEGER,
         is_active: DataTypes.BOOLEAN,
         platform: DataTypes.STRING(50)
      },
      {
         sequelize,
         modelName: 'tbl_spider_raw',
         underscored: true,
         createdAt: 'created',
         updatedAt: 'updated',
         freezeTableName: true,
         tableName: 'tbl_spider_raw',
         charset: 'utf8mb4',
         collate: 'utf8_general_ci',
      },
   );
   return tbl_spider_raw;
};

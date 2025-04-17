'use strict';
import { Model } from 'sequelize';

module.exports = (sequelize: any, DataTypes: any) => {
   class news extends Model {
      /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
      static associate(models: any) {
         // define association here
      }
   }
   news.init(
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
         platform: DataTypes.STRING(50)
      },
      {
         sequelize,
         modelName: 'news',
         underscored: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         freezeTableName: true,
         tableName: 'news',
         charset: 'utf8mb4',
         collate: 'utf8_general_ci',
      },
   );
   return news;
};

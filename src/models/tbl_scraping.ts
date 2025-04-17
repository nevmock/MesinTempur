'use strict';
import { Model } from 'sequelize';

module.exports = (sequelize: any, DataTypes: any) => {
   class tbl_scraping extends Model {
      /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
      static associate(models: any) {
         // define association here
      }
   }
   tbl_scraping.init(
      {
         ig_username: {
            type: DataTypes.STRING,
         },
         url: DataTypes.TEXT,
         follower_count: DataTypes.INTEGER,
         like_count: DataTypes.INTEGER,
         comment_count: DataTypes.INTEGER,
         response_count: DataTypes.INTEGER,
         taken_at: DataTypes.DATE,
         completed: {
            type: DataTypes.BOOLEAN,
         },
         category: DataTypes.ENUM('M', 'L', 'H'),
         created: {
            field: 'created',
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
         updated: {
            field: 'updated',
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
      },
      {
         sequelize,
         modelName: 'tbl_scraping',
         underscored: true,
         createdAt: 'created',
         updatedAt: 'updated',
         freezeTableName: true,
         tableName: 'tbl_scraping',
         charset: 'utf8mb4',
         collate: 'utf8_general_ci',
      },
   );
   return tbl_scraping;
};

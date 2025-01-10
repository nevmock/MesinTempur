'use strict';
import { Model } from 'sequelize';

module.exports = (sequelize: any, DataTypes: any) => {
   class tbl_crawling extends Model {
      /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
      static associate(models: any) {
         // define association here
      }
   }
   tbl_crawling.init(
      {
         id_crawling: {
            type: DataTypes.INTEGER,
            primaryKey: true,
         },
         ig_username: DataTypes.STRING,
         url: DataTypes.STRING,
         follower_count: DataTypes.INTEGER,
         like_count: DataTypes.INTEGER,
         caption_text: DataTypes.STRING,
         taken_at: DataTypes.DATE,
         time_frame: DataTypes.INTEGER,
         is_extracted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
         },
         is_normalized: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
         },
         is_classified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
         },
      },
      {
         sequelize,
         modelName: 'tbl_crawling',
         underscored: true,
         createdAt: 'created',
         updatedAt: 'updated',
         freezeTableName: true,
         tableName: 'tbl_crawling',
         charset: 'utf8mb4',
         collate: 'utf8_general_ci',
      },
   );
   return tbl_crawling;
};

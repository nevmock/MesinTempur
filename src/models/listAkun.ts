'use strict';
import { Model } from 'sequelize';

module.exports = (sequelize: any, DataTypes: any) => {
   class listAkun extends Model {
      /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
      static associate(models: any) {
         // define association here
      }
   }
   listAkun.init(
      {
         list_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
         },
         platform: DataTypes.STRING,
         username: DataTypes.STRING,
         client_account: DataTypes.STRING,
         kategori: DataTypes.STRING,
      },
      {
         sequelize,
         modelName: 'listAkun',
         underscored: true,
         createdAt: false,
         updatedAt: false,
         freezeTableName: true,
         tableName: 'listAkun',
      },
   );
   return listAkun;
};

'use strict';
import { Model } from 'sequelize';

module.exports = (sequelize: any, DataTypes: any) => {
  // Define the iklan_report model extending Sequelize's Model class
  class iklan_report extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: any) {
      // Define associations between models here if needed
    }
  }

  // Initialize the iklan_report model
  iklan_report.init(
    {
      // Primary key column 'id'
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,  // This is the primary key for the table
      },
      // 'title' column for the report title, not null
      title: {
        type: DataTypes.TEXT, // Describes the ad report's title (e.g., ACOS percentage)
        allowNull: false,  // Title must be provided
      },
      // 'broad_cir' column for ad cost percentage (ACOS)
      broad_cir: {
        type: DataTypes.DOUBLE, // Ad cost percentage (ACOS)
        allowNull: false,  // Must not be null
      },
      // 'broad_gmv' column for ad sales amount
      broad_gmv: {
        type: DataTypes.BIGINT, // Sales generated by the ad
        allowNull: false,  // Cannot be null
      },
      // 'broad_roi' column for Return on Ad Spend (ROAS)
      broad_roi: {
        type: DataTypes.DOUBLE, // Return on Ad Spend (ROAS)
        allowNull: false,  // Cannot be null
      },
      // 'click' column for number of ad clicks
      click: {
        type: DataTypes.INTEGER, // Total number of clicks on the ad
        allowNull: false,  // Cannot be null
      },
      // 'cost' column for total ad cost
      cost: {
        type: DataTypes.BIGINT, // Total ad cost
        allowNull: false,  // Cannot be null
      },
      // 'cpc' column for cost per conversion
      cpc: {
        type: DataTypes.BIGINT, // Cost per conversion
        allowNull: false,  // Cannot be null
      },
      // 'cr' column for conversion rate
      cr: {
        type: DataTypes.DOUBLE, // Conversion rate
        allowNull: false,  // Cannot be null
      },
      // 'ctr' column for click-through rate
      ctr: {
        type: DataTypes.DOUBLE, // Click-through rate
        allowNull: false,  // Cannot be null
      },
      // 'direct_gmv' column for direct ad sales amount
      direct_gmv: {
        type: DataTypes.BIGINT, // Direct sales from the ad
        allowNull: false,  // Cannot be null
      },
      // 'impression' column for number of ad impressions
      impression: {
        type: DataTypes.INTEGER, // Total number of times the ad was viewed
        allowNull: false,  // Cannot be null
      },
      // 'avg_rank' column for average ranking of the ad
      avg_rank: {
        type: DataTypes.INTEGER, // Average ranking of the ad
        allowNull: false,  // Cannot be null
      },
      // 'start_time' column for the start time of the report
      start_time: {
        type: DataTypes.INTEGER, // Start time for the report (e.g., timestamp)
        allowNull: true,  // Cannot be null
      },
      // 'created_at' column for the timestamp when the record was created
      created_at: {
        type: DataTypes.STRING, // Record creation timestamp
        allowNull: true,  // Cannot be null
      },
      // 'updated_at' column for the timestamp when the record was last updated
      updated_at: {
        type: DataTypes.STRING, // Record update timestamp
        allowNull: true,  // Nullable as it may not be updated
      },
      // 'from_wib' column for the start time in WIB (Western Indonesia Time)
      from_wib: {
        type: DataTypes.STRING, // Start time in WIB
        allowNull: true,  // Cannot be null
      },
      // 'to_wib' column for the end time in WIB (Western Indonesia Time)
      to_wib: {
        type: DataTypes.STRING, // End time in WIB
        allowNull: true,  // Cannot be null
      },
    },
    {
      // Model options
      sequelize,
      modelName: 'iklan_report',  // Model name for Sequelize
      underscored: true,  // Use snake_case for column names
      freezeTableName: true,  // Prevent Sequelize from pluralizing the table name
      tableName: 'iklan_report',  // Table name in the database
      charset: 'utf8mb4',  // Character set for the table
      collate: 'utf8_general_ci',  // Collation for the table
      createdAt: true,  // Enable automatic creation of the createdAt field
      updatedAt: true,  // Enable automatic update of the updatedAt field
    },
  );

  // Return the model definition
  return iklan_report;
};

'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tbl_scraping_results', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_user: {
        type: Sequelize.INTEGER
      },
      id_target: {
        type: Sequelize.INTEGER
      },
      tiktok_username: {
        type: Sequelize.STRING
      },
      total_follower: {
        type: Sequelize.INTEGER
      },
      total_content: {
        type: Sequelize.INTEGER
      },
      total_engagement: {
        type: Sequelize.INTEGER
      },
      total_comment: {
        type: Sequelize.INTEGER
      },
      total_response: {
        type: Sequelize.INTEGER
      },
      per_follower: {
        type: Sequelize.DOUBLE
      },
      per_content_per_day: {
        type: Sequelize.DOUBLE
      },
      per_engagement_per_content: {
        type: Sequelize.DOUBLE
      },
      per_response: {
        type: Sequelize.DOUBLE
      },
      weight_follower: {
        type: Sequelize.DOUBLE
      },
      weight_content_per_day: {
        type: Sequelize.DOUBLE
      },
      weight_engagement_per_content: {
        type: Sequelize.DOUBLE
      },
      weight_response: {
        type: Sequelize.DOUBLE
      },
      total_score: {
        type: Sequelize.DOUBLE
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tbl_scraping_results');
  }
};
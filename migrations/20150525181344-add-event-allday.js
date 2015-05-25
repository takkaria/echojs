'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.addColumn(
          'events', 'allday', Sequelize.BOOLEAN
      );
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.removeColumn(
          'events', 'allday'
      );
  }
};

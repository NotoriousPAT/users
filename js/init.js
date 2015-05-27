// This file runs once and is solely responsible for initializing
// the application when it loads.
$(function () {
  'use strict';

  // Initialize application properties
  app.users = new app.ObjectStore('users', localStorage);

  // Tell backbone to process the current route
  Backbone.history.start();
});

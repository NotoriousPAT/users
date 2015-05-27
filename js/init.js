// This file runs once and is solely responsible for initializing
// the application when it loads.
$(function () {
  'use strict';

  // Initialize application properties
  app.users = new app.ObjectStore();

  // Kick off our initial route
  Backbone.history.loadUrl();
});

(function () {
  // When the url is #users
  app.router.route('users', userListController);

  // When the url is empty (the default route)
  app.router.route('', userListController);

  // The user list "controller" function
  function userListController () {
    app.show('user-list', { users: app.users });
  }
})();

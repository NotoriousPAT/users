app.router.route('users/new', function () {

  // Render the view
  app.show('user-edit', { user: new app.User(), title: 'New User' });

  // Bind our events
  app.bindUserForm(function (user) {
    app.users.add(user);
  });

});

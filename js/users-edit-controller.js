app.router.route('users/:id', function (id) {

  var user = app.users.getById(id);

  if (!user) {
    app.show('404', { url: location.hash });
    return;
  }

  // Render the view
  app.show('user-edit', {
    user: user,
    title: 'Edit User',
    isDeletable: true
  });

  // Bind our events
  app.bindUserForm(function (user) {
    app.users.update(id, user);
  });

  $('.delete-user').click(function () {
    app.users.remove(id);
    app.goto('users');
  });

});

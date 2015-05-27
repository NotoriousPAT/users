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
  $('.user-form').on('submit', function (e) {
    e.preventDefault();

    app.users.update(id, new app.User(app.serializeForm(this)));

    app.goto('users');
  });

  $('.delete-user').click(function () {
    app.users.remove(id);
    app.goto('users');
  });

});

app.router.route('users/:id', function (id) {

  var user = app.users.getById(id);

  // Render the view
  app.show('user-edit', user);

  // Bind our events
  $('.user-form').on('submit', function (e) {
    e.preventDefault();

    var editedUser = new app.User(
      $('input[name=id]').val(),
      $('input[name=name]').val(),
      $('input[name=email]').val()
    );

    user.id = editedUser.id;
    user.name = editedUser.name;
    user.email = editedUser.email;

    document.location = '#users';

  });

});

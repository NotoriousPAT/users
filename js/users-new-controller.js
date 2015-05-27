app.router.route('users/new', function () {

  // Render the view
  app.show('user-edit', { user: new app.User(), title: 'New User' });

  // Bind our events
  $('.user-form').parsley();
  
  $('.user-form').on('submit', function (e) {
    e.preventDefault();

    app.users.add(new app.User(app.serializeForm(this)));

    app.goto('users');
  });

});

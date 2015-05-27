app.router.route('users/new', function () {

  // Render the view
  app.show('user-new');

  // Bind our events
  $('.user-form').on('submit', function (e) {
    e.preventDefault();

    var user = new app.User(
      $('input[name=id]').val(),
      $('input[name=name]').val(),
      $('input[name=email]').val()
    );

    app.users.add(user);

    // The backbone alternative to document.location = '#users';
    Backbone.history.navigate('users', { trigger: true });

  });

});

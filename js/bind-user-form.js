app.bindUserForm = function (saveFn) {

  $('.user-form').on('submit', function (e) {
    e.preventDefault();

    saveFn(new app.User(
      $('input[name=id]').val(),
      $('input[name=name]').val(),
      $('input[name=email]').val()
    ))

    app.goto('users');

  });

};

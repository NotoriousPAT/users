app.router.route('users', function () {
  app.show('user-list', { users: app.users });
});

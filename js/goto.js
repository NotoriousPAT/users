app.goto = function (url) {
  Backbone.history.navigate(url, { trigger: true });
};

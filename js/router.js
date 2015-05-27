// Constructing a new instance of backbone's router
app.router = new Backbone.Router();

app.router.route('*404', function (badUrl) {
  app.show('404', { url: badUrl });
});

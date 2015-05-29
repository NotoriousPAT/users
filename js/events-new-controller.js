app.router.route('events/new', function () {

  // Render the view
  app.show('event-edit', { event: new app.Event(), title: 'New Event' });

  // Bind our events
  $('.event-form').parsley();

  $('.event-form').on('submit', function (e) {
    e.preventDefault();

    app.events.add(new app.Event(app.serializeForm(this)));

    app.goto('events');
  });

});

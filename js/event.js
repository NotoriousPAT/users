app.Event = function (spec) {
  spec = spec || {};

  this.id = spec.id;
  this.name = spec.name;
  this.street = spec.street;
  this.city = spec.city;
  this.state = spec.state;
  this.zip = spec.zip;
};

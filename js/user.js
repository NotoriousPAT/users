app.User = function (spec) {
  spec = spec || {};
  
  this.id = spec.id;
  this.name = spec.name;
  this.email = spec.email;
};

app.ObjectStore = function (key, storage) {
  this.key = key;
  this.storage = storage;
  this.all = this.load();
};

app.ObjectStore.prototype = {
  get values () {
    return _.values(this.all);
  },

  add: function (obj) {
    this.all[obj.id] = obj;
    this.save();
  },

  update: function (id, newValues) {
    this.remove(id);
    this.add(newValues);
    
    this.save();
  },

  getById: function (id) {
    return this.all[id];
  },

  remove: function (id) {
    delete this.all[id];
    this.save();
  },

  load: function () {
    return JSON.parse(this.storage.getItem(this.key) || '{}');
  },

  save: function () {
    this.storage.setItem(this.key, JSON.stringify(this.all));
  }
};

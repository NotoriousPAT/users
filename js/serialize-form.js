app.serializeForm = function (form) {
  var obj = {};

  $(form).find('input').each(function (i, input) {
    obj[input.name] = input.value;
  });

  return obj;
};

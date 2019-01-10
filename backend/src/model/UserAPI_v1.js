let mongoose = require('mongoose');

let userScheme = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  salt: String,
});
mongoose.model('User', userScheme);

module.exports = mongoose.model('User');
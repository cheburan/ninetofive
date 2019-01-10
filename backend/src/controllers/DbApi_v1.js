let mongoose = require('mongoose');
let config = require('config');

mongoose.connect(config.get('jwt.mongo.url'))
.then(data => {
  console.log('Connection to API DB has been established: ');
})
.catch(error =>{
  console.log('Cannot connect to API DB: ', error);
});
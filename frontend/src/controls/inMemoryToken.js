const cache = require('memory-cache-ttl');


module.exports = {
   saveToken: function(token) {
      console.log("Caching token");
      cache.set('token', token);
      cache.set('cache', 'true');
      console.log(cache.get('token'));

  }
};
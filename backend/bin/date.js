let config = require('config');

let dat = new Date();
console.log(dat);
console.log(dat.toISOString());
console.log(dat.getTimezoneOffset());



/*
* CONNECTION TO PRIMARY DB
* */
let pgp = require('pg-promise')({
  /* initialization options */
  capSQL: true // capitalize all generated SQL
});
let pgp_ps = require('pg-promise').PreparedStatement;
//establish connection
let pg_cn = config.get('Connector.pg_db');
let db = pgp(pg_cn);

db.none('UPDATE voice.public_messages SET new_comments = true, mod_time = $1 WHERE id=45', [dat])
.then(function (){
  console.log('Inserting and updated successfully');
})
    .catch(err=>{
      console.log(err);
});


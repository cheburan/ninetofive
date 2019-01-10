let fs = require('fs');
let parse = require('csv-parse');

// 0 - no hashing for storing emails
//1 - hashing for storing emails
const auth_type = 1;

let inputFile = process.argv[2]; //'config/csv_emails/brnd_add.csv';
//console.log(`Current directory: ${process.cwd()}`);
let config = require('config');
//require crypto-module;
const crypto = require('crypto');
let crypto_key = config.get('Crypto.sha512_key');


/**
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

/**
 *
 * CONNECTION TO TRACKING DB
 */

let pgp_track = require('pg-promise')({
  /* initialization options */
  capSQL: true // capitalize all generated SQL
});
let pgp_track_ps = require('pg-promise').PreparedStatement;
//establish connection
let pg_track_cn = config.get('Connector.pg_db_tracking');
let db_track = pgp_track(pg_track_cn);



function insertValidEmails() {
  console.log("Start Users Data uploding");
  //csv file with email, organisation - (just a number0 and type (user/admin/suppa admin)
  let csvData=[];
  fs.createReadStream(inputFile)
  .pipe(parse({delimiter: ','}))
  .on('data', function(csvrow) {
    //console.log(csvrow);
    //do something with csvrow
    csvData.push({email: csvrow[0].toLowerCase().replace(/\s+/g, ''), organisation: parseInt(csvrow[1]), type: parseInt(csvrow[2])});
  })
  .on('end',function() {

    let table = new pgp.helpers.TableName('valid_email', 'voice');
    console.log(csvData);
    const query = pgp.helpers.insert(csvData, ['email', 'organisation', 'type'], table);
    db.none(query)
    .then((data, err)=>{
      if (err) {
        reject(err);
      } else console.log('Users Data Inserted Succesfully');
    })
    .catch(error =>{
      console.log('Error: ', error);
    });


  });

}

/**
 * Use this function if the hash storing in DB is OFF (auth_type=0) in order to hash tracking data (hashed emails in vociapp_tracking) before inserting in DB)
 * @param email - email to hash
 * @return {*}
 */
function emailHash(email) {
  if (auth_type === 0){
    //create Hmac
    let hash = crypto.createHmac('sha512', crypto_key);
    hash.update(email);
    return (hash.digest('hex'))
  } else {
    return email
  }
}

/**
 * Use this function if the hash storing in DB is ON (auth_type=1) in order to hash emails before inserting in DB)
 * @param email - email to hash
 * @return {*}
 */
function emailHashOnInsert(email) {
  if (auth_type === 1){
    //create Hmac
    let hash = crypto.createHmac("sha512", crypto_key);
    hash.update(email);
    return (hash.digest("hex"))
  } else {
    return email
  }
}


function insertTrackingData() {
  //csv file for tracking with email_hash, classification of position, and possibly gender_clasiffication
  let csvTrackData=[];
  fs.createReadStream(inputFile)
  .pipe(parse({delimiter: ','}))
  .on('data', function(csvrow) {

    //do something with csv
    csvTrackData.push({hash: emailHash(csvrow[0].toLowerCase().replace(/\s+/g, "")), class_position: csvrow[3].toLowerCase().replace(/\s+/g, ''), class_gender: csvrow[4].toLowerCase().replace(/\s+/g, '')});
  })
  .on('end',function() {

    let table = new pgp_track.helpers.TableName('tracking_user_classification', 'voice');
    const query = pgp_track.helpers.insert(csvTrackData, ['hash', 'class_position', 'class_gender'], table);
    db_track.none(query)
    .then((data, err)=>{
      if (err) {
        reject(err);
      } else console.log(' Tracking Data Inserted Succesfully');
    })
    .catch(error =>{
      console.log('Error: ', error);
    });


  });
}


function insertValidEmailsWothCheck() {
  console.log("Start Users Data uploding");
  //csv file with email, organisation - (just a number0 and type (user/admin/suppa admin)
  //let csvData=[];
  fs.createReadStream(inputFile)
  .pipe(parse({delimiter: ','}))
  .on('data', function(csvrow) {
    //console.log(csvrow);
    //do something with csvrow
    const find_user = new pgp_ps("find-user", "SELECT id FROM voice.valid_email WHERE email = $1 LIMIT 1");
    const insert_valid_email = new pgp_ps("insert-valid-email", "INSERT INTO voice.valid_email (email, organisation, type) VALUES ($1, $2, $3) RETURNING id");
    const insert_tracking = new pgp_track_ps("insert-tracking", "INSERT INTO voice.tracking_user_classification (hash, class_position, class_gender) VALUES ($1, $2, $3) RETURNING id");

    db.any(find_user, [csvrow[0].toLowerCase().replace(/\s+/g, '')])
    .then(data =>{
      if (data && data.length > 0){
        console.log("User with email ", csvrow[0].toLowerCase().replace(/\s+/g, ''), " already there");
      }
      else {
        db.one(insert_valid_email, [emailHashOnInsert(csvrow[0].toLowerCase().replace(/\s+/g, '')), parseInt(csvrow[1]), parseInt(csvrow[2])])
            .then(data_1 => {
          if (data_1 && data_1.id){
            db_track.one(insert_tracking, [emailHashOnInsert(csvrow[0].toLowerCase().replace(/\s+/g, '')), csvrow[3].toLowerCase().replace(/\s+/g, ''), csvrow[4].toLowerCase().replace(/\s+/g, '')])
                .then(data_2 => {
                  console.log('Insert tracking data succesfully', data_2.id)
            })
                .catch(error => {
                  console.log('Error while inserting tracking data: ', error);
            })
          }
          else {
            console.log('No returning value after inserting new user into valid_email table');
          }
        })
            .catch(error => {
              console.log("Error in inserting new user invalid_email: ", error);
        })
      }
    })
    .catch(error => {
      console.log(error);
    });
    //csvData.push({email: csvrow[0].toLowerCase().replace(/\s+/g, ''), organisation: parseInt(csvrow[1]), type: parseInt(csvrow[2])});
  })
  .on('end',function() {
    console.log("ALL DATA INSERTED SUCCESSFULLY");
    // let table = new pgp.helpers.TableName('valid_email', 'voice');
    // const query = pgp.helpers.insert(csvData, ['email', 'organisation', 'type'], table);
    // db.none(query)
    // .then((data, err)=>{
    //   if (err) {
    //     reject(err);
    //   } else console.log('Users Data Inserted Succesfully');
    // })
    // .catch(error =>{
    //   console.log('Error: ', error);
    // });


  });

}


console.log("Uploding data to the system,");
//insertValidEmailsWothCheck();
console.log("g.wilkinson@ncl.ac.uk".toLowerCase().replace(/\s+/g, ''));
console.log(emailHashOnInsert("g.wilkinson@ncl.ac.uk".toLowerCase()));


//OLD
//console.log("Step1: upload Users Data: ");
//insertValidEmails();
//console.log("Step2: upload Tracking Data");
//insertTrackingData();
console.log("uploading Finished");

//console.log(emailHash('patrick.olivier@ncl.ac.uk'));


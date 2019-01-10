
let config = require('config');
let validator = require('validator');

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


//require xlsx module
const XlsxPopulate = require('xlsx-populate');

//Functions

function structureData(array, headers_list, unescape, field){
  let result = [];
  let temp = [];
  array.forEach(entry => {
    headers_list.forEach((header) =>{
      if (unescape && header === field){
        temp.push(validator.unescape(entry[header]))
      } else {
        temp.push(entry[header])
      }
    });
    result.push(temp);
    temp = [];
  });
  return result

}


//export list of the hashes and the corresponding classifications
function getListOfAllHashesAndClassification() {
  const retrieve_hashes = new pgp_track_ps("retrieve-hashes", "SELECT hash, class_position FROM voice.tracking_user_classification");
  return new Promise((resolve, reject) => {
    db_track.any(retrieve_hashes)
        .then((data, err) => {
          if (err) reject(err);
          if (data && data.length>0){

            // Load a new blank workbook
            XlsxPopulate.fromBlankAsync()
            .then(workbook => {
              // Modify the workbook.
              workbook.sheet(0).name("List");

              //SET styles
              //style for sheet with List
              workbook.sheet("List").row(1).style("bold", true);
              workbook.sheet("List").column("A").style({horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("List").column("A").width(80);
              workbook.sheet("List").column("A").style({wrapText: true});

              workbook.sheet("List").column("B").style({horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("List").column("B").width(50);

              //populating headers
              workbook.sheet("List").range("A1:B1").value([
                ["hash", "classification"]
              ]);

              //Populate data into spreadsheet
              let array = structureData(data, ["hash", "class_position"], false);

                let range ="";
                let length = array.length;
                range = "A2:C" + (length + 1).toString();
                //console.log(range);
                workbook.sheet("List").range(range).value(array);

                // Write to file.
                console.log("File for Hashes was created");
                return workbook.toFileAsync("../reports/Hashes_class.xlsx");

            })
            .catch(error => {
              console.log("error while creating spreadsheet: ", error)
            });

            resolve("Done");
          } else {
            console.log("No messages were retrieved");
            reject("No messages were retrieved");
          }

    })
        .catch(error =>{
          console.log(error);
          reject(error);
    })
  })
}


getListOfAllHashesAndClassification();


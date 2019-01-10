
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

/**
 *
 * @return {Promise<any>}
 */
function getListOfAllMessagesIds() {
  const retrieve_messages_ids = new pgp_ps("retrieve-messages-ids", "SELECT id from voice.public_messages ORDER BY id ASC");
  return new Promise((resolve, reject) => {
    db.any(retrieve_messages_ids)
        .then((data, err) => {
          if (err) reject(err);
          if (data && data.length>0){
            resolve(data);
          } else {
            console.log("No messages were retrieved");
            reject(data);
          }
    })
        .catch(error => {
          console.log(error);
          reject(error);
    })
  })
}

function getMessageData(id) {
  const retrieve_message = new pgp_ps("retrieve-message", "SELECT id, text, categories, cat_name, timestamp, edit_status, votes_up, votes_down FROM voice.public_messages WHERE id = $1");
  return new Promise((resolve, reject) => {
    db.any(retrieve_message, [id])
    .then((data, err) => {
      if (err) reject(err);
      if (data && data.length> 0){
        resolve(data);
      } else {
        console.log("No message data associated with the id - ", id, " was find");
        reject(data);
      }
    })
    .catch(error => {
      reject(error);
    })
  });
}

function structureVotesStats(votes_array){
  let array = [];
  let temp = [];
  votes_array.forEach(entry => {
    temp.push(entry.class_position);
    if (entry.options.data.type === 0){
      temp.push("downvoted");
    } else {
      temp.push("upvoted");
    }
    temp.push(entry.options.data.id);

    array.push(temp);
    temp = [];
  });
  return array
}

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

function getMessageVotesStats(id) {
  //﻿SELECT * FROM voice.tracking WHERE action = 'vote for specific message' AND options->'data'->>'id' = '3';
  const retrieve_message_votes_stat = new pgp_track_ps("retrieve_message_votes_stat", "SELECT class_position, options FROM voice.tracking WHERE action = 'vote for specific message' AND options->'data'->>'id' = $1");
  return new Promise((resolve, reject) => {
    db_track.any(retrieve_message_votes_stat, [id.toString()])
    .then((data, err) => {
      if (err) reject(err);
      if (data && data.length> 0){
        let result = structureVotesStats(data);
        //console.log(result);
        resolve(result);
      } else if (data && data.length === 0){
        resolve([]);
      }
    })
    .catch(error => {
      reject(error);
    })
  });
}

function getMessagePageViews(id) {
  //﻿SELECT * FROM voice.tracking WHERE action = 'vote for specific message' AND options->'data'->>'id' = '3';
  //const retrieve_message_views = new pgp_track_ps("retrieve_message_views", "SELECT class_position,﻿COUNT(class_position) as amount FROM voice.tracking WHERE action = 'accessed post page' AND options->'data'->>'post_id'=$1 GROUP BY class_position ORDER BY amount DESC");
  const retrieve_message_views = new pgp_track_ps("retrieve_message_views", "SELECT class_position, COUNT(*) as amount FROM voice.tracking WHERE action = 'accessed post page' AND options->'data'->>'post_id'=$1 GROUP BY class_position ORDER BY amount");
  return new Promise((resolve, reject) => {
    db_track.any(retrieve_message_views, [id.toString()])
    .then((data, err) => {
      if (err) reject(err);
      if (data && data.length> 0){
        //console.log(data);
        let result = structureData(data, ["class_position", "amount"]);
        //console.log("This is results: ", result);
        resolve(result);
      } else if (data && data.length === 0){
        console.log("No access data returned for ", id);
        resolve([]);
      }
    })
    .catch(error => {
      reject(error);
    })
  });
}

function getMessageComments(id){
  const retrieve_message_comments = new pgp_ps("retrieve-message-comments", "SELECT id, text, createdtime, parent_message, author, edit_status FROM voice.comments WHERE parent_message = $1 ORDER BY createdtime");
  return new Promise((resolve, reject) => {
    db.any(retrieve_message_comments, [id])
    .then((data, err) => {
      if (err) reject(err);
      if (data && data.length> 0){
        let result = structureData(data, ["id", "text", "author", "parent_message", "createdtime", "edit_status"], true, "text");
        //console.log(result);
        resolve(result);
      } else if (data && data.length === 0){
        resolve([]);
    }
    })
    .catch(error => {
      reject(error);
    })
  });
}


function export_raw_data(){



}





function main(){
  let ids = getListOfAllMessagesIds();
  ids
  .then(data => {
    console.log("---------Ids retrieved successfully---------");

    data.forEach(entry => {
      getMessageData(entry.id)
          .then(data2 => {
            // Load a new blank workbook
            XlsxPopulate.fromBlankAsync()
            .then(workbook => {
              // Modify the workbook.
              workbook.sheet(0).name("Message");
              workbook.addSheet("Comments");
              workbook.addSheet("Stat-Votes");
              workbook.addSheet("Page-Views");

              //SET styles for excel work book


              //style for sheet with Messages
              workbook.sheet("Message").row(1).style("bold", true);
              workbook.sheet("Message").column("E").style({numberFormat: "dd.mm.yyyy", horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Message").column("E").width(12);
              workbook.sheet("Message").column("B").width(80);
              workbook.sheet("Message").column("B").style({wrapText: true});

              workbook.sheet("Message").column("A").style({numberFormat: "0", horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Message").column("C").style({numberFormat: "0", horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Message").column("D").style({horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Message").column("D").width(18);
              workbook.sheet("Message").column("D").style({wrapText: true});
              workbook.sheet("Message").column("F").style({horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Message").column("F").width(9);
              workbook.sheet("Message").column("G").style({numberFormat: "0", horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Message").column("H").style({numberFormat: "0", horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Message").column("H").width(10);
              workbook.sheet("Message").column("I").style({horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Message").column("I").width(15);
              workbook.sheet("Message").column("J").style({numberFormat: "0", horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Message").column("J").width(15);
              workbook.sheet("Message").column("K").style({numberFormat: "0", horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Message").column("K").width(15);

              //link to stats about visits
              workbook.sheet("Message").cell("I1").value("votes_statistics");
              workbook.sheet("Message").cell("I2").value("Votes Stats");
              workbook.sheet("Message").cell("I2").style({ fontColor: "0563c1", underline: true });
              workbook.sheet("Message").cell("I2").hyperlink("#'Stat-Votes'!A1");

              workbook.sheet("Message").range("A1:I2").value([
                  ["id", "text", "category", "cat_name", "timestamp", "edit_status", "votes_up", "votes_down"],
                  [data2[0].id, validator.unescape(data2[0].text), data2[0].categories[1], validator.unescape(data2[0].cat_name[0]), data2[0].timestamp, data2[0].edit_status, data2[0].votes_up, data2[0].votes_down]
              ]);


              //style for sheet with Comments
              workbook.sheet("Comments").row(1).style({bold: true});
              workbook.sheet("Comments").column("A").style({numberFormat: "0", horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Comments").column("B").width(80);
              workbook.sheet("Comments").column("B").style({wrapText: true});
              workbook.sheet("Comments").column("C").width(20);
              workbook.sheet("Comments").column("C").style({horizontalAlignment: "left", verticalAlignment: "top", wrapText: true});
              workbook.sheet("Comments").column("D").style({numberFormat: "0", horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Comments").column("D").width(10);
              workbook.sheet("Comments").column("E").style({numberFormat: "dd.mm.yyyy", horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Comments").column("E").width(12);
              workbook.sheet("Comments").column("F").style({horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Comments").column("F").width(12);

              //style for sheet with Pages-views-stats
              workbook.sheet("Page-Views").row(1).style({bold: true});
              workbook.sheet("Page-Views").column("A").style({horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Page-Views").column("A").width(30);
              workbook.sheet("Page-Views").column("B").style({numberFormat: "0", horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Page-Views").column("B").width(10);


              //style for sheet with Votes-stats
              workbook.sheet("Stat-Votes").row(1).style({bold: true});
              workbook.sheet("Stat-Votes").column("A").width(20);
              workbook.sheet("Stat-Votes").column("A").style({horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Stat-Votes").column("B").width(15);
              workbook.sheet("Stat-Votes").column("B").style({horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Stat-Votes").column("C").style({numberFormat: "0", horizontalAlignment: "left", verticalAlignment: "top"});
              workbook.sheet("Stat-Votes").column("C").width(10);

              //populate with headers sheet for comments
              workbook.sheet("Comments").range("A1:F1").value([["id", "text", "author", "message_id", "timestamp", "edited_status"]]);

              //populate data into Comments sheet.
              getMessageComments(entry.id)
                .then((comments, err) => {
                  let length = comments.length;

                  //link to sheet with comments
                  workbook.sheet("Message").cell("J1").value("comments");
                  workbook.sheet("Message").cell("J2").value(length);
                  workbook.sheet("Message").cell("J2").style({ fontColor: "0563c1", underline: true });
                  workbook.sheet("Message").cell("J2").hyperlink("#'Comments'!A1");

                  let comments_range = "A2:F" + (length + 1).toString();
                  //console.log(vote_range);
                  workbook.sheet("Comments").range(comments_range).value(comments);

                    //Populate headers for Votes Stat sheet
                    workbook.sheet("Stat-Votes").range("A1:C1").value([["user_classification", "vote_type", "message_id"]]);

                    //Populate headers for Page-Stats sheet
                    workbook.sheet("Page-Views").range("A1:B1").value([["user_classification", "count"]]);

                    getMessagePageViews(entry.id)
                    .then(pages_views => {
                      let length = pages_views.length;
                      //link to sheet with comments
                      workbook.sheet("Message").cell("K1").value("page_views");
                      workbook.sheet("Message").cell("K2").value(length);
                      workbook.sheet("Message").cell("K2").style({ fontColor: "0563c1", underline: true });
                      workbook.sheet("Message").cell("K2").hyperlink("#'Page-Views'!A1");

                      let page_view_range = "A2:B" + (length + 1).toString();
                      //console.log(vote_range);
                      workbook.sheet("Page-Views").range(page_view_range).value(pages_views);


                      //Populate data into Votes Stat sheet
                      getMessageVotesStats(entry.id)
                      .then((votes, err) => {
                        //console.log(votes);
                        let vote_range ="";
                        let length = votes.length;
                        vote_range = "A2:C" + (length + 1).toString();
                        //console.log(vote_range);
                        workbook.sheet("Stat-Votes").range(vote_range).value(votes);

                        // Write to file.
                        console.log("File for " + entry.id + " was created");
                        return workbook.toFileAsync("../reports/"+ entry.id +".xlsx");

                      })
                      .catch(error => {
                        console.log("Error while retrieving votes_stats: ", error);
                      });

                    })
                    .catch(error => {
                      console.log("Error while retrieving pages views: ", error);
                    });

                })
                .catch(error => {
                  console.log("Error while retrieving comments: ", error);
                });
            })
                .catch(error => {
                  console.log("Error while creating workbook: ", error);
            });
            //console.log(data2);
      })
          .catch(error => {
            console.log("getMessageData Error: ", error);
      })
    })

  })
  .catch(error => {
    console.log("Ids error: ", error);
  });

  return console.log("Mega done");
}





main();

//getMessagePageViews(1);
//import validation procedures
let uValid = require('../controllers/additions/useful_func');


//uniq values iin array
function uniq(array) {
  return Array.from(new Set(array));
}


//function to get mailgun logs
function getMailgunSendingToLogs(count, skip) {
  uValid.getLogs(count, skip, function(response) {
    let n = 0;
    let myRe = new RegExp("→.*?'", "i");
    let emails = [];
    let temp_string = '';
    response.items.forEach(entry => {
      if (entry.hap === 'delivered') {
        temp_string = myRe.exec(entry.message)[0];
        emails.push(temp_string.substring(1, temp_string.length-1).replace(/\s/g, ''));
        //console.log(entry.created_at);
        n +=1;
      }
    });
    //console.log(emails);
    console.log(n);
    let result = uniq(emails);
    console.log(result);
    console.log(result.length);
  });
}


getMailgunSendingToLogs(300, 0);



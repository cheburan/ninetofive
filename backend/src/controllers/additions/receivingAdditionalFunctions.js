



//supplementary function for checking email against the list of valid email
function checkEmailinDB(email, hash=''){
  let email_to_check = '';
  email = uValid.validateEmail(email);
  if (config_auth_type === 0 && email){
    email_to_check = email;
  } else {
    email_to_check = hash;
  }
  let db_answer = db.checkEmail(email, hash);
  return new Promise((resolve, reject) => {
    db_answer.then((answer) =>{
      let address = null;
      //let result = {};
      console.log('Retrieved from DB in resService: ', answer);
      if (answer['code'] === 1){
        if (answer['data']['personal_email']===null || answer['data']['personal_email']===''){
          address = [email, email, false, false, false, answer['data']['subscription'], answer['data']['email'], false];
        } else {
          address =[answer['data']['personal_email'], email, true, false, false, answer['data']['subscription'], answer['data']['email'], false];
        }
        //Checking if the user is moderator orr super admin
        //if moderator
        if (answer['data']['type']===15){
          address[3] = true
        }
        //if suppa moderator
        else if (answer['data']['type']===29){
          address[3] = true;
          address[4] = true;
        }
        //official representative
        else if (answer['data']['type']===13) {
          address[7] = answer['data']['title'];
        }
        //if official representative and moderator
        else if (answer['data']['type']===16) {
          address[3] = true;
          address[7] = answer['data']['title'];
        }
        //send email to the specified address
        console.log('Sending token via email...');

      }
      else
        console.log("Email checker returned code: ", answer['code']);
      console.log("Address is "+ address);
      resolve(address);
    }).catch((error) =>{
      console.log('Error in resService: ', error);
      reject(error);
    });
  });

}

//TODO clean up the mess with the redunted slashes
function addslashes( str ) {
  return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

function uuidVerification(uuid) {
  uuid = uValid.validateText(uuid);
  let bool = false;
  return new Promise((resolve, reject) => {
    db.checkAdmin(uuid)
    .then(data => {
      if ((data['code'] === 1) && (data["data"]["uuid"] === uuid)){
        let moders = config.get('moderators');
        for (var i = moders.length -1; i>=0; i--){
          if((moders[i]["name"] === data["data"]["email"])/*Should add check for time no more that 1 hour*/){
            bool = true;
            break;
          } else  {
            bool =  false;
          }
        }
      } else {
        bool =  false;
      }
      resolve(bool);
    })

  });

}
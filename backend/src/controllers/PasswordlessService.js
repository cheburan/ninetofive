/**
 * Created by b0913178 on 06/06/2017.
 */
"use strict";

let config = require('config');

//Path to be send via email
let host = config.get('Passwordless.host');

//SendGrid
//let helper = require('sendgrid').mail;
//let sg = require('sendgrid')(config.get('SMTP_SendGrid.API_KEY'));

//sendgrid mailer
//old one
//const mailer = require('sendgrid-mailer').config(config.get('SMTP_SendGrid.API_KEY'));

//new one
//const mailer = require('@sendgrid/mail').setApiKey(config.get('SMTP_SendGrid.API_KEY'));

//modules and files for passwordless access
let passwordless = require('passwordless');
//let MongoStore = require('passwordless-mongostore-bcrypt-nodejs-updated');
////let emailSender   = require("emailjs");
////let smtpServer = emailSender.server.connect(config.get('SMTP_Server'));

/*
*MailGun
*
*/
let Mailgun = require('mailgun-js');
// api key, from Mailgun’s Control Panel
let api_key = 'key-1ea52758cd965036d1d5e01fd06036d6';
//Your domain, from the Mailgun Control Panel
let domain = 'mg.ninetofive.work';
//Your sending email address
let from_who = config.get('SMTP_SendGrid.user');
let hoster = config.get('General.hoster');
let organisation = config.get('General.organisation');
let mailgun = new Mailgun({apiKey: api_key, domain: domain});

passwordless.addDelivery(
    function(tokenToSend, uidToSend, message, subsMessage, recipient, callback) {
        // Send out token
        console.log(message);
        console.log("SENDING FROM: ", from_who);

      //MAILGUN SENDER
      let data = {
        //Specify email data
        from: from_who,
        //The email to contact
        to: recipient,
        //Subject and text data
        subject: 'Access request for NINEtoFIVE.work',
        text: "\nClick on the following private link (which you requested)) to access NINEtoFIVE.work: " + host + "?token=" + tokenToSend + "&uid=" + encodeURIComponent(uidToSend) +"\n" + "\nThis link will work only once. In order to access the system next time (if your session will expire) you need to request the new link (to ensure anonymity). \nWe look forward to receiving your constructive contributions to the workplace discussions at "+ organisation +" \n"+ hoster +", NINEtoFIVE.work team.",
        html: "<p>Click on the following private link (which you requested) to access NINEtoFIVE.work: <a href='" + host + "?token=" + tokenToSend + "&uid=" + encodeURIComponent(uidToSend) + "'>NINEtoFIVE.work</a></p><p>" + subsMessage + "This link will work only once. In order to access the system next time (if your session will expire) you need to request the new link (to ensure anonymity).</p><p> We look forward to receiving your constructive contributions to the workplace discussions at "+ organisation +".</p><p><strong>"+ hoster +", NINEtoFIVE.work team</strong></p>"
      };

      mailgun.messages().send(data, function (err, body) {
        //If there is an error, render the error page
        if (err) {
          console.log("got an error: ", err);
          callback(err);
        }
        //Else we can greet    and leave
        else {
          console.log("Message has been");
          callback(err);
        }
      });



        //SENDGRID SENDER
        /*const email = {
          to: recipient,
          from: config.get('SMTP_SendGrid.user'),
          subject: 'Access request for NINEtoFIVE.work',
          text: 'Hello! \nHere is your private link to access NINEtoFIVE.work: \n' + host + '?token=' + tokenToSend + '&uid=' + encodeURIComponent(uidToSend) +'\n' + '\nThis link will work only once. When you would like to access NINEtoFIve.work again please visit the site and click on GET STARTED. \n' + message + ' \nWe look forward to receiving your constructive contibutions to the workplace discussions at Newcastle University \nThank you \nNINEtoFIVE.work team.',
          html: "<h3>Hello! </h3> <p><strong>Here is your private link to access NINEtoFIVE.work:</strong> </p> <p><a href='" + host + "?token=" + tokenToSend + "&uid=" + encodeURIComponent(uidToSend) + "'>ACCESS NINEtoFIVE.work</a>: " + host + "?token=" + tokenToSend + "&uid=" + encodeURIComponent(uidToSend) + "</p><p> This link will work only once. <br>When you would like to access NINEtoFIVE.work again please visit the site and click on <a href='"+ host +"email'>get started</a>. <br>" + message + "<br> We look forward to receiving your constructive contibutions to the workplace discussions at Newcastle University. <br><br>Thank you<br>NINEtoFIVE.work team.</p>"
        };

        //console.log(email['text']);

        mailer.send(email)
        .then((data, err) => {
          if (err) reject(err);
          console.log("Message sent");
          callback(err);
        })
        .catch(error => {
          console.log("ERROR: ", error);
          callback(error);
        });*/

        //GOOGLE ACCOUNT SENDER
        /*smtpServer.send({
           text:    'Hello!\nYou can now access your account here: '
                + host + '?token=' + tokenToSend + '&uid=' + encodeURIComponent(uidToSend) + ' ' + message,
           from:    config.get('SMTP_Server.user'),
           to:      recipient,
           subject: 'Token for ' + host
        }, function(err, message) {
            if(err) {
                console.log(err);
            }
            callback(err);
        });*/
    }, {ttl: 1000*60*60*192 });
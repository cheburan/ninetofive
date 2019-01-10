// "use strict";
//
// const express = require('express');
// let router = express.Router();
//
// //crypto module fo generating hash digest
// const crypto = require('crypto');
// let validator = require('validator');
//
// let config = require('config');
//
//
// /* GET unsubscribe page. */
// router.get('/', (req, res, next) => {
//   let code = '';
//   let email_for_search = '';
//   try {
//     code = validator.isAlphanumeric(validator.escape(validator.blacklist(text, '$<>')));
//   } catch(error){
//     console.log(error);
//     res.render('unsubscribe', {
//       title: 'Unsubscribe',
//       message: 'Error in the process. Please try later'
//     });
//   }
//   let crypto_key = config.get('Crypto.secret_key');
//   const decipher = crypto.createDecipher('aes192', crypto_key);
//   let decrypted = '';
//   decipher.on('readable', () => {
//     const data = decipher.read();
//     if (data)
//       decrypted += data.toString('utf8');
//   });
//   decipher.on('end', () => {
//     console.log(decrypted);
//     email_for_search = decrypted;
//     // Prints: some clear text data
//   });
//
//   decipher.write(code, 'hex');
//   decipher.end();
//
//   //more then @ncl.ac.uk
//   if (email_for_search && email_for_search.length > 8){
//
//   }
//
//
//
//   res.render('unsubscribe', {
//     title: 'Unsubscribe',
//     message: 'Successfully unsubsidised. If you would like to subscribe later, please tick corresponding box again.'
//   });
// });
//
// module.exports = router;

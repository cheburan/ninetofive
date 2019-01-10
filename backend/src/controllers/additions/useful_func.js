/**
 * Created by b0913178 on 13/06/2017.
 */
//import validator

let validator = require('validator');
let config = require('config');
const host = config.get('Passwordless.host') + config.get('Passwordless.host_email_change');
const mailing_list = config.get('Mail.mailing_list');

const stop_hash_emails = config.get('Hash.stop');
const hash_email = config.get('Hash.email');

//Mailgun
let Mailgun = require('mailgun-js');
// api key, from Mailgun’s Control Panel
let api_key = 'key-1ea52758cd965036d1d5e01fd06036d6';
//Your domain, from the Mailgun Control Panel
let domain = 'mg.ninetofive.work';
//Your sending email address
var from_who = config.get('SMTP_SendGrid.user');
var mailgun = new Mailgun({apiKey: api_key, domain: domain});

//crypto module fo generating  random strings and hashing
const crypto = require('crypto');
let crypto_key = config.get('Crypto.sha512_key');

//for username generation
let animals = ["Aardvark", "Anteater", "Antelope", "Fox", "Hare", "Wolf", "Armadillo", "Aye", "Baboon", "Badger", "Bandicoot", "Bat", "Bear", "Beaver", "Tiger", "Binturong", "Bison", "Black Bear", "Bobcat", "Bongo", "Bonobo", "Bear", "Buffalo", "Camel", "Capybara", "Caracal", "Cat", "Chamois", "Cheetah", "Chimpanzee", "Chinchilla", "Chipmunk", "Coati", "Cougar", "Cow", "Coyote", "Cuscus", "Deer", "Dhole", "Dingo", "Dog", "Dolphin", "Donkey", "Dormouse", "Dugong", "Echidna", "Elephant", "Ferret", "Fossa", "Fur Seal", "Gerbil", "Gibbon", "Giraffe", "Goat", "Gopher", "Gorilla", "Grey Seal", "Hamster", "Hare", "Hedgehog", "Hippopotamus", "Horse", "Human", "Whale", "Hyena", "Impala", "Indri", "Jackal", "Jaguar", "Kangaroo", "Koala", "Kudu", "Lemming", "Lemur", "Leopard", "Liger", "Lion", "Llama", "Lynx", "Manatee", "Mandrill", "Markhor", "Meerkat", "Mole", "Mongoose", "Monkey", "Moose", "Mountain Gorilla", "Mouse", "Mule", "Neanderthal", "Numbat", "Ocelot", "Okapi", "Opossum", "Orang-utan", "Otter", "Pademelon", "Panther", "Pig", "Pika", "Platypus", "Porcupine", "Possum", "Puma", "Quokka", "Quoll", "Rabbit", "Raccoon", "Raccoon Dog", "Rat", "Panda", "Reindeer", "Rhinoceros", "Dolphin", "Hyrax", "Saola", "Seal", "Serval", "Sheep", "Skunk", "Sloth", "Squirrel", "Stoat", "Tapir", "Tarsier", "Uakari", "Wallaby", "Walrus", "Warthog", "Weasel", "Wildebeest", "Wolverine", "Wombat", "Yak", "Zebra", "Zebu", "Zonkey", "Zorse", "Alligator", "Caiman", "Chameleon", "Crocodile", "Gecko", "Gharial", "Iguana", "Lizard", "Tortoise", "Tuatara"];
let colours = ["Alizarin", "Amaranth", "Amber", "Amethyst", "Apricot", "Aqua", "Aquamarine", "Asparagus", "Auburn", "Azure", "Beige", "Bistre", "Black", "Blue", "Brass", "Bronze", "Brown", "Buff", "Burgundy", "Cardinal", "Carmine", "Celadon", "Cerise", "Cerulean", "Champagne", "Charcoal", "Chartreuse", "Chestnut", "Chocolate", "Cinnabar", "Cinnamon", "Cobalt", "Copper", "Coral", "Corn", "Cornflower", "Cream", "Crimson", "Cyan", "Dandelion", "Denim", "Ecru", "Emerald", "Eggplant", "Firebrick", "Flax", "Fuchsia", "Gamboge", "Gold", "Goldenrod", "Green", "Grey", "Harlequin", "Heliotrope", "Indigo", "Ivory", "Jade", "Lavender", "Lawn green", "Lemon", "Lilac", "Lime", "Linen", "Magenta", "Magnolia", "Malachite", "Maroon", "Mauve", "Mustard", "Myrtle", "Ochre", "Olive", "Olivine", "Orange", "Orchid", "Peach", "Pear", "Periwinkle", "Persimmon", "Pink", "Platinum", "Plum", "Puce", "Pumpkin", "Purple", "Razzmatazz", "Red", "Rose", "Ruby", "Russet", "Rust", "Saffron", "Salmon", "Sangria", "Sapphire", "Scarlet", "Seashell", "Sepia", "Silver", "Sky Blue", "Smalt", "Tan", "Tangerine", "Taupe", "Teal", "Tenne", "Thistle", "Tomato", "Turquoise", "Ultramarine", "Vermilion", "Violet", "Viridian", "Wheat", "White", "Wisteria", "Xanthic", "Yellow", "Zucchini"];
let adj = ["lazy", "stiff", "weary", "feeble", "synonymous", "faded", "tranquil", "chilly", "measly", "common", "nondescript", "kindhearted", "statuesque", "dangerous", "tasty", "average", "silent", "sweltering", "like", "sulky", "bright", "three", "well-off", "gaping", "trashy", "quiet", "dapper", "adhesive", "aquatic", "tacit", "curly", "fragile", "splendid", "evanescent", "slippery", "alluring", "envious", "vivacious", "imaginary", "elegant", "tenuous", "abject", "electric", "misty", "early", "zany", "uncovered", "enormous", "undesirable", "open", "shiny", "ruthless", "pricey", "cumbersome", "berserk", "colorful", "lowly", "absurd", "complex", "opposite", "toothsome", "big", "bawdy", "ragged", "insidious", "imported", "plant", "lacking", "righteous", "optimal", "irate", "rainy", "cluttered", "jittery", "unequal", "boiling", "clammy", "robust", "willing", "lumpy", "rhetorical", "protective", "harmonious", "puzzling", "loud", "zippy", "domineering", "watery", "likeable", "scared", "conscious", "alive", "hysterical", "incredible", "vigorous", "fortunate", "trite", "steady", "cool", "immense", "thirsty", "grotesque", "thankful", "vulgar", "old-fashioned", "previous", "grey", "gratis", "grateful", "macho", "magnificent", "amused", "unequaled", "kaput", "handy", "lively", "festive", "silly", "permissible", "reflective", "sassy", "nifty", "zesty", "rambunctious", "overwrought", "vast", "rabid", "exotic", "innate", "inconclusive", "spiritual", "different", "hard-to-find", "grouchy", "aboriginal", "thin", "painful", "ugly", "quack", "godly", "ad hoc", "keen", "unsightly", "dull", "alike", "billowy", "busy", "evasive", "lush", "valuable", "macabre", "holistic", "mixed", "depressed", "organic", "hurried", "able", "acoustic", "paltry", "cheap", "lavish", "dusty", "defiant", "knotty", "harsh", "fixed", "shocking", "subdued", "fallacious", "nauseating", "grandiose", "auspicious", "knowing", "doubtful", "male", "loutish", "bent", "obese", "loose", "handsome", "low", "ordinary", "uttermost", "furtive", "agreeable", "charming", "silent", "hulking", "flagrant", "uninterested", "regular", "spicy", "whimsical", "abusive", "dead", "shaky", "descriptive", "nonstop", "unused", "resonant"];

//Variables for checking type of variable
let stringConstructor = "test".constructor;
let arrayConstructor = [].constructor;
let objectConstructor = {}.constructor;

module.exports = {

    //function for validate email
    validateEmail: function (email){
        //email = validator.escape(validator.blacklist(email, ",$=\\/>& "));
        email = validator.blacklist(email, ",$=\\/<>& ");
        //console.log('This is email for now: ', email);
        if (!validator.isEmpty(email) && validator.isEmail(email)){
            return email;
        }
        else {
            return false;
        }
    },

    validateText: function(text){
        //console.log('THIS IS TEXT BEFORE: ', text);
        //text = validator.escape(validator.blacklist(text, "$<>"));
        text = validator.blacklist(text, "$=\\/<>");
        //console.log('THIS IS TEXT AFTER: ', text);
        if (!validator.isEmpty(text)){
            return text;
        }
        else {
            return false;
        }
    },

    validateTextArrayJSON: function (object, name){
      if (object.constructor === arrayConstructor){
        object.forEach(function(element) {
          if (element.constructor === objectConstructor && element[name].constructor === stringConstructor){
            element[name] = validator.escape(validator.blacklist(element[name], '$<>'));
            if (validator.isEmpty(element[name])){
              console.log("Element(s) is(are) empty string(s)");
              object = false
            }
          } else {
            console.log("Not an object or elements are not strings");
            object = false
          }
        });
        return object
      } else {
        return false
      }
    },

    sendEmail: function( passcode, message, recipient, new_email, subject) {
        // Send out token
        console.log(message);
          //MAILGUN SENDER
          let data = {
            //Specify email data
            from: from_who,
            //The email to contact
            to: recipient,
            //Subject and text data
            subject: subject,
            text: 'Hello! \n A Request has been made to change your NINEtoFIVE.work email account to ' + new_email + '\n To confirm this change go to: \n ' + host + '?code=' + passcode + ' in order to continue with email changing.\n' + ' To ignore this request please disregard this email. \n \n Thank you \n \n NINEtoFIVE.work team.' + message,
            html: "<h3>Hello! </h3><p>A Request has been made to change your NINEtoFIVE.work email account to " + new_email + " </p> <p>To confirm this change go to: <br><a href='" + host + "?code=" + passcode + "'>link for updating email</a> <br>in order to continue with email changing. <br> To ignore this request please disregard this email.<br><br>Thank you<br>NINEtoFIVE.work team." + "</p> <p>" + message + "</p>"
          };

          mailgun.messages().send(data, function (err, body) {
            //If there is an error, render the error page
            if (err) {
              console.log("got an error: ", err);
            }
            //Else we can greet    and leave
            else {
              console.log("Message has been");
            }
          });

    },

  sendAnyEmail: function(message, html_message, recipient, subject) {
    // Send out token
    console.log(message);

    //TODO get rid of this dirty hack !
    if (recipient === hash_email && stop_hash_emails === 1) {
      return null
    }else {

      //MAILGUN SENDER
      let data = {
        //Specify email data
        from: from_who,
        //The email to contact
        to: recipient,
        //Subject and text data
        subject: subject,
        text: message,
        html: html_message
      };

      mailgun.messages().send(data, function(err, body) {
        //If there is an error, render the error page
        if (err) {
          console.log("got an error: ", err);
        }
        //Else we can greet    and leave
        else {
          console.log("Message has been");
        }
      });
    }
  },

  getLogs: function(number=300, skip=0, callback) {
    mailgun.get(`/${domain}/log`, {"limit": number, "skip": skip}, function (error, body) {
      callback(body);
    });
  },

  // Mailgun list usage
  /**
   * add user to mailing list
   * @param email - email of the user;
   */
  listAddUser: function (email) {
    let list = mailgun.lists(mailing_list);
    let user = {
      subscribed: true,
      address: email
    };

    list.members().create(user, (err, data) => {
      console.log(data);
      return data;
    })
  },

  /**
   * Update email for subscription
   * @param oldemail - old email
   * @param email - new email
   */
  listUpdateUser: function(oldemail, email) {
    let list = mailgun.lists(mailing_list);
    list.members(oldemail).update({address: email}, (err, data) => {
      console.log(data);
      return data;
    })
  },

  /**
   *
   * @param email - eamil of the user for deletion
   */
  listDeleteuser: function(email) {
    let list = mailgun.lists(mailing_list);
    list.members(email).delete((err, data) => {
      console.log(data);
      return data;
    })
  },

    getRandomString: function(length){
        return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0,length);   /** return required number of characters */
    },

    getrandomUserName: function (userId) {
        if (!userId){
          userId = Math.floor(Math.random() * 1000 * new Date());
        }
        userId = parseInt(userId);
        let n1 = (userId % (animals.length-1));
        let n2 = (userId % (colours.length-1));
        let n3 = (userId % (adj.length-1));
        return (adj[n3] + " " + colours[n2] + " " + animals[n1]).toLowerCase();
    },

  /**
   * Force input value to LoweCase before hashing
   * @param string - string to be hashed
   * @param key - crypto jey for hashing operation
   * @return String if everything is right , if not return null
   */
  hashingString: function(string, key = crypto_key) {
    if (string == undefined || !string || string ==="") return null;
    if (string.constructor === stringConstructor){
      let hash = crypto.createHmac('sha512', key);
      return hash.update(string.toLowerCase()).digest('hex');
    }else {
      return null
    }
  }

};
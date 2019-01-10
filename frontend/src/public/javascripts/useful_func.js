/**
 * Created by b0913178 on 13/06/2017.
 */
    //function for validate email
    function validateEmail(email){
        console.log("Before -", email);
        //email = validator.escape(validator.blacklist(email, ",$=\\/>& "));
        email = validator.blacklist(email, ",$=\\/<>& ");
        console.log('This is email for now: ', email);
        console.log(validator.isEmail(email));
        console.log(validator.isEmpty(email));
        if (!validator.isEmpty(email) && validator.isEmail(email)){
            return email;
        }
        else {
            return false;
        }
    }

    //function for text validation
    function validateText(text){
        console.log("Before -", text);
        //text = validator.escape(validator.blacklist(text, ",$=\\/<>"));
        text = validator.blacklist(text, ",$=\\/<>");
        console.log("After - ", text);
        if (!validator.isEmpty(text)){
            return text;
        }
        else {
            return false;
        }
    }

    //function for array length validation
    function validateArray(array) {
        if (array && array.length > 0){
            return true;
        } else {
            return false;
        }
    }

    //function for background change on error element
    function errorElement(element){
        document.getElementById(element).className += "error";
    }


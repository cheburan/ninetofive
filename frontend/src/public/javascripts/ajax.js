/**
 * Created by b0913178 on 04/06/2017.
 */

function sendAjaxForm(result_form, url, formData, elToHide, formtoHide, command) {
    $.ajax({
        url:     url, //url for request
        type:     "POST", //method
        dataType: "JSON", //data format
        data: formData,  // data to send
        success: function(response) { //if successfully send
        	var $resultDom = document.getElementById(result_form);
            $resultDom.style.display = "";
            $resultDom.innerHTML = "<p>" +response.email+ "</p>";
        	document.getElementById(elToHide).style.display="none";
        	if (response.code && formtoHide){
        	  console.log ("Success and form presented");
        	  console.log(response.email);
            document.getElementById(formtoHide).style.display="none";
            document.getElementById('back_panel').style.display="inline";
            document.getElementById('disclaimer').innerHTML = response.email;
          } else {
            console.log (response.code, " - ", formtoHide);
          }
    	},
    	error: function(response) { // in case of error while sending
    		document.getElementById(result_form).innerHTML = "Error. Verification Failed";
    		document.getElementById(elToHide).style.display="none";
    	}
 	});
}
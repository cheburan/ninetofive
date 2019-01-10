/**
 * Created by b0913178 on 07/07/2017.
 */
//NOT FINISHED
var app = new Vue({
    el: '#app',
    data: {
        selected: ''
    },
    methods: {
        postMessage: function () {
            var formData = {
                message: document.getElementById("message").value,
                author: 0,
                //not good
                categories: $("#categories").val(),
                type: parseInt (document.getElementById("type").value),
                link: document.getElementById("link").value
            };
            console.log(formData);

            document.getElementById('email_progress').style.display = "block";
            axios.post('/api/insert_comment', command)
                .then(function (response) {
                    console.log(response.data);
                })
                .catch(function (error) {
                    console.log (error);
                })
        }
    }

});
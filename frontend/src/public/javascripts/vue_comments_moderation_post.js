/**
 * Created by b0913178 on 18/06/2017.
 */

Vue.component('comment', {
    template: '#comment-template',
    components: {
        'avatar': Avatar.Avatar
    },
    props: ['comment'],
    methods: {
        date: function (time) {
            //t = moment(time).format("HH:mm DD.MM.YY");
            t = moment(time).format("DD.MM.YY");
            return t;
        },
        initial_comment_func: function(id) {
          if (id === app.initial_comment) {
              return 'background-color: antiquewhite'
          }else {
              return ''
          }
        }
    }

});

var app = new Vue({
    el: '#app',
    data: {
        comments: [],
        comment: '',
        off: 0,
        ord: 0,
        initial_comment: parseInt(document.getElementById('initial_comment_id').value),
        pagination: {
            current: 1,
            per_page: 30,
            prev: 0,
            last:1
        },
        first: false
    },
    methods: {
        postComment: function () {
            var comToPost = this.comment;
            console.log(comToPost);
            /*this.comments.unshift({
                text: this.comment,
                createdtime: Date.now()
            });*/
            this.comment = '';
            var id = parseInt(document.getElementById('post_id').value);

            var command = {
                text: comToPost,
                parent_message: id
            };

            //delete console.log outputs after test
            axios.post('/api/insert_temp_comment', command)
                .then(function (response) {
                    console.log(response.data);
                    Materialize.toast('Comment has been submitted for moderation', 4000)
                    /*app.comments.unshift({
                        text: response.data.text,
                        createdtime: response.data.createdtime,
                        author: response.data.author
                    });*/
                })
                .catch(function (error) {
                    console.log (error);
                })
        },
        requestComments: function(offs=0, ofs=0, ordr=0) {
            var app = this;
            console.log('Requesting ...');

            if (!(offs === app.off && app.first)){
                app.first = true;
                var id = parseInt(document.getElementById('post_id').value);

                app.off = ofs;
                app.ord = ordr;

                var command = {
                    message_id: id,
                    offset: ofs,
                    order: ordr
                };

                document.getElementById('email_progress').style.display = "block";
                axios.post('/api/get_mod_comments', command)
                    .then(function (response) {
                        app.comments = response.data.data;
                        console.log(response.data);
                        document.getElementById('email_progress').style.display = "none";
                        app.makePagination(response.data.pagination)
                    })
                    .catch(function (error) {
                        document.getElementById('email_progress').style.display = "none";
                        app.comments = [{"text": error}];
                    })
            }

        },
        makePagination: function (pag) {
            app.pagination = {
                current: pag.current_page,
                per_page: pag.per_page,
                prev: pag.current_page - 1,
                last: pag.last
            }
        }
    },
    mounted(){
        console.log('Yeah! I\'ve mounted successfully');
        this.requestComments(0,0,0);
    }

});



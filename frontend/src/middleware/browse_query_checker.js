module.exports = {

  queryChecker: (req, res, next) => {
    //checking presence of id and p variables in address string
    if (req.query){
      try {
        req.query.id = parseInt(req.query.id);
        req.query.p = parseInt(req.query.p);
        req.query.f = parseInt(req.query.f);
        req.query.s= parseInt(req.query.s);
        if (req.query.p !== req.query.p) req.query.p=1;
        if (req.query.id !== req.query.id) req.query.id=0;
        if (req.query.f !== req.query.f) req.query.f=3;
        if (req.query.s !== req.query.s) req.query.s=3;
        if (req.query.comment_id) { req.query.comment_id = parseInt(req.query.comment_id) }
        next();
      }
      catch(err){
        console.log(err);
        req.query.p=1;
        req.query.id=0;
        req.query.f=3;
        req.query.s=3;
        next();
      }
    }
  }
};
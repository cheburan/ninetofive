let jwt = require('jsonwebtoken');
let config = require('config');
let api_secret_key = config.get('jwt.secret_key');

module.exports = {

  /**
   * FUnction to Validate Tokens
   */
  verifyToken: (req, res, next) => {
    if (!req.headers['authorization']) return res.status(403).send({ auth: false, message: 'No token provided.' });
    let token = req.headers['authorization'].split('earer ')[1];
    if (!token)
      return res.status(403).send({ auth: false, message: 'No token provided.' });
    jwt.verify(token, api_secret_key, (err, decoded) => {
      if (err)
        return res.status(401).send({ auth: false, message: 'Failed to authenticate token.' });
      // if everything good, save to request for use in other routes
      req.userId = decoded.id;
      next();
    });
  },

  /**
   * Function to create tokens
   */
  createToken: (object) => {
    //create a token
    let token = jwt.sign({id:object}, api_secret_key, {
      expiresIn: 2768400 //expires in 31 day
    });
    return token
  }
};
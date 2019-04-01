const _data = require('./data');
const hashPassword = require('../helpers/hashPassword');
const createRandomString = require('../helpers/createRandomString');

const handlers = {};

handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) < -1) {
    callback(405);
  }

  handlers._tokens[data.method](data, callback);
};

handlers._tokens = {};

handlers._tokens.get = (data, callback) => {

}

/**
 * Required Data is phone, password
 */
handlers._tokens.post = (data, callback) => {
  let { phone, password } = data.payload;
  phone = typeof (phone) == 'string' && phone.trim().length >= 10 ? phone.trim() : false;
  password = typeof (password) == 'string' && password.trim().length > 0 ? password.trim() : false;

  if (phone && password) {
    _data.read('users', phone, (err, data) => {
      if (err) {
        callback(404, { 'Error': 'Could not find that specified user' });
      }

      let hashedPassword = hashPassword(password);
      if (hashedPassword !== data.hashedPassword) {
        callback(401, { 'Password': 'Sorry wrong password' });
      }

      let tokenId = createRandomString(20);
      let expires = Date.now() + 1000 * 60 * 60;
      let tokenObject = {
        'phone': phone,
        'id': tokenId,
        'expires': expires
      }

      _data.create('tokens', tokenId, tokenObject, (err) => {
        if (err) {
          callback({ 'Error': 'Could not create token' });
        }
        callback(200, { 'Success': 'Token generated successfully' });
      })
    });
  }
}

handlers._tokens.put = (data, callback) => {

}

handlers._tokens.delete = (data, callback) => {

}

module.exports = handlers;

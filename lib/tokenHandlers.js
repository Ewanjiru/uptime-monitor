const _data = require('./data');
const hashPassword = require('../helpers/hashPassword');
const createRandomString = require('../helpers/createRandomString');

const handlers = {};

handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) < -1) {
    callback(405, { 'error': 'Method not allowed' });
  }

  handlers._tokens[data.method](data, callback);
};

handlers._tokens = {};

handlers._tokens.get = (data, callback) => {
  let { id: tokenId } = data.queryStringObject;
  tokenId = typeof (tokenId) === 'string' && tokenId.trim().length === 20 ? tokenId : false;
  if (!tokenId) {
    callback(400, { 'Error': 'TokenId not provided' });
  }

  _data.read('tokens', tokenId, (err, data) => {
    if (!data) {
      callback(404, { 'Error': 'Data to that tokenId does not exist' });
    }

    if (err) {
      callback(404, { 'Error': 'An error occured' });
    }

    callback(200, data);
  });

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
  let { id: tokenId, extend } = data.payload;
  tokenId = typeof (tokenId) === 'string' && tokenId.trim().length === 20 ? tokenId : false;
  extend = typeof (extend) === 'string' && extend.trim().length > 0 ? extend : false;

  if (!tokenId || !extend) {
    callback(400, { 'Error': 'Required fields not provided' });
  }

  _data.read('tokens', tokenId, (err, data) => {
    if (err) {
      callback(400, { 'Error': 'The token data not found' });
    }

    if (data.expires < Date.now()) {
      callback(400, { 'Expired': 'The token has already expired' });
    } else {
      data.expires = Date.now() + 1000 * 60 * 60;
      _data.update('tokens', tokenId, data, (err) => {
        if (err) {
          callback(400, { 'Error': 'Could not update the expiry' });
        }

        callback(200, { 'Success': 'Expiry updated successfully' });
      });
    }
  });
}

handlers._tokens.delete = (data, callback) => {
  let { id: tokenId } = data.queryStringObject;
  tokenId = typeof (tokenId) === 'string' && tokenId.trim().length === 20 ? tokenId : false;
  if (!tokenId) {
    callback(400, { 'Error': 'tokenId not provided' });
  }

  _data.read('tokens', tokenId, (err, data) => {
    if (err) {
      callback(404, { 'Error': 'Token not found' });
    }

    _data.delete('tokens', tokenId, (err, data) => {
      if (err) {
        callback(500, { 'Error': 'Could not delete the tokenId' });
      }

      callback(200, { 'Message': 'Deleted successfully' });
    });
  });
}

handlers._tokens.verifyToken = (id, phone, callback) => {
  _data.read('tokens', id, (err, tokenData) => {
    if (tokenData && tokenData.phone === phone && tokenData.expires > Date.now()) {
      callback(true);
    } else {
      callback(false);
    }
  });
}

module.exports = handlers;

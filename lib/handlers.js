const _data = require('./data');
const hashPassword = require('../helpers/hashPassword');
const { verifyToken } = require('./tokenHandlers')._tokens;

const handlers = {};

handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) < -1) {
    callback(405);
  }

  handlers._users[data.method](data, callback);
}

//container for users methods
handlers._users = {};

handlers._users.get = (data, callback) => {
  const { phone } = data.queryStringObject;
  let phoneNumber = typeof (phone) === 'string' && phone.trim().length >= 10 ? phone.trim() : false;
  if (!phoneNumber) {
    callback(400, { 'Error': 'Phone number not provided' });
  }

  const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
  verifyToken(token, phone, (tokenIsValid) => {
    if (!tokenIsValid) {
      callback(403, { 'Aunthenticaton': 'You are not authorized.Token expired or missing' });
    }
    _data.read('users', phone, (err, data) => {
      if (!data) {
        callback(404, { 'Error': 'Data to that Phone number does not exist' });
      }

      if (err) {
        callback(404, { 'Error': 'An error occured' });
      }

      delete data.hashedPassword;
      callback(200, data);
    });
  });
}

handlers._users.post = (data, callback) => {
  let { firstName, lastName, phone, password, tosAgreement } = data.payload;
  firstName = typeof (firstName) == 'string' && firstName.trim().length > 0 ? firstName.trim() : false;
  lastName = typeof (lastName) == 'string' && lastName.trim().length > 0 ? lastName.trim() : false;
  phone = typeof (phone) == 'string' && phone.trim().length >= 10 ? phone.trim() : false;
  password = typeof (password) == 'string' && password.trim().length > 0 ? password.trim() : false;
  tosAgreement = typeof (tosAgreement) == 'boolean' && tosAgreement === true ? true : false;

  if (!(firstName && lastName && phone && password && tosAgreement)) {
    callback(400, { 'Error': 'Missing required fields' });
  } else {
    const hashedPassword = hashPassword(password);
    if (!hashedPassword) {
      callback(500, { 'Error': 'Could not hash the Password' });
    }

    const userObject = {
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      'hashedPassword': hashedPassword,
      'tosAgreement': true
    }

    //store user
    _data.create('users', phone, userObject, (err) => {
      if (err) {
        callback(500, { 'Error': 'Error occured. User probably exists' });
      }

      callback(201, { 'message': 'Successfully created' });
    });
  }
}

handlers._users.put = (data, callback) => {
  let { firstName, lastName, phone, password } = data.payload;
  firstName = typeof (firstName) == 'string' && firstName.trim().length > 0 ? firstName.trim() : false;
  lastName = typeof (lastName) == 'string' && lastName.trim().length > 0 ? lastName.trim() : false;
  phone = typeof (phone) == 'string' && phone.trim().length >= 10 ? phone.trim() : false;
  password = typeof (password) == 'string' && password.trim().length > 0 ? password.trim() : false;

  if (!phone) {
    callback(400, { 'Error': 'Missing required field phone' });
  }

  if (firstName || lastName || password) {
    const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
    verifyToken(token, phone, (tokenIsValid) => {
      if (!tokenIsValid) {
        callback(403, { 'Aunthenticaton': 'You are not authorized. Token expired or missing' });
      }

      _data.read('users', phone, (err, data) => {
        if (!err) {
          let hashedPassword;
          if (password) {
            hashedPassword = hashPassword(password);
            if (!hashedPassword) {
              callback(500, { 'Error': 'Could not hash the Password' });
            }
          }

          const userObject = {
            'firstName': firstName || data.firstName,
            'lastName': lastName || data.lastName,
            'phone': data.phone,
            'hashedPassword': hashedPassword || data.hashedPassword,
          }

          _data.update('users', phone, userObject, (err) => {
            if (err) {
              callback(500, { 'Error': 'Could not update the user' });
            }

            callback(200, { 'Message': 'Updated successfully' })
          });
        } else {
          callback(400, { 'Error': 'That phone number does not exist' });
        }
      });
    });
  } else {
    callback(400, { 'Error': 'Missing field to be updated' });
  }
}

handlers._users.delete = (data, callback) => {
  const { phone } = data.queryStringObject;
  let phoneNumber = typeof (phone) === 'string' && phone.trim().length >= 10 ? phone.trim() : false;
  if (!phoneNumber) {
    callback(400, { 'Error': 'Phone number not provided' });
  }

  const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
  verifyToken(token, phone, (tokenIsValid) => {
    if (!tokenIsValid) {
      callback(403, { 'Aunthenticaton': 'You are not authorized. Token expired or missing' });
    }
    _data.read('users', phoneNumber, (err, userData) => {
      if (err) {
        callback(404, { 'Error': 'User not found' });
      }

      _data.delete('users', phoneNumber, (err, data) => {
        if (err) {
          callback(500, { 'Error': 'Could not delete the user' });
        }

        userData.checks.forEach(checkId => {
          _data.delete('checks', checkId, (err) => {
            if (err) {
              callback(500, { 'Error': 'Error occured when deleting checks' });
            }
          });
        });

        callback(200, { 'Message': 'Deleted successfully' });
      });
    });
  });
}

handlers.ping = (data, callback) => {
  callback(200);
}

handlers.notFound = (data, callback) => {
  callback(404)
}

module.exports = handlers;

const _data = require('./data');
const hashPassword = require('../helpers/hashPassword');

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

}

handlers._users.post = (data, callback) => {
  let { firstName, lastName, phone, password, tosAgreement } = data.payload;
  firstName = typeof (firstName) == 'string' && firstName.trim().length > 0 ? firstName.trim() : false;
  lastName = typeof (lastName) == 'string' && lastName.trim().length > 0 ? lastName.trim() : false;
  phone = typeof (phone) == 'string' && phone.trim().length > 10 ? phone.trim() : false;
  password = typeof (password) == 'string' && password.trim().length > 0 ? password.trim() : false;
  tosAgreement = typeof (tosAgreement) == 'boolean' && tosAgreement === true ? true : false;

  if (!(firstName && lastName && phone && password && tosAgreement)) {
    callback(400, { 'Error': 'Missing required fields' });
  }

  _data.read('users', phone, (err, data) => {
    if (!err) {
      callback(400, { 'Error': 'User with that phone number already exists' });
    }

    const hashPassword = hashPassword(password);
    if (!hashPassword) {
      callback(500, { 'Error': 'Could not hash the Password' });
    }

    const userObject = {
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      'hashedPassword': hashPassword,
      'tosAgreement': true
    }

    //store user
    _data.create('users', phone, userObject, (err) => {
      if (err) {
        callback(500, { 'Error': 'Could not create new user' });
      }

      callback(200)
    });
  });
}

handlers._users.put = (data, callback) => {

}

handlers._users.delete = (data, callback) => {

}

handlers.ping = (data, callback) => {
  callback(200);
}

handlers.notFound = (data, callback) => {
  callback(404)
}

module.exports = handlers;

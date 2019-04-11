const _data = require('./data');
const config = require('../config');
const createRandomString = require('../helpers/createRandomString');
const { verifyToken } = require('./tokenHandlers')._tokens;

const handlers = {};

handlers.checks = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) < -1) {
    callback(405);
  }

  handlers._checks[data.method](data, callback);
};

handlers._checks = {};

handlers._checks.get = (data, callback) => {
  let { checkId } = data.queryStringObject;
  checkId = typeof (checkId) === 'string' && checkId.trim().length >= 20 ? checkId.trim() : false;
  if (!checkId) {
    callback(400, { 'Error': 'check id not provided' });
  }

  _data.read('checks', checkId, (err, checksData) => {
    if (err || !checksData) {
      callback(404, { 'error': 'check data for that id may not exist' });
    }

    const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
    verifyToken(token, checksData.phone, (tokenIsValid) => {
      if (!tokenIsValid) {
        callback(403, { 'Aunthenticaton': 'You are not authorized.Token expired or missing' });
      }

      callback(200, checksData);
    });
  });
}

handlers._checks.post = (data, callback) => {
  let { protocol, url, method, successCodes, timeoutSeconds } = data.payload;
  protocol = typeof (protocol) == 'string' && ['http', 'https'].indexOf(protocol) > -1 ? protocol : false;
  url = typeof (url) == 'string' && url.trim().length > 0 ? url.trim() : false;
  method = typeof (method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(method) > -1 ? method : false;
  successCodes = typeof (successCodes) == 'object' && successCodes instanceof Array && successCodes.length > 0 ? successCodes : false;
  timeoutSeconds = typeof (timeoutSeconds) == 'number' && timeoutSeconds % 1 === 0 && timeoutSeconds >= 1 && timeoutSeconds <= 5 ? timeoutSeconds : false;

  if (!protocol || !url || !method || !successCodes || !timeoutSeconds) {
    callback(400, { 'Error': ' Missing inputs or inputs are invalid' });
  }

  const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
  _data.read('tokens', token, (err, tokenData) => {
    if (err || !tokenData) {
      callback(403, { 'Error': 'You are not authorized' });
    }

    const { phone } = tokenData;
    _data.read('users', phone, (err, userData) => {
      if (err || !userData) {
        callback(403, { 'Error': 'An error occured. User might nnot exist' });
      }

      let userChecks = typeof (userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
      if (userChecks.length < config.maxChecks) {
        const checkId = createRandomString(20);
        const checkObj = {
          checkId,
          phone,
          protocol,
          url,
          method,
          successCodes,
          timeoutSeconds
        }
        _data.create('checks', checkId, checkObj, (err) => {
          if (err) {
            callback(500, { 'Error': 'Could not create new check' })
          }

          userData.checks = userChecks;
          userData.checks.push(checkId);
          _data.update('users', phone, userData, (err) => {
            if (err) {
              callback(500, { 'error': 'Could not update user with new check' });
            }
            callback(200, checkObj);
          })
        });
      } else {
        callback(400, { 'Error': `User has already more than max checks:${config.maxChecks}` });
      }
    });
  });
}

handlers._checks.put = (data, callback) => {
  let { checkId } = data.queryStringObject;
  checkId = typeof (checkId) === 'string' && checkId.trim().length == 20 ? checkId.trim() : false;
  let { protocol, url, method, successCodes, timeoutSeconds } = data.payload;
  protocol = typeof (protocol) == 'string' && ['http', 'https'].indexOf(protocol) > -1 ? protocol : false;
  url = typeof (url) == 'string' && url.trim().length > 0 ? url.trim() : false;
  method = typeof (method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(method) > -1 ? method : false;
  successCodes = typeof (successCodes) == 'object' && successCodes instanceof Array && successCodes.length > 0 ? successCodes : false;
  timeoutSeconds = typeof (timeoutSeconds) == 'number' && timeoutSeconds % 1 === 0 && timeoutSeconds >= 1 && timeoutSeconds <= 5 ? timeoutSeconds : false;

  if (!checkId) {
    callback(400, { 'Error': 'CHeck Id not provided' });
  }

  if (protocol || url || method || successCodes || timeoutSeconds) {
    _data.read('checks', checkId, (err, checksData) => {
      if (err || !checksData) {
        callback(404, { 'error': 'Error occured.Check data for that id may not exist' });
      }

      const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
      verifyToken(token, checksData.phone, (tokenIsValid) => {
        if (!tokenIsValid) {
          callback(403, { 'Aunthenticaton': 'You are not authorized.Token expired or missing' });
        } else {
          const { phone } = checksData;
          _data.read('users', phone, (err, userData) => {
            if (err || !userData) {
              callback(403, { 'Error': 'An error occured. User may no longer exist' });
            }

            const checkObj = {
              'checkId': checksData.checkId,
              'phone': checksData.phone,
              'protocol': protocol || checksData.protocol,
              'url': url || checksData.url,
              'method': method || checksData.method,
              'successCodes': successCodes || checksData.successCodes,
              'timeoutSeconds': timeoutSeconds || checksData.timeoutSeconds
            }
            _data.update('checks', checkId, checkObj, (err) => {
              if (err) {
                callback(500, { 'Error': 'Could not update the check' })
              }

              callback(200, checkObj);
            });
          });
        }
      });
    });
  } else {
    callback(400, { 'Error': 'Required one or more fields' });
  }
};

handlers._checks.delete = (data, callback) => {
  let { checkId } = data.queryStringObject;
  checkId = typeof (checkId) === 'string' && checkId.trim().length >= 20 ? checkId.trim() : false;
  const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;

  if (!checkId) {
    callback(400, { 'Error': 'Required params checkId is missing' });
  }
  _data.read('checks', checkId, (err, checksData) => {
    if (err || !checksData) {
      callback(404, { 'error': 'Error occured.Check data for that id may not exist' });
    } else {
      const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
      verifyToken(token, checksData.phone, (tokenIsValid) => {
        if (!tokenIsValid) {
          callback(403, { 'Aunthenticaton': 'You are not authorized.Token expired or missing' });
        }

        _data.delete('checks', checkId, (err) => {
          if (err) {
            callback(500, { 'Error': 'Error occured while deleting check', checkId });
          }

          _data.read('users', checksData.phone, (err, userData) => {
            if (err || !userData) {
              callback(403, { 'Error': 'An error occured. User might nnot exist' });
            }

            userData.checks = userData.checks.filter(check => check !== checkId);
            _data.update('users', checksData.phone, userData, (err, newuserData) => {
              if (err) {
                callback(500, { 'error': 'Could not update user checks' });
              }
              callback(200, { 'Success': 'Check deleted successfully' });
            })
          });
        });
      });
    }
  });
}

module.exports = handlers;

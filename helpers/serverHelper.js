const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;

const parsesJson = require('./parseJson');
const userHandlers = require('../lib/handlers');
const tokenHandlers = require('../lib/tokenHandlers');


const router = {
  'ping': userHandlers.ping,
  'users': userHandlers.users,
  'tokens': tokenHandlers.tokens
};
const unifiedServer = (req, res) => {
  const parseUrl = url.parse(req.url, true);
  const path = parseUrl.pathname;
  const trimPath = path.replace(/^\/+|\/+$/g, '');
  const method = req.method.toLowerCase();
  const queryString = parseUrl.query;
  const headers = req.headers;
  const decoder = new stringDecoder('utf-8');
  const stream = '';
  let buffer = '';

  req.on('data', (data) => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();
    const choosenHandler = typeof (router[trimPath]) !== 'undefined' ? router[trimPath] : userHandlers.notFound;
    const data = {
      'trimPath': trimPath,
      'queryStringObject': queryString,
      'method': method,
      'headers': headers,
      'payload': parsesJson(buffer)
    }

    choosenHandler(data, (statusCode, payload) => {
      statusCode = typeof (statusCode) == 'number' ? statusCode : 200;
      payload = typeof (payload) === 'object' ? payload : {};

      const payloadString = JSON.stringify(payload);
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(statusCode);
      res.end(payloadString);

      console.log('Returning this Response ', statusCode, payloadString);
    });
  });
}

module.exports = unifiedServer;

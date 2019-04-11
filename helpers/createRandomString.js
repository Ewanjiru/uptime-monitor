function createRandomString(length) {
  length = typeof (length) === 'number' && length > 0 ? length : false;

  let possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let generatedStr = '';
  for (i = 1; i <= length; i++) {
    let char = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
    generatedStr += char;
  }

  return generatedStr;
};

module.exports = createRandomString;

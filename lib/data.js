const fs = require('fs');
const path = require('path');
const parsedJson = require('../helpers/parseJson');

let lib = {};

//base directory of file
lib.baseDir = path.join(__dirname, '/../.data');

//write data to file
lib.create = (dir, file, data, callback) => {
  fs.open(`${lib.baseDir}/${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
    if (err) {
      callback('could not create the file it might already exist');
    }

    //convert data to string
    const stringData = JSON.stringify(data);
    fs.writeFile(fileDescriptor, stringData, (err) => {
      if (err) {
        callback('Error writing to new File');
      }

      fs.close(fileDescriptor, (err) => {
        if (err) {
          callback('Error closing new File');
        }
        callback(false);
      });
    });
  });
};

lib.read = (dir, file, callback) => {
  fs.readFile(`${lib.baseDir}/${dir}/${file}.json`, (err, data) => {
    let parsedData = parsedJson(data);
    if (err) {
      callback(err, data);
    }
    callback(false, parsedData);
  });
};

lib.update = (dir, file, data, callback) => {
  fs.open(`${lib.baseDir}/${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
    if (err) {
      callback('Could not open file for update. It may not exist yet');
    }

    const stringData = JSON.stringify(data);
    fs.ftruncate(fileDescriptor, (err) => {
      if (err) {
        callback("error truncating file");
      }

      fs.writeFile(fileDescriptor, stringData, (err) => {
        if (err) {
          callback("error writing to existing file");
        }

        fs.close(fileDescriptor, (err) => {
          if (err) {
            callback("error closing the file");
          }

          callback(false);
        });
      });
    });
  });
};

lib.delete = (dir, file, callback) => {
  //unlinking==> removing file from fs
  fs.unlink(`${lib.baseDir}/${dir}/${file}.json`, (err, data) => {
    if (err) {
      callback("Error while deleting file");
    }

    let parsedData = parsedJson(data);
    callback(false, parsedData);
  });
};

module.exports = lib;

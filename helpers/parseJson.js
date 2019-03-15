const parsesJson = (str) => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (ex) {
    return {};
  }
}

module.exports = parsesJson;

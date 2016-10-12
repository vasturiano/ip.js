var collection = require('./collection');

module.exports = {
    Addr: require('./single'),
    Prefix: collection.Prefix,
    Range: collection.Range
};
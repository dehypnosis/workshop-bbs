const dateformat = require('dateformat');

module.exports = {
  date: (date, format = 'mm/dd HH:MM') => {
    return dateformat(date, format);
  }
};
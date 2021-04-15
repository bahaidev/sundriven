/**
 * @param {Date} date
 * @returns {Date}
 */
function incrementDate (date) {
  if (!date) {
    date = new Date();
  }
  date.setDate(date.getDate() + 1);
  return date;
}

export {incrementDate};

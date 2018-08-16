/**
 * https://stackoverflow.com/questions/33769178/moment-js-decimals-into-time-format
*/
module.exports = function decimalHoursToString (hours) {
  return ('' + Math.floor(hours) % 24).slice(-2) + 'h ' + ((hours % 1) * 60 + '0').slice(0, 2) + 'min'
}

/**
 * Standard API response helper
 * @param {import('express').Response} res 
 * @param {*} data 
 * @param {number} [statusCode=200] 
 */
const success = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

module.exports = {
  success
};

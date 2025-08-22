const express = require('express');
const account = require('./accountRoute.js');
const person = require('./personRoute.js');
const business = require('./businessRoute.js');
const auth = require('./authRoute.js');
const { notFoundHandler, errorHandler } = require('../middlewares/error/errorHandler.js');

module.exports = app => {
    app.use(express.json());
  
    app.use(account);
    app.use(person);
    app.use(business);
    app.use(auth);
    app.use(notFoundHandler);
    app.use(errorHandler);
};
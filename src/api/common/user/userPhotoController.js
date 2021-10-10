
const express = require('express');
const path = require('path');

const UserService = require('./userService');

const router = express.Router();
const userService = new UserService();

router.get('/', (req, res) => {
  userService
    .getPhoto(req.query.token)
    .then(photo => {
      const filePath = path.join(__dirname, `../../../../assets/${photo}`);

      res.sendFile(filePath);
    }).catch((error) => {
      res.status(400).send({ error: error.message });
    });
});

module.exports = router;

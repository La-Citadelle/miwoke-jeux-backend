
const express = require('express');

const router = express.Router();

const PartieService = require('./partiesService');

const partieService = new PartieService();

router.get('/', (req, res) => {
  partieService
    .findById(req.user.id)
    .then(user => res.send(user));
});

module.exports = router;

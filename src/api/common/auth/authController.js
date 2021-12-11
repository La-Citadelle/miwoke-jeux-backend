
const express = require('express');
const passport = require('passport');

const cipher = require('../auth/cipherHelper');
const AuthService = require('./authService');

const router = express.Router();
const authService = new AuthService();
const auth = passport.authenticate('jwt', { session: false });

router.post('/login', (req, res) => {
  authService
    .findUserForAuth(req.body)
    .then((user) => {
      if (!user) {
        res.status(404).send({
          error: 'User not found.',
        });
      } else {
        req.login(user, { session: false }, (error) => {
          if (error) {
            res.send(error);
          }
    
          const response = { token: cipher.generateResponseTokens(user) };
          res.send(response);
        });
      }
    });
});

router.post('/sign-up', (req, res) => {
  authService
    .register(req.body)
    .then(user => {
      const response = { token: cipher.generateResponseTokens(user) };

      res.send(response);
    })
    .catch(err => res.status(400).send({ error: err.message }));
});

router.post('/reset-pass', auth, (req, res) => {
  const { id } = req.user;
  const { password, confirmPassword, resetPasswordToken } = req.body;

  authService
    .resetPassword(password, confirmPassword, id, resetPasswordToken)
    .then(() => res.send({ message: 'ok' }))
    .catch(err => {
      res.status(400).send({ error: err.message });
    });
});

router.post('/request-pass', (req, res) => {
  const { fullName } = req.body;
  authService
    .requestPassword(fullName)
    .then(() => res.send({ message: `Email with reset password instructions was sent to email ${email}.` }))
    .catch((error) => {
      res.status(400).send({ data: { errors: error.message } });
    });
});

router.post('/sign-out', (req, res) => {
  res.send({ message: 'ok' });
});

router.post('/refresh-token', (req, res) => {
  const token = req.body;
  authService
    .refreshToken(token.payload)
    .then(responseToken => res.send({ token: responseToken }))
    .catch(err => res.status(400).send({ error: err.message }));
});

module.exports = router;

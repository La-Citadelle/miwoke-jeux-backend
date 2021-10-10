
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const bodyParser = require('body-parser');
const config = require('config');
const swaggerUi = require('swagger-ui-express');

const swaggerDocument = require('./swagger.json');
const logger = require('./utils/logger');

require('./passport');

// common controllers
const authController = require('./api/common/auth/authController');
const userController = require('./api/common/user/userController');
const userPhotoController = require('./api/common/user/userPhotoController');
const settingsController = require('./api/common/settings/settingsController');

//common socket
const partiesHandlers = require("./api/socket/partieHandler");
const messageHandlers = require("./api/socket/chatTestHandler");

const SeedService = require('./api/seedService');
const seedService = new SeedService();

const app = express();
const httpServer = require('http').createServer(app);
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"]
});
const { port, root } = config.get('api');

function logErrors(err, req, res, next) {
  logger.error(err);
  next(err);
}

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send({ error: 'Something went wrong.' });
  } else {
    next(err);
  }
}

app.use(cors());
app.use(bodyParser.json());

const auth = passport.authenticate('jwt', { session: false });

const customSwaggerOptions = {
  showExplorer: true,
  swaggerOptions: {
    authAction: {
      JWT: {
        name: 'JWT',
        schema: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'Bearer <my own JWT token>',
        },
        value: 'Bearer <my own JWT token>',
      },
    },
  },
};

app.use(`${root}/swagger`, (req, res, next) => {
  swaggerDocument.host = req.get('host');
  req.swaggerDoc = swaggerDocument;
  next();
}, swaggerUi.serve, swaggerUi.setup(null, customSwaggerOptions));

// seed data in case of empty data base
seedService.checkAndSeed();

// routes for common controllers
app.use(`${root}/auth`, authController);
// TODO: fix photo, it temporary solution
app.use(`${root}/users/:userId/photo`, userPhotoController);

app.use(`${root}/users`, auth, userController);
app.use(`${root}/settings`, auth, settingsController);


app.use(logErrors);
app.use(clientErrorHandler);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/html', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log(`Socket ${socket.id} has connected`);

  messageHandlers(io, socket);
  partiesHandlers(io, socket);

  socket.on('disconnect', () => {
    // console.log(`Socket ${socket.id} has disconnected`);
    socket.leave('parties');
  });
});

httpServer.listen(port);

logger.info(`Server start listening port: ${port}`);
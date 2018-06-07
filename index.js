require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const rfs = require('rotating-file-stream');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

const apiRouter = require('./routes/api.js');

const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbName = process.env.DB_NAME;
const mongoDB = `mongodb://${dbHost}:${dbPort}/${dbName}`;

mongoose
  .connect(mongoDB)
  .then(() => console.log('Connected to Mongo...'))
  .catch(err => console.log(err.message));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
// Logger
if (process.env.NODE_ENV === 'development') {
  const logDir = path.join(__dirname, '/logs');

  fs.existsSync(logDir) || fs.mkdirSync(logDir);

  const accessLogStream = rfs('access.log', {
    interval: '1d', // rotate daily
    path: logDir
  });
  app.use(
    morgan('tiny', {
      stream: accessLogStream
    })
  );
  console.log('Logger running...');
}

// Routes
app.use('/api', apiRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});

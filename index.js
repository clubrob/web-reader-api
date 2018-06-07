require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

const apiRouter = require('./routes/api.js');

const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbName = process.env.DB_NAME;
const mongoDB = `mongodb://${dbHost}:${dbPort}/${dbName}`;
mongoose.connect(mongoDB)
  .then(() => console.log('Connected to Mongo...'))
  .catch(err => console.log(err.message));

// Middleware
app.use(express.json());
app.use(helmet());

// Routes
app.use('/api', apiRouter);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('tiny'));
  console.log('Morgan running...');
}

const port = process.env.PORT || 3000;

app.listen(port, () => { 
  console.log(`http://localhost:${port}`);
});

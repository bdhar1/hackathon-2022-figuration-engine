const express = require("express");
const rootDir = require("./utils/path");
const bodyParser = require('body-parser');
const cors = require('cors');

// Controllers and Routes
const errorController = require('./controllers/error');
const apiRoutes = require('./routes/api');

const app = express();

// Set boilerplate Middlewares
app.use(bodyParser.json());
app.use(cors());

// Set Custom Routes
app.use('/api', apiRoutes);

// Set 404 Route
app.use(errorController.get404);

// Start Server
app.listen(30000);
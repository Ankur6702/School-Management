// NPM Packages
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Local functions
const connectDB = require("./db");
const logger = require('./logger');

connectDB();
const app = express();
app.use(express.json());
const port = process.env.PORT || 9999;
const swaggerDocument = YAML.load('./swagger.yml');

// Routes
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/teacher', require('./routes/teacherRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/library', require('./routes/libraryRoutes'));
app.use('/api/account', require('./routes/accountRoutes'));
app.use('/api/', require('./routes/commonRoutes'));

app.get('/', (req, res) => {
    res.send('Server Working');
});

app.listen(port, () => {
    logger.info(`🚀 Listening at http://localhost:${port}`);
});
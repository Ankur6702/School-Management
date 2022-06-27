const connectDB = require("./db");
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yml');

connectDB();
const app = express();
app.use(express.json());
const port = process.env.PORT || 9999;

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/teacher', require('./routes/teacherRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
// app.use('/api/parent', require('./routes/parentRoutes'));
app.use('/api/librarian', require('./routes/libraryRoutes'));
app.use('/api/accountant', require('./routes/accountRoutes'));
app.use('/api/', require('./routes/commonRoutes'));

app.get('/', (req, res) => {
    res.send('Server Working');
});

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});
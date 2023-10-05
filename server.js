const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

// Database Connection
mongoose.connect(DB).then(() => console.log('Database connection successful!'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listing on ${port}`);
});

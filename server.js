const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Uncaught Error or Exception handle--
process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    // console.log(err.name, err.message);
    console.log(err);

    process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

// Database Connection
mongoose.connect(DB).then(() => console.log('Database connection successful!'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Server is listing on ${port}`);
});

// Unhandled Promise Rejection handle--
process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    // console.log(err.name, err.message);
    console.log(err);

    server.close(() => {
        process.exit(1);
    });
});

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        console.log('💥 Process terminated!');
    });
});

// console.log(process.env.NODE_ENV);
// console.log(app.get('env')); // Express set-Environment-variable
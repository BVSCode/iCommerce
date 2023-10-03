const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello world!');
});

app.post('/api', (req, res) => {
    console.log(req.body);
    res.send('Hello world Post!');
});

module.exports = app;
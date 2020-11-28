const express = require('express');
const next = require('next');

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
const bodyParser = require('body-parser');

app.prepare().then(() => {
    const server = express();
    server.use(bodyParser.urlencoded({ extended: true }))
    server.use(bodyParser.json())

    server.get('/', (req, res) => {
        return app.render(req, res, '/', req.query);
    })

    server.get('/new', (req, res) => {
        return app.render(req, res, '/new', req.query);
    });

    server.get('/detail/:address', (req, res) => {
        return app.render(req, res, '/detail', {address: req.params.address});
    });

    server.listen(port, err => {
        if (err) {
            throw err;
        }
        console.log(`> Ready on http://localhost:${port}`);
    });
});
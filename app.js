const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const express = require('express');
const bodyParser = require('body-parser');
const log4js = require('log4js');

const logger = log4js.getLogger('Server');
const app = express();

logger.level = 'info';

try {
    exec('whoami', (err, stdout, stderr) => {
        if (err) {
            logger.error(err);
            process.exit(0);
        }
        if (stdout.trim() != 'root') {
            logger.info('Please run this as root user');
            process.exit(0);
        }
        fs.statSync('/etc/nginx/nginx.conf');
        const DEFAULT_ROUTE = fs.readFileSync(path.join(__dirname, 'DEFAULT_ROUTE'), 'utf8');
        fs.writeFileSync('/etc/nginx/sites-enabled/easy-nginx', DEFAULT_ROUTE, 'utf8');
        exec('sudo service nginx restart', (err2, stdout2, stderr2) => {
            if (err2) {
                logger.error(err2);
                process.exit(0);
            } else {
                logger.info('UI running on http://localhost/easy-nginx');
            }
        });
    });
} catch (e) {
    logger.error('Please install nginx (sudo apt install nginx)');
}

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    const paths = req.path.split('/');
    if (paths.indexOf('sites') > -1 || paths.indexOf('restart') > -1) {
        if (!req.headers.username || !req.headers.password) {
            res.status(401).json({ message: 'Unauthorised' });
            return;
        }
        try {
            let user = fs.readFileSync(path.join('./USER'), 'utf8');
            if (user) {
                user = JSON.parse(user);
            }
            if (user.username != req.headers.username || user.password != req.headers.password) {
                res.status(401).json({ message: 'Unauthorised' });
            } else {
                next();
            }
        } catch (e) {
            logger.info(e);
            res.status(401).json({ message: 'Unauthorised' });
        }
    } else {
        next();
    }
});

app.get('/sites', (req, res) => {
    try {
        const sites = fs.readdirSync('/etc/nginx/sites-enabled/', 'utf8');
        res.json(sites);
    } catch (e) {
        logger.error(e);
        res.status(500).json({ message: e.message });
    }
});

app.post('/sites', (req, res) => {
    if (!req.body.name || !req.body.content) {
        res.status(400).json({ message: 'Bad Parameters' });
        return;
    }
    try {
        fs.writeFileSync('/etc/nginx/sites-enabled/' + req.body.name, req.body.content, 'utf8');
        res.status(200).json({ message: 'Configuration saved' });
    } catch (e) {
        logger.error(e);
        res.status(500).json({ message: e.message });
    }
});

app.get('/sites/:id', (req, res) => {
    if (!req.params.id) {
        res.status(400).json({ message: 'Bad Parameters' });
        return;
    }
    try {
        const siteContent = fs.readFileSync('/etc/nginx/sites-enabled/' + req.params.id, 'utf8');
        res.json({ content: siteContent });
    } catch (e) {
        logger.error(e);
        res.status(500).json({ message: e.message });
    }
});

app.put('/sites/:id', (req, res) => {
    if (!req.params.id || !req.body.content) {
        res.status(400).json({ message: 'Bad Parameters' });
        return;
    }
    try {
        fs.writeFileSync('/etc/nginx/sites-enabled/' + req.params.id, req.body.content, 'utf8');
        res.status(200).json({ message: 'Configuration updated' });
    } catch (e) {
        logger.error(e);
        res.status(500).json({ message: e.message });
    }
});

app.delete('/sites/:id', (req, res) => {
    if (!req.params.id) {
        res.status(400).json({ message: 'Bad Parameters' });
        return;
    }
    try {
        fs.unlinkSync('/etc/nginx/sites-enabled/' + req.params.id);
        res.status(200).json({ message: 'Configuration deleted' });
    } catch (e) {
        logger.error(e);
        res.status(500).json({ message: e.message });
    }
});

app.put('/restart', (req, res) => {
    exec('sudo service nginx restart', (err2, stdout2, stderr2) => {
        if (err2) {
            res.status(500).json({ message: err2.message });
        } else {
            res.status(200).json({ message: 'Nginx restarted' });
        }
    });
});

app.post('/login', (req, res) => {
    if (!req.body.username || !req.body.password) {
        res.status(400).json({ message: 'Username/Password invalid' });
        return;
    }
    try {
        let user = fs.readFileSync(path.join('./USER'), 'utf8');
        if (user) {
            user = JSON.parse(user);
        }
        if (user.username != req.body.username || user.password != req.body.password) {
            res.status(400).json({ message: 'Username/Password invalid' });
        } else {
            res.status(200).json({ username: user.username, password: user.password });
        }
    } catch (e) {
        logger.info(e);
        res.status(500).json({ message: e.message });
    }
});

app.post('/setup', (req, res) => {
    if (!req.body.username || !req.body.password || !req.body.cpassword) {
        res.status(400).json({ message: 'All fields are mandatory' });
        return;
    }
    if (req.body.password !== req.body.cpassword) {
        res.status(400).json({ message: 'Passwords do not match' });
        return;
    }
    try {
        fs.readFile(path.join(__dirname, 'USER'), 'utf8', ((err, data) => {
            if (!err && data) {
                res.status(401).json({ message: 'User exist' });
                return;
            }
            delete req.body.cpassword;
            fs.writeFileSync(path.join(__dirname, 'USER'), JSON.stringify(req.body), 'utf8');
            res.status(200).json({ message: 'User created, redirecting...' });
        }));
    } catch (e) {
        logger.error(e);
        res.status(500).json({ message: e.message });
    }
});

app.get('/', (req, res) => {
    try {
        fs.readFileSync(path.join('./USER'), 'utf8');
        res.sendFile(path.join(__dirname, 'index.html'));
    } catch (e) {
        logger.info('User not created');
        res.sendFile(path.join(__dirname, 'init.html'));
    }
})

const server = app.listen(8888, () => {
    logger.info('App running on port', server.address().port);
});
const express = require('express');
const request = require('request');
const cheerio = require('cheerio');
const RSVP = require('rsvp');

const app = express();
const port = 3000;

// Function to fetch the title of single url
function fetchTitle(url, callback) {
    request(url, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            const $ = cheerio.load(body);
            
            const title = $("head > title").text();
            callback(null, title);
        } else {
            if(error.code = 'ENOTFOUND') {
                callback('NO RESPONSE', null);
            }
        }
    });
}

// Function which return title in promise
const getTitle = url => {
    const promise = new RSVP.Promise(function(resolve, reject) {
        fetchTitle(url, (err, title) => {
            if(!err) {
                resolve(title);
            } else {
                reject(err);
            }
        })
    });
    return promise;
}
  

app.get('/', async (req, res) => {
    const { address = [] } = req.query;
    if (address.length === 0) {
        res.send([])
    }
    const titles = [];
    for(let i =0;  i < address.length; i ++) {
        const finalAddress = address[i].startsWith('http') ? address[i] : `http://${address[i]}`;
        fetchTitle(finalAddress, (err, title) => {
            if(!err) {
                titles.push(`${finalAddress} ${title}`)
            } else {
                titles.push(`${finalAddress} ${err}`);
            }
            if(titles.length === address.length) {
                res.send(titles)
            }
        })
    };
});

app.get('/promise', async (req, res) => {
    const { address = [] } = req.query;
    if (address.length === 0) {
        res.send([]);
    } else {
        const addresses = address.map(async address => {
            let result = {};
            try {
                const finalAddress = address.startsWith('http') ? address : `http://${address}`
                const title = await getTitle(finalAddress);
                result = title;
            } catch(error) {
                result = error;
            }
            result = `${address} ${result}`;
            return result;
        });
        const metas = await Promise.all(addresses);
        res.send(metas);
    }
});

app.get('/promise-loop', async (req, res) => {
    const { address = [] } = req.query;
    if (address.length === 0) {
        res.send([])
    }
    const titles = [];
    for(let i =0;  i < address.length; i ++) {
        const finalAddress = address[i].startsWith('http') ? address[i] : `http://${address[i]}`
        getTitle(finalAddress).then((title) => {
            titles.push(`${address[i]} ${title}`);
            if(titles.length === address.length) {
                res.send(titles)
            }
        }).catch(() => {
            titles.push(`${address[i]} NO RESPONSE`);
            if(titles.length === address.length) {
                res.send(titles)
            }
        })
    };
});


app.listen(port, () => console.log(`App listening on port ${port}!`))
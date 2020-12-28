const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
const fs = require('fs');
const formidable = require('express-formidable');
const mongourl = 'mongodb+srv://ousam:1234@cluster0.vd3i3.mongodb.net/Test?retryWrites=true&w=majority';
const dbName = 'Test';
const colName = 'res';

const session = require('cookie-session');
const bodyParser = require('body-parser');
const SECRETKEY1 = 'I want to pass COMPS381F';
const SECRETKEY2 = 'Keep this to yourself';



const users = new Array({name: 'demo', password: ''}, {name: 'student', password: ''});

app.set('view engine', 'ejs');

app.use(session({
    name: 'session',
    keys: [SECRETKEY1, SECRETKEY2]
}));

// support parsing of application/json type post data
app.use(bodyParser.json());
// support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

const findDocument = (db, criteria, callback) => {
    let cursor = db.collection(colName).find(criteria);
    console.log(`findDocument: ${JSON.stringify(criteria)}`);
    cursor.toArray((err, docs) => {
        assert.equal(err, null);
        console.log(`findDocument: ${docs.length}`);
        callback(docs);
    });
}

const handle_Find = (res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        findDocument(db, criteria, (docs) => {
            client.close();
            console.log("Closed DB connection");
            res.status(200).render('list', { nData: docs.length, bookings: docs });

        });
    });
}

const handle_Details = (res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        /* use Document ID for query */
        let DOCID = {};
        DOCID['_id'] = ObjectID(criteria._id)
        findDocument(db, DOCID, (docs) => { // docs contain 1 document (hopefully)
            client.close();
            console.log("Closed DB connection");
            res.status(200).render('details', { booking: docs[0] });

        });
    });
}

const handle_Edit = (res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        /* use Document ID for query */
        let DOCID = {};
        DOCID['_id'] = ObjectID(criteria._id)
        let cursor = db.collection(colName).find(DOCID);
        cursor.toArray((err, docs) => {
            client.close();
            assert.equal(err, null);
            res.status(200).render('edit', { booking: docs[0] });

        });
    });
}

const updateDocument = (criteria, updateDoc, callback) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        db.collection(colName).updateOne(criteria, {
                $set: updateDoc
            },
            (err, results) => {
                client.close();
                assert.equal(err, null);
                callback(results);
            }
        );
    });
}

const insertDocument = (criteria, callback) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        db.collection(colName).insertOne(criteria,
            (err, results) => {
                client.close();
                assert.equal(err, null);
                callback(results);
            }
        );
    });
}

const handle_Insert = (req, res, criteria) => {
    var insertDoc = {};
    insertDoc['restaurant_id'] = req.fields.restaurant_id;
    insertDoc['name'] = req.fields.name;
    insertDoc['borough'] = req.fields.borough;
    insertDoc['cuisine'] = req.fields.cuisine;
    insertDoc['address'] = {
        'street': req.fields.street,
        'zipcode': req.fields.zipcode,
        'building': req.fields.building,
        'coord': { 'lat': req.fields.lat, 'lon': req.fields.lon }
    };

    if (req.files.filetoupload.size > 0) {
        fs.readFile(req.files.filetoupload.path, (err, data) => {
            assert.equal(err, null);
            insertDoc['photo'] = new Buffer.from(data).toString('base64');
            insertDocument(insertDoc, (results) => {
                res.redirect('/find');

            });
        });
    } else {
        insertDocument(insertDoc, (results) => {
            res.redirect('/find');

        });
    }
}

const handle_Update = (req, res, criteria) => {

    var DOCID = {};
    DOCID['_id'] = ObjectID(req.fields._id);
    var updateDoc = {};
    updateDoc['restaurant_id'] = req.fields.restaurant_id;
    updateDoc['name'] = req.fields.name;
    updateDoc['borough'] = req.fields.borough;
    updateDoc['cuisine'] = req.fields.cuisine;
    updateDoc['address'] = {
        'street': req.fields.street,
        'zipcode': req.fields.zipcode,
        'building': req.fields.building,
        'coord': { 'lat': req.fields.lat, 'lon': req.fields.lon }
    };
    if (req.files.filetoupload.size > 0) {
        fs.readFile(req.files.filetoupload.path, (err, data) => {
            assert.equal(err, null);
            updateDoc['photo'] = new Buffer.from(data).toString('base64');
            updateDocument(DOCID, updateDoc, (results) => {
                res.status(200).render('info', { message: `Updated ${results.result.nModified} document(s)` })

            });
        });
    } else {
        updateDocument(DOCID, updateDoc, (results) => {
            res.status(200).render('info', { message: `Updated ${results.result.nModified} document(s)` })

        });
    }

}


const deleteDocument = (res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
        //        console.log(`findDocument: ${JSON.stringify(doc)}, ${doc.owner} == ${name}?`);
        db.collection(colName).deleteOne(criteria,
            (err, results) => {
                client.close();
                assert.equal(err, null);
                console.log(`deleteDocument: ${JSON.stringify(results)}`);
                res.redirect('/find');
            }
        );


    })
}

const handle_Delete = (res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        let DOCID = {};
        DOCID['_id'] = ObjectID(criteria._id)
        findDocument(db, DOCID, (docs) => { // docs contain 1 document (hopefully)
            client.close();
            console.log("Closed DB connection");
            deleteDocument(res, DOCID);
        });
    })

}

app.get('/', (req, res) => {
    console.log(req.session);
    if (!req.session.authenticated) {
        res.redirect('/login');
    } else {
        res.redirect('/find');
    }
});

app.get('/login', (req, res) => {
    res.status(200).sendFile(__dirname + '/public/login.html');
});

app.post('/login', (req, res) => {
    users.forEach((user) => {
        if (user.name == req.body.name && user.password == req.body.password) {
            req.session.authenticated = true;
            req.session.username = user.name;
            res.redirect('/find');
        }
    });
    res.redirect('/');
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

app.get('/find', formidable(), (req, res) => {
    handle_Find(res, req.query.docs);
})

app.get('/details', formidable(), (req, res) => {
    handle_Details(res, req.query);
})

app.get('/edit', formidable(), (req, res) => {
    handle_Edit(res, req.query);
})

app.post('/update', formidable(), (req, res) => {
    handle_Update(req, res, req.query);
})


app.get('/insert', formidable(), (req, res) => {
    res.status(200).render('insert_res');
})


app.post('/new', formidable(), (req, res) => {
    handle_Insert(req, res, req.query);
})

app.get('/delete', formidable(), (req, res) => {
        handle_Delete(res, req.query);
})

app.get('/*', (req, res) => {
    //res.status(404).send(`${req.path} - Unknown request!`);
    res.status(404).render('info', { message: `${req.path} - Unknown request!` });
})

app.listen(app.listen(process.env.PORT || 8099));
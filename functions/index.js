const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const express = require('express');
const rp = require('request-promise');
const cheerio = require('cheerio');
const slugify = require('slugify');
const cors = require('cors')({ origin: true });
const { check, validationResult } = require('express-validator/check');

const app = express();

// Firebase token auth middleware function to protect routes
function authorizeMe(req, res, next) {
  let idToken;
  // Grab token from POST header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    idToken = req.headers.authorization.split('Bearer ')[1];
    // Firebase function to verify token
    admin.auth().verifyIdToken(idToken)
      .then(decoded => decoded)
      .then(() => next())
      .catch(err => {
        console.error(err.message);
        res.status(403).send('Unauthorized');
      });
    } else {
      res.status(403).send('Not Allowed');
    }
}

// For cross origin resource sharing 
app.use(cors);

//Routes... all routes protected
// GET one item
app.get('/read/:slug', authorizeMe, [
  // Validate slug
  check('slug').matches(/^[a-zA-Z0-9-_]+$/)
], (req, res) => {
  // Return input validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  // Firestore collection
  const collectionRef = admin.firestore().collection('clips');
  const query = collectionRef.where('slug', '==', req.params.slug);

  return query.get()
    .then(querySnapshot => {
      let results = [];
      if (querySnapshot.size > 0) {
        querySnapshot.forEach(doc => {
          results.push(doc.data());
        });
        return res.json(results);
      }
      return res.send('No such document');
    })
    .catch(err => {
      console.error('Document not found: ', err.message);
      return res.send('Document not found');
    });
});

// GET all items
app.get('/read', authorizeMe, (req, res) => {
  const collectionRef = admin.firestore().collection('clips');
  const query = collectionRef.orderBy('date');

  return query.get()
    .then(querySnapshot => {
      let results = [];
      querySnapshot.forEach(doc => {
        results.push(doc.data());
      });
      return res.json(results);
    })
    .catch(err => {
      console.error('Error getting documents: ', err);
      return res.send('Error getting documents');
    });
});

// GET tag list 
app.get('/tag/:tag', authorizeMe, [
  check('tag').isAlphanumeric()
], (req, res) => {
  // Return input validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const tag = req.params.tag;
  const collectionRef = admin.firestore().collection('clips');
  const query = collectionRef.where(`tags.${tag}`, '>', 0).orderBy(`tags.${tag}`);

  return query.get()
    .then(querySnapshot => {
      let results = [];
      if (querySnapshot.size > 0) {
        querySnapshot.forEach(doc => {
          results.push(doc.data());
        });
        return res.json(results);
      }
      return res.send('No such document');
    })
    .catch(err => {
      console.error('Document not found: ', err.message);
      return res.send('Document not found');
    });
});

// GET featured tag list 
app.get('/featured', (req, res) => {
  const collectionRef = admin.firestore().collection('clips');
  const query = collectionRef.where(`tags.featured`, '>', 0).orderBy(`tags.featured`, 'desc').limit(3);

  return query.get()
    .then(querySnapshot => {
      let results = [];
      if (querySnapshot.size > 0) {
        querySnapshot.forEach(doc => {
          results.push(doc.data());
        });
        return res.json(results);
      }
      return res.send('No such document');
    })
    .catch(err => {
      console.error('Document not found: ', err.message);
      return res.send('Document not found');
    });
});

// POST new item
app.post('/save', authorizeMe, [
  // Validate inputs
  check('url').not().isEmpty().isURL({ require_protocol: true }),
  check('tags.*').isAlphanumeric()
], (req, res) => {
  // Return input validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  // Reducer function for array to obj.
  const tagReducer = function(tagObj, tag) {
    if (!tagObj[tag]) {  // Skip duplicate tags
      tagObj[tag] = Date.now();
    }
    return tagObj;
  }
  // Grab POST content
  const clip = req.body;
  // Convert tags array to object. For querying in Firestore.
  let tags = {};
  if (req.body.tags.length > 0) {
    tags = req.body.tags.reduce(tagReducer, {});
  }

  return admin.firestore().collection('clips')
    .add({
      url: clip.url,
      tags: tags,
      date: Date.now()
    })
    .then((writeResult) => {
      return res.status(200).json({ result: `Item with ID: ${writeResult.id} added.`});
    })
    .catch(err => console.error(err.message));
});

// PUT update item
app.put('/save/:slug', authorizeMe, [
  // Validate slug
  check('slug').matches(/^[a-zA-Z0-9-_]+$/),
  check('title').not().isEmpty().escape(),
  check('summary').not().isEmpty().isLength({ max: 180 }).escape(),
  check('tags.*').isAlphanumeric()
], (req, res) => {
  // Return input validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  // Firestore collection
  const collectionRef = admin.firestore().collection('clips');
  const query = collectionRef.where('slug', '==', req.params.slug);

  // Reducer function for array to obj.
  const tagReducer = function(tagObj, tag) {
    if (!tagObj[tag]) {  // Skip duplicate tags
      tagObj[tag] = Date.now();
    }
    return tagObj;
  }
  // Grab POST content
  const clip = req.body;
  // Convert tags array to object. For querying in Firestore.
  let tags = {};
  if (req.body.tags.length > 0) {
    tags = req.body.tags.reduce(tagReducer, {});
  }

  return query.get()
    .then(querySnapshot => {
      let id = '';
      if (querySnapshot.size > 0) {
        querySnapshot.forEach(doc => {
          id = doc.id;
        });
        return collectionRef.doc(id);
      }
      return res.send('No such document');
    })
    .then(doc => {
      console.log('Updating... ', doc.id);
      return doc.update({
        title: clip.title,
        summary: clip.summary,
        tags: tags
      });
    })
    .then(result => {
      return res.status(200).send('Updated!');
    })
    .catch(err => {
      console.error('Error updating: ', err.message);
      return res.status(500).send('Error updating');
    });
});

// DELETE item
app.delete('/delete/:slug', authorizeMe, [
  // Validate slug
  check('slug').matches(/^[a-zA-Z0-9-_]+$/)
], (req, res) => {
  // Return input validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  // Firestore collection
  const collectionRef = admin.firestore().collection('clips');
  const query = collectionRef.where('slug', '==', req.params.slug);

  return query.get()
    .then(querySnapshot => {
      if (querySnapshot.size > 0) {
        querySnapshot.forEach(doc => {
          doc.ref.delete();
        });
        console.log('Document deleted.')
        return res.send('Document deleted.');
      }
      return res.send('No such document');
    })
    .catch(err => {
      console.error('Document not found: ', err.message);
      return res.send('Document not found');
    });
});

// HTTPS function
exports.reader = functions.https.onRequest(app);

// Trigger functions
// Simple web scraping function
exports.scrapeClip = functions.firestore.document('/clips/{documentId}').onCreate((snapshot, context) => {
  const url = snapshot.data().url;
  return rp(url)
    .then(page => {
      const $ = cheerio.load(page); // Cheerio for DOM parsing
      const jsonProps = {};
      // Check for open graph title, then meta title, then page title
      jsonProps.pageTitle =
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="title"]').attr('content') ||
        $('title').text() ||
        'No Title';
      // Check for open graph description, then meta description
      jsonProps.pageSummary =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        'No Summary';
      jsonProps.pageUrl = url;

      return jsonProps;
    })
    .then(jsonProps => {
      // Add random five-digit number so slugs are unique IDs
      const slugDigit = Math.floor(Math.random() * 90000) + 10000;
      const clipProps = {
        title: jsonProps.pageTitle,
        summary: jsonProps.pageSummary,
        slug: slugify(`${jsonProps.pageTitle}-${slugDigit}`, {
          remove: /[$*_+~.()'"!,?:@]/g
        })
      }
      console.log('Updating... ', context.params.documentId);
      return snapshot.ref.set({ 
        title: clipProps.title,
        summary: clipProps.summary,
        slug: clipProps.slug
      }, { merge: true });
    })
    .then(res => console.log('Added additional properties: ', res))
    .catch(err => console.error(err.message));
});

// Adding readable text from Mercury Reader API
exports.saveReadable = functions.firestore.document('/clips/{documentId}').onCreate((snapshot, context) => {
  const url = snapshot.data().url;
  const rpOptions = {
    uri: `https://mercury.postlight.com/parser?url=${url}`,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': functions.config().mercuryreader.key
    },
    json: true
  };

  console.log('Updating... ', context.params.documentId);
  return rp(rpOptions)
    .then(data => {
      return data;
    })
    .then(data => {
      return snapshot.ref.set({
        readable: data.content
      }, { merge: true });
    })
    .then(res => console.log('Added reader-friendly content: ', res))
    .catch(err => console.error(err.message));
});

// TODO dedupe tags after update

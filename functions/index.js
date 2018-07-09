const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const express = require('express');
const rp = require('request-promise');
const cheerio = require('cheerio');
const slugify = require('slugify');
const cors = require('cors')({ origin: true });

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
app.get('/read/:slug', authorizeMe, (req, res) => {
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
  return admin.firestore().collection('clips').get()
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
// POST new item
app.post('/save', authorizeMe, (req, res) => {
  const clip = req.body;

  // TODO validate input values

  return admin.firestore().collection('clips')
    .add({
      url: clip.url,
      tags: clip.tags,
      date: Date.now()
    })
    .then((writeResult) => {
      return res.status(200).json({ result: `Item with ID: ${writeResult.id} added.`});
    })
    .catch(err => console.error(err.message));
});
// PUT update item
app.put('/save/:slug', authorizeMe, (req, res) => {
  res.send('PUT');
});
// DELETE item
app.delete('/delete/:slug', authorizeMe, (req, res) => {
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

exports.reader = functions.https.onRequest(app);

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

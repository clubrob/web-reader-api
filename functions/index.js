const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const rp = require('request-promise');
const cheerio = require('cheerio');
const slugify = require('slugify');
const cors = require('cors')({ origin: true });

exports.readClips = functions.https.onRequest((request, response) => {
  return admin.firestore().collection('clips')
    .get().then(querySnapshot => {
      let results = [];
      querySnapshot.forEach(documentSnapshot => {
        results = results.push(documentSnapshot);
      });
      return response.status(200).json({ results: results});
    })
    .catch(err => {
      console.error(err.message);
      return response.status(403).json({ error: 'Unauthorized' });
    });
  /* if (request.method === 'GET') {
    cors(request, response, () => {
      let idToken;
      if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
        idToken = request.headers.authorization.split('Bearer ')[1];

        admin.auth().verifyIdToken(idToken)
          .then(decoded => decoded)
          .then(() => {
            return admin.firestore().collection('clips')
              .limit(1)
              .get();
          })
          .then(results => {
            return response.status(200).json({ results: results});
          })
          .catch(err => {
            console.error(err.message);
            return response.status(403).json({ error: 'Unauthorized' });
          });
      } 
      
      return response.status(500).json({ message: 'Not authorized ' });
    });
  }
  
  return response.status(500).json({ message: 'Not allowed.' }); */
});

exports.readClip = functions.https.onRequest((request, response) => {
  response.send("Read your clip!");
});

exports.createClip = functions.https.onRequest((request, response) => {
  if (request.method === 'POST') {
    cors(request, response, () => {
      let idToken;
      if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
        idToken = request.headers.authorization.split('Bearer ')[1];

        admin.auth().verifyIdToken(idToken)
          .then(decoded => decoded)
          .then((decoded) => {
            console.log(decoded);
            const clip = request.body;
        
            // TODO validate input values
    
            return admin.firestore().collection('clips')
              .add({
                url: clip.url,
                tags: clip.tags,
                date: clip.date || Date.now()
              });
          })
          .then((writeResult) => {
            return response.status(200).json({ result: `Message with ID: ${writeResult.id} added.`});
          })
          .catch(err => {
            console.error(err.message);
            return response.status(403).json({ error: 'Unauthorized' });
          });
      } 
      
      return response.status(500).json({ message: 'Not authorized ' });
    });
  }
  
  return response.status(500).json({ message: 'Not allowed.' });
});

/* exports.updateClip = functions.https.onRequest((request, response) => {
  response.send("Update your clips!");
});

exports.deleteClip = functions.https.onRequest((request, response) => {
  response.send("Delete your clips!");
}); */

exports.scrapeClip = functions.firestore.document('/clips/{documentId}').onCreate((snapshot, context) => {
  const url = snapshot.data().url;
  return rp(url)
    .then(page => {
      const $ = cheerio.load(page);
      const jsonProps = {};

      jsonProps.pageTitle =
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="title"]').attr('content') ||
        $('title').text() ||
        'No Title';
      jsonProps.pageSummary =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        'No Summary';
      jsonProps.pageUrl =
        url ||
        $('link[rel="canonical"]').attr('href') ||
        $('meta[property="og:url"]').attr('content');

      return jsonProps;
    })
    .then(jsonProps => {
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

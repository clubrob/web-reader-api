document.addEventListener('DOMContentLoaded', (event) => {
  const app = firebase.app();

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      console.log(firebase.auth().currentUser.displayName);
      firebase.auth().currentUser.getIdToken().then(token => {
        console.log(token);
      }).catch(err => console.error(err.message));
    } else {
      console.log('nobody signed in');
    }
  });
});

function appLogin() {
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
      // const provider = new firebase.auth.GoogleAuthProvider();
      const email = document.querySelector('#email').value,
      password = document.querySelector('#password').value;

      return firebase.auth().signInWithEmailAndPassword(email, password);
    })
    .then(result => {
      const user = result.user;
      console.log(user);
    })
    .catch(err => console.error(err.message));
}

function appLogout() {
  firebase.auth().signOut()
    .then(console.log('signed out'))
    .catch(err => console.error(err.message));
}

const loginBtn = document.querySelector('#login-button');
loginBtn.addEventListener('click', appLogin);
const logoutBtn = document.querySelector('#logout-button');
logoutBtn.addEventListener('click', appLogout);
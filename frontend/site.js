var config = {
    apiKey: "AIzaSyB5rXIDQNaZ0j7wvpqkXaww3nRmVsbS6IA",
    authDomain: "examensarbete-b0132.firebaseapp.com",
    databaseURL: "https://examensarbete-b0132.firebaseio.com",
    projectId: "examensarbete-b0132",
    storageBucket: "examensarbete-b0132.appspot.com",
    messagingSenderId: "684494303948"
};
var app = firebase.initializeApp(config);
var db = firebase.firestore(app);

window.onload = function () {
    initApp();
};

function initApp() {
    firebase.auth().onAuthStateChanged(function(user) {
        if(user){
            if(user.displayName == null){
                user.updateProfile({
                    displayName: "Jonas Johansson"
                }).then(function(){
                    var displayName = user.displayName;
                });
            }
            var email = user.email;
            document.getElementById('loggedin').innerText = email;
            document.getElementById('logOutButton').style.display = "block";
            document.getElementById('logInButton').style.display = "none";
            document.getElementById('email').style.display = "none";
            document.getElementById('password').style.display = "none";
            loadUserInterface();
        }else{
            document.getElementById('loggedin').innerText = "";
            document.getElementById('logOutButton').style.display = "none";
            document.getElementById('logInButton').style.display = "block";
            document.getElementById('password').style.display = "block";
            document.getElementById('email').style.display = "block";
        }
    });
}

function login() {
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;

    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;

        if(error.code === 'auth/wrong-password') {
            console.log("wrong password");
        }else  {
            console.log(errorMessage);
        }
    });
}

function logout() {
    firebase.auth().signOut().catch(function(err) {
        console.log(err);
    });
}

function loadUserInterface() {
    var content = '<div>' +
        '<input type="file" id="fileInput"/>' +
        '<select id="selectMenu">' +
        '<option>default</option>' +
        '</select>' +
        '</div>';

    getUsers();
    document.getElementById('content').innerHTML = content;
    document.getElementById('fileInput').addEventListener('change', uploadFile);
}

function getUsers() {
    var fragment = document.createDocumentFragment();

    db.collection('users').get().then(function(querySnapShot) {
        querySnapShot.forEach(function(doc) {
            var opt = document.createElement('option');
            opt.innerHTML = doc.data().email;
            opt.value = doc.data().uid;
            fragment.appendChild(opt);
        });
    }).then(() => {
        var selectMenu = document.getElementById('selectMenu');
        selectMenu.appendChild(fragment);
    });
}

function uploadFile(event) {
    var selectMenu = document.getElementById('selectMenu');
    var userId = selectMenu.options[selectMenu.selectedIndex].value;
    console.log(userId);
    var file = event.target.files[0];
    var storageRef = firebase.storage().ref(`/cv/${userId}/${file.name}`);
    storageRef.put(file);

    db.collection('cv').doc(`${userId}`).set({
      uid: userId
    }).catch(function(error) {
      console.log("ERROR");
    });

}

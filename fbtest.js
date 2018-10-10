const admin = require('firebase-admin');
const serviceAccount = require("./cert/can-i-granma-firebase-adminsdk-8cnv6-af9c27b17a.json");
//const serviceAccount = require('cert');

admin.initializeApp( {
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://can-i-granma.firebaseio.com" //データベースのURL
} );

const db = admin.database();
const ref = db.ref("magic_words");
const ref1 = db.ref('line_ids');

ref.once("value", async function(snapshot) {
	console.log(snapshot.val().unhappy==null);
	let magicword = 'unhappy';
	console.log(snapshot.child(magicword).val()==null);
	console.log(snapshot.child('happy').val());
	console.log(snapshot.child('happy').val().granma_id);

},
function(errorObject) {
	console.log(`The read faild: ${errorObject.code}`);
});
ref1.child('gaki').set({
	id : 'nntyo',
	hoge : 'hooooooge'
});
ref1.child('gaki').update({
	hoge:'hoge'
});
ref1.child('gaki').update({
	honge:'hoooo'
});
ref1.on('value', function(snapshot) {
	if(snapshot.val().obaades) {
		console.log('ok');
	}
},
function(errorObject) {
	console.log(`The read faild: ${errorObject.code}`);
});

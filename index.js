process.on('unhandledRejection', console.dir);
'use strict';

const watson = require('watson-developer-cloud');
//const initialintent = require('./zatsudan_intents.csv');
const admin = require('firebase-admin');
const serviceAccount = require('./cert/can-i-granma-firebase-adminsdk-8cnv6-af9c27b17a.json');
const express = require('express');
const request = require('request');
const line = require('@line/bot-sdk');
const rp = require('request-promise');
const fs = require('fs');
require('date-utils');

const PORT = process.env.PORT || 3000;

// line設定
const config = {
	channelAccessToken:'ihiA8mIkuJ215OdIC7WGGY6aa5KIv8swPkw18KE+JtBKIyeXcmhyfeOklNWOS2OuCme7RpDDdq5iUQB6H248CEVCi+PLW8uL6QHxZJMcqNDjfTHdk43VbjogoISLWmG2z64G0G4TRTQ5cKnI3pKFTAdB04t89/1O/w1cDnyilFU=',
	channelSecret: '8b4d80a55b6b45bb910741bc8f9b68b4'
};

const app = express();

// watson設定
const assistant = new watson.AssistantV1({
  username: 'aadb4a3d-ab32-436b-880f-9227359a8b6d',
  password: '6y6GE7RHC4pm',
  version: '2018-02-16'
});

// firebase設定
admin.initializeApp( {
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://can-i-granma.firebaseio.com"
});

const db = admin.database();
const ref_mw = db.ref("magic_words");
const ref_user = db.ref("line_ids");

app.post('/webhook', line.middleware(config), (req, res) => {
	console.log(req.body.events);
	Promise
		.all(req.body.events.map(handleEvent))
		.then((result) => res.json(result));
});

const client = new line.Client(config);

let lineid;
let user_handler;

let user_input;
let magicword;
async function handleEvent(event) {
	//ユーザ認証
	lineid = event.source.userId;
	await ref_user.once("value", function(snapshot) {
		magicword = snapshot.child(lineid).val();
	},
	function(errorObject) {
		console.log(`The read faild: ${errorObject.code}`);
	});
	if(magicword==null) {

		magicword = event.message.text;

		const workspace = {
			name: `${magicword}`,
			description: `line bot for ${magicword}`,
			intents: [{
				intent:"zatsudan",
				examples:[
					{text:"おはよう"},
					{text:"こんばんは"},
					{text:"おやすみ"},
					{text:"そうなんだね"},
					{text:"お話して"},
					{text:"あなたはだれ"},
					{text:"おもしろいね"},
					{text:"たのしいね"},
					{text:"こんにちは"}
				],
			}],
			language : 'ja',
			dialog_nodes:[{
        type:"standard",
        title:"雑談",
        output:{
          text:{
            values:[],
            selection_policy:"sequential"
          }
        },
        context:{type:"zatsudan"},
        conditions:"#zatsudan",
      dialog_node:"node_1_1539094629105"}
      ]
		};
		let workspaceid;
		await assistant.createWorkspace(workspace, async function(err, res) {
			if (err) {
				console.error(err);
			} else {
				workspaceid = res.workspace_id;
				await ref_user.child(lineid).set(magicword);
				await ref_mw.child(magicword).set({
			 		granma_id: lineid,
			 		mago_id: null,
			 		workspace_id: workspaceid,
			 		intent : null
				});
			}
		});
	} else {
		user_input = event.message.text;
		console.log("ユーザ: " + user_input);
		magicword = snapshot.child(lineid).val();

		await ref_mw.once('value', function(ss) {
			workspaceid = ss.child(magicword).val().workspace_id;
		},
		function(errorObject) {
			console.log(`The read faild: ${errorObject.code}`);
		});
		if (event.type !== 'message' || event.message.type !== 'text') {
			return Promise.resolve(null);
		}

		let wtsnmsg = 'だめ';
		await assistant.message(
		{
		workspace_id: workspaceid,
		input: {'text': user_input},
		//context: user_handler
		},
		async function(err, response) {
			if (err) {
  			console.log('error:', err);
			} else {
				user_handler = response.context;
  			wtsnmsg = await type(String(response.output.text));
				//console.log(JSON.stringify(response, null, 2));
				console.log("返答: " + wtsnmsg);

				return client.replyMessage(event.replyToken, {
					type: 'text',
					text: wtsnmsg
				});
			}
		});
	}
}

async function type(wttext) {
	let conv_type = user_handler.type;
	// 登録済みの返答はそのまま返す
	let text = wttext;
	if(conv_type == undefined) {
		text = 'まごに聞いてみるよ';

		const options = {
			method: 'POST',
			uri: 'https://maaago.herokuapp.com/addreq',
			headers: {
				'Content-Type':'application/json'
			},
			json: {
				magic_word: magicword,
				intent : user_input
			}
		}
		await rp(options)
			.then(function(body){
				console.log('リクエストしました');
		});
	} else if(conv_type == "zatsudan") {
		text = await docomo(wttext);
	}
	return text;
}


const ref_docomo = db.ref('docomo');
async function docomo(text) {
	let docomo_id = "";
	let req_time;
	let res_time;
	// LINEユーザごとに異なるdocomo雑談IDを対応させる
	// jsonファイルに存在しなければ新しいIDの取得
	// 存在していればユーザの情報を一時保存する
	let json;
	ref_docomo.once('value', async function(snapshot) {
		json = snapshot.child(lineid).val();
	},
	function(errorObject) {
		console.log(`The read faild: ${errorObject.code}`);
	});
		if(json != null) {
			docomo_id = json.id;
			req_time = json.reqtime;
			res_time = json.restime;
		} else {

			// 新規ユーザーの場合
			const options = {
				method: 'POST',
				uri: 'https://api.apigw.smt.docomo.ne.jp/naturalChatting/v1/registration?APIKEY=6e624b35786736746b58577977537238784a6d6d6970775475747867724e627342316671367036504e6539',
				headers: {
					'Content-Type':'application/json'
				},
				json: {
					botId: 'Chatting',
					appKind: 'line_bot'
				}
			}
			await rp(options)
				.then(function(body){
				docomo_id = body.appId;
			});
			console.log('new id ' + docomo_id);
			req_time = '2018-06-01 00:00:00';
			res_time = '2018-06-01 00:00:00';
			//firebaseにpush
			await ref_docomo.child(lineid).set({
				id : docomo_id,
				reqtime : req_time,
				restime : restime
			});
		}

		//雑談返答
		const headers = {
			'Content-Type':'application/json;charset=UTF-8'
		}
		const options = {
			uri: 'https://api.apigw.smt.docomo.ne.jp/naturalChatting/v1/dialogue?APIKEY=6e624b35786736746b58577977537238784a6d6d6970775475747867724e627342316671367036504e6539',
			method: 'POST',
			headers: headers,
			json: {
				'language': 'ja-JP',
				'botId': 'Chatting',
				'appId': docomo_id,
				'voiceText': text,
				'appRecvTime': req_time,
				'appSendTime': res_time
			}
		};
		let docomo_text;
		const dt = new Date();
		const formatted = dt.toFormat('YYYY-MM-DD HH:MI:SS');

		await rp(options).then(async function (body) {
			await ref_docomo.child(lineid).update({
				reqtime : formatted,
				restime : body.serverSendTime
			});
			docomo_text = body.systemText.expression;
		});
		return String(docomo_text);
}

//async function connect(pass){

//}
app.listen(PORT);
console.log(`Server running at ${PORT}`);

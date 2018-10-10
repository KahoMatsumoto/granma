var watson = require('watson-developer-cloud');

var conversation = new watson.ConversationV1({
  username: 'aadb4a3d-ab32-436b-880f-9227359a8b6d',
  password: '6y6GE7RHC4pm',
  version: '2018-09-20'
});

const workspace = {
				name: 'API test',
				description: 'Example workspace created via API.',
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
conversation.createWorkspace(workspace, function(err, response) {
  if (err) {
    console.error(err);
  } else {
    console.log(JSON.stringify(response, null, 2));
  }
});

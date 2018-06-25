const LINE_CHANNEL_ACCESS_TOKEN = 'TNBWudgiLAtDdwFft1fJXBvktzRfp8fAmgvLeNj6bYQe0jFJtyoMMs5Kc9RcMGVoa3kpFPzs+hAjtaB0YXcDkdbC3Kqailu1C8Bbx7IRci5Y+PjiDq/ll8KCl30wjY5YuiISSbJxfI2YzTV0RH14jQdB04t89/1O/w1cDnyilFU='
const watson = require('watson-developer-cloud');

const express = require('express');
const bodyparser = require('body-parser');
const request = require('request');

const app = express();
app.get('/', function(request, response) {
	  response.send('Hello World!')
});
const assistant = new watson.AssistantV1({
  username: 'aadb4a3d-ab32-436b-880f-9227359a8b6d',
  password: '6y6GE7RHC4pm',
  version: '2018-02-16'
});
app.post('webhook', function(req, res, next) {
	res.status(200).end();
	for (let event of req.body.events) {
		if (event.type == 'message') {
			let wtsnmsg;
			assistant.message({
			  workspace_id: '47f28b48-47a1-4b41-ad2f-6d8317501727',
			  input: {'text': event.message.text}
			},  function(err, response) {
			  if (err)
			    console.log('error:', err);
			  else
			    wtsnmsg = response.output.text;
					console.log(JSON.stringify(response, null, 2));
			});
			const headers = {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + LINE_CHANNEL_ACCES_TOKEN
			}
			const body = {
				replyToken: event.replyToken,
				messages: [{
					type: 'text',
					text: wtsnmsg
				}]
			}
			const url = 'https://api.line.me/v2/bot/message/reply';
			request({
				url: url,
				method: 'POST',
				headers: headers,
				body: body,
				json:true
			});
		}
	}
});

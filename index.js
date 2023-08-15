require("dotenv").config();
const WebSocket = require("ws");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const wss = new WebSocket.Server({ server });
const axios = require("axios");
const twilio = require("twilio")(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
const speech = require("@google-cloud/speech");
const client = new speech.SpeechClient();
const workspaceName = "secret_history";

let sessionInfo = null;
let host = null;
let trust = 0;
let userMessage = 0;

// configure transcription Request
const request = {
  config: {
    encoding: "MULAW",
    sampleRateHertz: 8000,
    languageCode: "en-US",
  },
  interimResults: true,
};

wss.on("connection", function connection(ws) {
  let index = 0;
  let recognizeStream = null;

  ws.on("message", function incoming(message) {
    const msg = JSON.parse(message);
    switch (msg.event) {
      case "start":
        recognizeStream = client // ping google stt
          .streamingRecognize(request)
          .on("error", console.error)
          .on("data", (data) => {
            index++
            let currentIndex = index;
            setTimeout(() => {
              if (currentIndex == index || (currentIndex == index+1)) { // user has stopped talking
                userMessage++
                console.log("user message counter: " + userMessage)
                let result = data.results[0].alternatives[0].transcript
                console.log('\x1b[31m%s\x1b[0m',`Richard: ${result}`); // result from google stt
                (async () => {
                  let julianResponse = await sendMessage(sessionInfo, result)
                   // ping inworld with result
                   if (userMessage > 5) { // Julian ends the call
                    console.log("Julian is ending the call")
                    twilio.calls(msg.start.callSid)
                    .update({twiml: 
                    `<Response>
                      <Say>Richard, it really is late. And I have nothing more to say to you. Be well and goodbye.</Say>
                      <Say voice="Polly.Arthur-Neural">And with that, Julian Morrow hung up the phone - forever to remain a mystery.</Say>
                    </Response>`})
                } else if (trust < 2) { // continue the call normally - Julian doesn't trust you enough to share his location
                    console.log("Julian: " + julianResponse);
                    twilio.calls(msg.start.callSid) 
                    .update({twiml: 
                      `<Response>
                        <Say>${julianResponse}</Say>
                        <Connect>
                          <Stream url="wss://${host}/"/>
                        </Connect>
                      <Pause length="1000" />
                      <Say>I have enjoyed our time, but I really must be going now. Goodbye</Say>
                      </Response>`})
                  } else { // Julian trusts Richard enough to share his location
                      let revealLocation = await sendTrigger(sessionInfo)
                      console.log("Julian: " + revealLocation)
                      twilio.calls(msg.start.callSid)
                      .update({twiml: 
                      `<Response>
                        <Say>${revealLocation}</Say>
                        <Say voice="Polly.Arthur-Neural">And with that, Julian Morrow hung up the phone - and now that you know where he is, why don't you pay him a visit?</Say>
                      </Response>`})
                  }
                })();
              }
            },1300)
          });

        break;
      case "media":
        // Write Media Packets to the recognize stream
        recognizeStream.write(msg.media.payload);
        break;
      case "stop":
        recognizeStream.destroy();
        break;
    }
  });
});

app.use(express.static("public"));

app.post("/", (req, res) => {
    // if convo fresh then start session
    if (sessionInfo == null) {
      (async () => {
          sessionInfo = await openSession();
        })();
  }
  host = req.headers.host;
  console.log("Narrator: You are Richard Papen, 15 years removed from Bunny’s murder and all that occurred at Hampden College. Those sordid events have haunted you and left you broken. \n\nThrough an academic contact, you’ve acquired the phone number for Julian Morrow, your old professor. He won't reveal when you need for closure over the phone, so find out his address. \n\nHe won't reveal it easily... you may need to conjure up feelings of trust in him. You are nervous, but dial. You hear it ring once, then twice, and then he answers...")
  res.set("Content-Type", "text/xml");
  res.send(`
  <Response>
  <Say voice="Polly.Arthur-Neural">You are Richard Papen, 15 years removed from Bunny’s murder and all that occurred at Hampden College. Those sordid events have haunted you and left you broken. Through an academic contact, you’ve acquired the phone number for Julian Morrow, your old professor. He won't reveal what you need for closure over the phone, so find out his address. He won't reveal it easily... you may need to conjure up feelings of trust in him. You are nervous, but dial. You hear it ring once, then twice, and then he answers...</Say>
  <Say>Hello? Who is it that calls at this hour?</Say>
    <Connect>
      <Stream url="wss://${req.headers.host}/"/>
    </Connect>
    <Pause length="1000" />
    <Say>I have enjoyed our time, but I really must be going now. Goodbye</Say>
  </Response>
`);
});

//  open an inworld session
let openSession = async () => {
  let sceneData = {
    'name': `workspaces/${workspaceName}/scenes/classroom`,
    'user': {
        'givenName': 'Richard',
        'gender': 'male',
        'role': 'former student',
        'age': '35',
        'endUserId': '1'
    }
  }
  const response = await axios({
      method: 'post',
      url: `https://studio.inworld.ai/v1/${sceneData.name}:openSession`,
      headers: {
      'Content-Type': 'application/json',
      'authorization': `Basic ${process.env.INWORLD_KEY}`
      },
      data: sceneData
  })
  const sessionId = await response.data.name
  const characterId = await response.data.sessionCharacters[0].character
  const sessionInfo = {
      session: sessionId,
      character: characterId
  }
  return sessionInfo
}

// send an inworld trigger
let sendTrigger = async (sessionInfo) => {
  const response = await axios({
      method: 'post',
      url: `https://studio.inworld.ai/v1/workspaces/${workspaceName}/sessions/${sessionInfo.session}/sessionCharacters/${sessionInfo.character}:sendTrigger`,
      headers: {
          'Content-Type': 'application/json',
          'authorization': `Basic ${process.env.INWORLD_KEY}`,
          'Grpc-Metadata-session-id': sessionInfo.session
      },
      data: {
          "triggerEvent": {
              "trigger": `workspaces/${workspaceName}/triggers/reveal_location`
          }
      }
  })
  console.log("trigger sent to inworld")
  let triggerResponse = await response.data.textList;
  let stringResponse = triggerResponse.join()
  return stringResponse
}

// send an inworld message
let sendMessage = async (sessionInfo, message) => {
  try {
    const response = await axios({
      method: 'post',
      url: `https://studio.inworld.ai/v1/workspaces/${workspaceName}/sessions/${sessionInfo.session}/sessionCharacters/${sessionInfo.character}:sendText`,
      headers: {
      'Content-Type': 'application/json',
      'authorization': `Basic ${process.env.INWORLD_KEY}`,
      'Grpc-Metadata-session-id': sessionInfo.session
      },
      data: {
          'text': message
      }
  })
    console.log(response.data.relationshipUpdate)
    if (trust == 1 && response.data.relationshipUpdate.trust > 0) {
      trust++
      console.log("Julian is feeling very close to Richard")
    } else if (response.data.relationshipUpdate.trust > 0) {
      trust++
      console.log("Julian is feeling somewhat close to Richard")
    } else if (response.data.relationshipUpdate.trust == 0) {
      trust = 0
      console.log("Julian is wary of Richard")
    }
    let text = await response.data.textList
    let stringText = text.join()
    return stringText;
  } catch (err) {
    console.log(err)
    return "something went wrong"
  }
}

console.log("starting app - port 8080");
server.listen(8080);

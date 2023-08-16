# Where is Julian Morrow - A Conversational Mystery powered by Inworld AI, Twilio, and Google STT

Using Inworld AI's character engine, we'll create a conversational game that players can access by making a phone call. Role playing as Richard Papen from [The Secret History](https://www.goodreads.com/en/book/show/29044), the player will call Julian Morrow, their estranged ex-professor. The goal is to get Julian to reveal his address, but Julian won't divulge his location unless he trust you...

## Prerequisites

- An [Inworld AI account](https://inworld.ai/)
- A [Twilio Account](https://www.twilio.com/try-twilio)
- A [Google Cloud Account](https://cloud.google.com/)
- Installed [ngrok](https://ngrok.com/)

---

## Setup

1. Create Julian Morrow in your Inworld AI account, making sure to give him a [Goal](https://docs.inworld.ai/docs/tutorial-basics/goals/#goals-20) where he will reveal his address.
2. Set up the Google Project and retrieve the service account key
    1. Set up a new GCP Project
    2. Enable the Google Speech-To-Text API for that project
    3. Create a service account.
    4. Download a private key as JSON.
4.  Modify the `.env.sample` file to include the path to your JSON service account key and save it as a `.env` file
5.  Add the Twilio authorization credentials as `ACCOUNT_SID` and `AUTH_TOKEN` values to the .env file
6.  Add the [Inworld API key](https://docs.inworld.ai/docs/tutorial-api/getting-started/#authorization-signature) as `INWORLD_KEY` to the .env file
7.  Update the `sceneData` variable in the `index.js` file to point to your own scene
8.  Update the `workspaceName` variable in the `index.js` file to point to your own workspace
9.  Update the `data` attribute in the `sendTrigger` function to point to your trigger
10.  Install the dependencies with `$ npm install`
11.  Start ngrok with `$ ngrok http 8080`
12. Buy a phone number in Twilio and set its [Voice Webhook](https://www.twilio.com/docs/usage/webhooks/getting-started-twilio-webhooks) to the URL provided by ngrok
13. Start the server with `$ npm start`
14. Call the number and try to convince Julian to give up his address!

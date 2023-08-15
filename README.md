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

2. Setup the Google Project and retrieve service account key

    a. [Install and initialize the Cloud SDK](https://cloud.google.com/sdk/docs/)

    b. Setup a new GCP Project

    c. Enable the Google Speech-To-Text API for that project

    d. Create a service account.

    e. Download a private key as JSON.

3.  Modify the `.env.sample` file to include the path to your JSON service account key and save it as a `.env` file
4.  Add the Twilio authorization credentials as `ACCOUNT_SID` and `AUTH_TOKEN` values to the .env file
5.  Add the [Inworld API key](https://docs.inworld.ai/docs/tutorial-api/getting-started/#authorization-signature) as `INWORLD_KEY` to the .env file
6.  Update the `sceneData` variable in the `index.js` file to point to your own scene
7.  Update the `workspaceName` variable in the `index.js` file to point to your own workspace
8.  Update the `data` attribute in the `sendTrigger` function to point to your trigger
9.  Install the dependencies with `$ npm install`
10.  Start ngrok with `$ ngrok http 8080`
11. Buy a phone number in Twilio and set its [Voice Webhook](https://www.twilio.com/docs/usage/webhooks/getting-started-twilio-webhooks) to the URL provided by ngrok
12. Start the server with `$ npm start`
13. Call the number and try to convince Julian to give up his address!

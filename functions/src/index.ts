import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sophie-champagne.firebaseio.com"
});

export const helloWorld = functions.https.onRequest((request, response) => {
  console.log("howdy. howdy.");
  response.send("Hello from Sophie And Champagne!");
});

export const onAustinWeatherUpdate = functions.firestore
  .document("/cities-weather/austin-tx-us")
  .onUpdate(change => {
    const after = change.after.data();
    const payload = after
      ? {
          data: {
            temp: String(after.temp),
            conditions: after.conditions
          }
        }
      : {};
    return admin.messaging().sendToTopic("weather_austin-tx-us", payload);
  });

export const getAustinWeather = functions.https.onRequest(
  async (request, response) => {
    try {
      const snapshot = await admin
        .firestore()
        .doc("/cities-weather/austin-tx-us")
        .get();
      const data = snapshot.data();
      if (!data) response.send({ error: "no data" });
      response.send(data);
    } catch (e) {
      console.log(e);
      response.status(500);
    }
  }
);

export const getDogTemp = functions.https.onRequest((request, response) => {
  admin
    .firestore()
    .collection("/sophie-champagne/dog-house/temperature")
    .get()
    .then(snapshot => {
      const data = snapshot.docs;
      response.send(data);
    })
    .catch(e => {
      console.log(e);
      response.status(500);
    });
});

export const getBostonAreaWeather = functions.https.onRequest(
  async (req, rsp) => {
    try {
      const areaSnapshot = await admin
        .firestore()
        .doc("areas/greater-boston")
        .get();
      const data = areaSnapshot.data();
      if (!data) {
        const msg = "No data found!";
        console.log(msg);
        throw new Error(msg);
      }
      const { cities } = data;
      if (!cities) {
        const msg = "No cities found!";
        console.log(msg);
        throw new Error(msg);
      }
      const ps = [];
      for (const city in cities) {
        const p = admin
          .firestore()
          .doc(`cities-weather/${city}`)
          .get();
        ps.push(p);
      }
      const citySnapshots = await Promise.all(ps);
      const results: object[] = [];
      citySnapshots.forEach(citySnap => {
        const d = citySnap.data();
        if (!d) return;
        d.city = citySnap.id;
        results.push(d);
      });
      rsp.send(results);
    } catch (e) {
      console.log(e);
      rsp.status(500);
    }
  }
);

function addPizzazz(text: string): string {
  return text.replace(/\bpizza\b/g, "🍕");
}
export const onMessageCreate = functions.database
  .ref("/rooms/{roomId}/messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const { roomId, messageId } = context.params;
    console.log(`New message ${messageId} in room ${roomId}`);
    const messageData = snapshot.val();
    const text = addPizzazz(messageData.text);
    await snapshot.ref.update({ text: text });

    const countRef = snapshot.ref.parent?.parent?.child("messageCount");
    return countRef?.transaction(count => {
      return count + 1;
    });
  });

export const onMessageDelete = functions.database
  .ref("/rooms/{roomId}/messages/{messageId}")
  .onDelete(async (snapshot, context) => {
    const countRef = snapshot.ref.parent?.parent?.child("messageCount");
    return countRef?.transaction(count => {
      return count - 1;
    });
  });

export const onMessageUpdate = functions.database
  .ref("/rooms/{roomId}/messages/{messageId}")
  .onUpdate((change, context) => {
    const before = change.before.val();
    const after = change.after.val();
    if (before.text === after.text) {
      console.log("Text didn't change");
      return null;
    }
    const text = addPizzazz(after.text);
    const timeEdited = Date.now();
    return change.after.ref.update({ text, timeEdited });
  });

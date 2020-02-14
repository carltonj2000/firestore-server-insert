# Typescript And Firebase

Server side script to insert data into a firestore database.

Note the `serviceAccountKey.json` file is store in lib and should not be
deleted or add the revision control because it provides the information
needed to connect to the database.

## Commands

- `npm run-script lint` in functions directory to check for function errors
- `npm run-script build` in functions directory to build
- `firebase serve --only functions` in functions directory to emulate

## History

The code in this repository is based on the
[Getting Started with Cloud Functions for Firebase using TypeScript - Firecasts](https://www.youtube.com/watch?v=DYfP-UIKxH0&list=PLl-K7zZEsYLkPZHe41m4jfAxUi0JjLgSM)
video.

# Firebase - Hasura - Gatsby starter

## Description

This boilerplate generates a static Gatsby website that takes advantage
of Hasura GraphQL server and Firebase cloud functions.

## Reasons

Gatsby websites are performant and secure and they have many [available plugins](https://www.gatsbyjs.org/plugins/).  
Firebase provides a free HTTP2 deployment platform and serverless functions defined in the `/functions` folder.
Hasura provides a database first solution for creating GraphQL API, custom server side logic can be added with hooks
and Google functions.

## Commands

```bash
yarn start      # Starts development server
yarn build      # Creates production build
yarn test       # Runs Standard linter, TypeScript typechecker, Jest unit tests
firebase deploy # Deploys app to Firebase hosting
```

## Firebase-tools

Create a new project from [Firebase console](https://console.firebase.google.com/).

https://firebase.google.com/docs/cli

Create a realtime database for the project (not Firestore) and set `".read": true` in its rules.
Execute `firebase init`

## Resources

* [gatsby-starter-firebase](https://www.gatsbyjs.org/starters/muhajirdev/gatsby-starter-firebase/)
* [firebaseui-web](https://github.com/firebase/firebaseui-web)
* [authentication-and-authorization-using-hasura-and-firebase](https://blog.hasura.io/authentication-and-authorization-using-hasura-and-firebase/)

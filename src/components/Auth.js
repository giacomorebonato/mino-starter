import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'

import * as firebaseui from 'firebaseui'

import React, { useEffect } from 'react'
import 'firebaseui/dist/firebaseui.css'

const firebaseConfig = {
  apiKey: 'AIzaSyCmtLOD_VeXty9W75oFTstALeU3ULyZ8O4',
  authDomain: 'zen-retros.firebaseapp.com',
  databaseURL: 'https://zen-retros.firebaseio.com',
  projectId: 'zen-retros',
  storageBucket: 'zen-retros.appspot.com',
  messagingSenderId: '1001073927285',
  appId: '1:1001073927285:web:0eb0c4d533578113'
}
firebase.initializeApp(firebaseConfig)

const uiConfig = {
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
  ]
}

export default function Auth () {
  useEffect(() => {
    const ui = new firebaseui.auth.AuthUI(firebase.auth())
    ui.start('#firebaseui-auth-container', uiConfig)
  }, [])

  return <div id='firebaseui-auth-container' />
}

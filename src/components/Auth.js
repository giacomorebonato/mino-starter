import firebase from 'firebase/app'
import 'firebase/auth'
import * as firebaseui from 'firebaseui'
import React, { useEffect } from 'react'
import 'firebaseui/dist/firebaseui.css'

import firebaseConfig from '../lib/firebaseConfig'

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

# aidbox-client-sdk

## Installation

```
npm install @aidbox/client-sdk-js
```

## Usage

```typescript

import Aidbox from '@aidbox/client-sdk-js'

// Specify Aidbox credentials
const credentials = {
  URL: 'http://localhost:8085',
  CLIENT_ID: 'MY_CLIENT_ID',
  CLIENT_SECRET: 'MY_CLIENT_SECRET'
}

// Define storage
const storage = {
  insertIntoStorage: localStorage.setItem,
  obtainFromStorage: localStorage.getItem,
}

const instance = Aidbox.initializeInstance(credentials, storage);

// Authorize and retrieve patient data
instance.authorize({ username: 'some-user', password: 'some-password' })
  .then(() => instance.request('/Patient/some-patient', {}))
  .then(patient => console.log('Patient data', patient))
```

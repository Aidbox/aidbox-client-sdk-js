# aidbox-client-sdk

## Installation

```
npm install @aidbox/client-sdk-js
```

## Authorization

### RESOURCE_OWNER_GRANT https://docs.aidbox.app/auth/resource-owner-password

```typescript
  import Aidbox from '@aidbox/client-sdk-js'
  
  const credentials = {
    URL: 'http://aidbox.domain',
    CLIENT_ID: 'MY_CLIENT_ID',
    CLIENT_SECRET: 'MY_CLIENT_SECRET',
    AUTH_MODE: 0,
    FHIR_STRICT: false,
  }
  
  const storage = {
    insertIntoStorage: localStorage.setItem,
    obtainFromStorage: localStorage.getItem,
  }
  
  const instance = Aidbox.initializeInstance(credentials, storage);
  
  await instance.authorize({ username: 'some-user', password: 'some-password' })
  const user = instance.getUserInfo();
```

### IMPLICIT_GRANT https://docs.aidbox.app/auth/implicit

```typescript
  import Aidbox from '@aidbox/client-sdk-js'
  
  const credentials = {
    URL: 'http://aidbox.domain',
    CLIENT_ID: 'MY_CLIENT_ID',
    REDIRECT_URI: 'http://application.auth',
    AUTH_MODE: 1,
    SCOPE: 'patient/*.read',
  }
  
  const storage = {
    insertIntoStorage: localStorage.setItem,
    obtainFromStorage: localStorage.getItem,
  }
  
  const instance = Aidbox.initializeInstance(credentials, storage);
  
  const authorizationURI = await instance.authorize();

  window.location.replace(authorizationURI);

  const params = new URLSearchParams(window.location.search);
  const token = params.get('access_token')

  await instance.authorize(token);
  const user = instance.getUserInfo();
```

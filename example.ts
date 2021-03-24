import Aidbox from './src';

const credentials = {
  URL: 'http://192.168.0.104:8085',
  CLIENT_ID: 'mobile',
  CLIENT_SECRET: 'dsfghjkryetwgravfdbgndtuejwhetarbdnymtdkjsthrdnfmdukyjshejtykufjysthratjydg',
  REDIRECT_URI: 'http://192.168.0.104:8085',
  AUTH_MODE: 0,
  SCOPE: 'launch/patient openid profile patient/*.read',
  FHIR_STRICT: false,
}

let token = ''

const storage = {
  insertIntoStorage: function(key, value) { token = value },
  obtainFromStorage: function(key) { return token },
}

const instance = Aidbox.initializeInstance(credentials, storage);

if (!(instance instanceof Error)) {
  (async () => {
    await instance.authorize({ username: 'admin', password: 'qwedaszxc' });

    const patient = await instance.request('/Patient/patient-1', {});

    console.log('patient', patient);

    const user = await instance.getUserInfo();

    console.log('user', user);
  })()
}

import Aidbox from './src';

const credentials = {
  URL: 'http://192.168.0.104:8085',
  CLIENT_ID: 'mobile',
  CLIENT_SECRET: 'dsfghjkryetwgravfdbgndtuejwhetarbdnymtdkjsthrdnfmdukyjshejtykufjysthratjydg'
}

let token = ''

const storage = {
  insertIntoStorage: function(key, value) { token = value },// localStorage.setItem,
  obtainFromStorage: function(key) { return token }, // localStorage.getItem,
}

const instance = Aidbox.initializeInstance(credentials, storage);

if (!(instance instanceof Error)) {
  (async () => {
    const session = await instance.authorize({ username: 'admin', password: 'qwedaszxc' });

    console.log(session);

    const patient = await instance.request('/Patient/patient-1', {});

    console.log('patient', patient);

    const user = await instance.getUserInfo();

    console.log('user', user);
  })()
}

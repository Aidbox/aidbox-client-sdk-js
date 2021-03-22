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

const result = instance.authorize({ username: 'user-1', password: 'somegoodpassword' }).then(() => {
  instance.request('/Patient/patient-1', {}).then(res => console.log('patient-1 ', res))
})


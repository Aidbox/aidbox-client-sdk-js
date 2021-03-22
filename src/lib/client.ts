import fetch from "node-fetch";

import * as resource from './resource.json';

//import { resolve, parse, format } from 'url';

// const { resolve, parse, format } = require('url');


enum EAuthorizationMode {
  CLIENT_CREDENTIALS_GRANT,
  RESOURCE_OWNER_GRANT
}

type TInstanceCredentials = {
  readonly URL: string;
  readonly CLIENT_ID: string;
  readonly CLIENT_SECRET: string;
  readonly AUTH_MODE?: EAuthorizationMode;
};

type TInstanceOptions = {
  readonly insertIntoStorage: (name: string, value: string) => Promise<void> | void,
  readonly obtainFromStorage: (name: string) => Promise<string> | string,
};

type TAuthorizationData = {
  readonly token_type: string;
  readonly expires_in: number;
  readonly access_token: string;
  readonly refresh_token: string;
  readonly userinfo: { readonly email: string; readonly id: string; readonly resourceType: "User" }
}

type TContext = {
  readonly box: { readonly URL: string; readonly CLIENT_ID: string; readonly CLIENT_SECRET: string };
  readonly auth: { readonly token: string; readonly refresh_token: string; readonly mode: EAuthorizationMode };
  readonly storage: TInstanceOptions;
}

type TRequestResponse = {
  readonly data: any;
  readonly status: number;
}

// function resolvePath(path, ...parts) {
//   return join(resolve(this.aidboxUrl, path), ...parts);
// }
//
// function join(...parts) {
//   return parts.reduce((path, part) => {
//     return part ? path.replace(/\/?$/, '/') + part : path;
//   });
// }

// async function get<T = any, R = AxiosResponse<T>>(
//   url: string,
//   config?: AxiosRequestConfig
// ): Promise<R> {
//   const { data } = await axios.get(url, config)
//   return data
// }

//TODO: URL resolver without dom environment

const request = (context: TContext) => async (endpoint, parameters): Promise<TRequestResponse> => {
  try {
    const isDataExisted = 'data' in parameters;

    const token = await context.storage.obtainFromStorage('app.aidbox.auth.resource');

    console.log('path',{
      method: isDataExisted ? 'POST' : 'GET',
      headers: {
        ...isDataExisted && { 'Content-Type': 'application/json' },
        ...token && { 'Authorization': `Bearer ${token}` },
        ...parameters.headers,
      },
      ...isDataExisted && { body: JSON.stringify(parameters.data) }})

    const request = await fetch(new URL(endpoint, context.box.URL), {
      method: isDataExisted ? 'POST' : 'GET',
      headers: {
        ...isDataExisted && { 'Content-Type': 'application/json' },
        ...token && { 'Authorization': `Bearer ${token}` },
        ...parameters.headers,
      },
      ...isDataExisted && { body: JSON.stringify(parameters.data) },
      //mode: 'cors', // no-cors, *cors, same-origin
      //cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      //credentials: 'same-origin', // include, *same-origin, omit
      //redirect: 'follow', // manual, *follow, error
      //referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      //signal: () => null
    });

    const response = await request.json();

    return { data: response, status: request.status }
  } catch(exception) {
    console.warn(exception);
    return { data: { message: 'something went wrong...' }, status: 0 }
  }
}

const implicitAuthorization = () => {
  // const client = this.options.client;
  // const state = randomstring();
  // const params = {
  //   client_id: client.id,
  //   redirect_uri: client.redirect_uri,
  //   scope: client.scope,
  //   state: state,
  //   response_type: 'token',
  // };
  // const oauth2Endpoint = this.resolvePath('/auth/authorize');
  // const query = Object.keys(params)
  //   .filter((p) => params[p])
  //   .map((p) => `${p}=${encodeURIComponent(params[p])}`)
  //   .join('&');
  // const oauth2TokenEndpoint = oauth2Endpoint + '?' + query;
  // this.authStorage(targetWindow, {
  //   state,
  // });
  // targetWindow.location = oauth2TokenEndpoint;
}

const resourceOwnerAuthorization = async (context: TContext, credentials) => {
  const { username, password } = credentials;

  const response = await request(context)('/auth/token', {
    data: {
      username, password,
      client_id: context.box.CLIENT_ID,
      client_secret: context.box.CLIENT_SECRET,
      grant_type: 'password'
    }
  })

  if (response.status === 200) {
    context.storage.insertIntoStorage(
      'app.aidbox.auth.resource',
      response.data.access_token
    )
  }
}


// const request = (path, parameters = {}) => {
//   const url = this.resolvePath(path, parameters.id);





  // const url = this.resolvePath(path, parameters.id);
  // const client = this.options?.client;
  // const query = Object.assign(
  //   {},
  //   parameters.query,
  //   parse(url, {
  //     parseQueryString: true,
  //   }).query,
  // );
  // const accessToken = this.getAccessToken();
  // const data = {
  //   url: url,
  //   method: parameters.body ? (parameters.id ? 'PUT' : 'POST') : 'GET',
  //   ...parameters,
  //   query: query,
  //   headers: {
  //     'Content-Type': parameters.body ? 'application/json' : null,
  //     Authorization: accessToken
  //       ? `Bearer ${accessToken}`
  //       : client?.secret
  //         ? `Basic ${btoa(client.id + ':' + client.secret)}`
  //         : null,
  //     ...parameters?.headers,
  //   },
  // };
  //
  // if (data.headers) {
  //   Object.keys(data.headers).forEach((headerName) => {
  //     if (data.headers[headerName] === null) {
  //       delete data.headers[headerName];
  //     }
  //   });
  // }
  //
  // if (data.body && typeof data.body !== 'string') {
  //   data.body = JSON.stringify(data.body);
  // }
  // return this.send(data);
// }

// const authorizationMode = Object.freeze({
//   Implicit: 0,
//   ResourceOwner: 1,
// });

// get already existed token
// get token from server
// should sdk stores token or just provide the way to get it via credentials
//
// const getUserInfo = () => {
//   return this.authorize()
//     .then(() => this.request('/auth/userinfo'))
//     .then((res) => res.data);
// }

// const getAccessToken = () => {
//   if (this.options.access_token) {
//     return this.options.access_token;
//   }
//
//   const data = this.authStorage(targetWindow) || {};
//
//   if (data.access_token) {
//     return data.access_token;
//   }
//
//   const access_token = params.access_token;
//
//   return access_token;
// }

const authorize = (context: TContext) => async (credentials): Promise<TAuthorizationData> => {
  const response = await resourceOwnerAuthorization(context, credentials);

  console.log(response);

  // const access_token = this.getAccessToken();

  // if (access_token) {
  //   return Promise.resolve();
  // }

  // return new Promise(() => {
  //   return resourceOwnerFlow();
  // });
  return
}

  // POST /auth/token
  // Content-Type: application/json

  // {
  //   "grant_type": "password",
  //   "client_id": "myapp",
  //   "client_secret": "verysecret",
  //   "username": "user",
  //   "password": "password"
  // }


//
// const closeSession = (context) => {
//   request('/Session', { method: 'DELETE' });
//   this.options.access_token = '';
//
//   if (this.flow === Aidbox.FlowType.ResourceOwner) {
//     return targetWindow.localStorage.removeItem('app.aidbox.auth.resource');
//   }
//
//   this.authStorage(targetWindow, null);
// }


const initializeInstance = (credentials: TInstanceCredentials, options: TInstanceOptions) => {
  const { URL, CLIENT_ID, CLIENT_SECRET, AUTH_MODE = EAuthorizationMode.RESOURCE_OWNER_GRANT } = credentials;
  const { insertIntoStorage, obtainFromStorage } = options;

  const context = {
    auth: { token: '', refresh_token: '', mode: AUTH_MODE },
    box: { URL, CLIENT_ID, CLIENT_SECRET },
    storage: { insertIntoStorage, obtainFromStorage },
  }

  return {
    authorize: authorize(context),
    request: request(context),
    closeSession: request(context),
  }
}

export const Client = {
  initializeInstance,
}
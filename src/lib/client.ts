import {
  EAuthorizationMode,
  TAuthResponse,
  TContext,
  TCredentials,
  TInstanceCredentials,
  TInstanceOptions,
  TPublicAPI,
  TRequest,
  TRequestResponse,
} from './types';
import resource from './resource.json';
import { dataToQuery, parseResponse } from './utils';

const getAuthorizationToken = async (storage: TInstanceOptions): Promise<string | null> => {
  try {
    return await storage.obtainFromStorage('app.aidbox.auth.resource');
  } catch (error) {
    return null;
  }
};
const resetAuthorizationToken = async (storage: TInstanceOptions): Promise<any> => {
  try {
    await storage.removeFromStorage('app.aidbox.auth.resource');
  } catch (error) {
    console.log(error);
  }
};

const setAuthorizationToken = async (storage: TInstanceOptions, token: string): Promise<any> => {
  try {
    return await storage.insertIntoStorage('app.aidbox.auth.resource', token);
  } catch (error) {
    return null;
  }
};

const request = (context: TContext) => async (
  endpoint: string,
  parameters: TRequest = {},
): Promise<TRequestResponse> => {
  const method = parameters.method || ('data' in parameters ? 'POST' : 'GET');
  const isDataSendMethod = /POST|PUT|PATCH/.test(method);

  const uri = [
    context.box.URL,
    context.box.FHIR_STRICT ? '/fhir' : '',
    endpoint,
    method === 'GET' ? `?${dataToQuery(parameters.data)}` : '',
  ].join('');

  const token = await getAuthorizationToken(context.storage);

  const response = await runRequest(uri, {
    method,
    headers: {
      ...(isDataSendMethod && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...parameters.headers,
    },
    ...(isDataSendMethod && { body: JSON.stringify(parameters.data) }),
  });

  if (response.status === 401) {
    await setAuthorizationToken(context.storage, '');
  }

  return response;
};

const runRequest = async (uri: string, params: any) => {
  try {
    const response = await fetch(uri, params);
    const responseData = await parseResponse(response);

    return { data: responseData, status: response.status };
  } catch (exception) {
    return { data: exception, status: 0 };
  }
};

const resourceOwnerAuthorization = async (context: TContext, credentials: TCredentials): Promise<TRequestResponse> => {
  const { username, password } = credentials;

  const response = await request(context)('/auth/token', {
    data: {
      username,
      password,
      client_id: context.box.CLIENT_ID,
      client_secret: context.box.CLIENT_SECRET,
      grant_type: 'password',
    },
  });

  if (response.status === 200) {
    await setAuthorizationToken(context.storage, response.data.access_token);
  }

  return response;
};

const implicitAuthorization = async (context: TContext) => {
  const data = {
    response_type: 'token',
    client_id: context.box.CLIENT_ID,
    scope: context.box.SCOPE,
  };
  return [context.box.URL, '/auth/authorize', `?${dataToQuery(data)}`].join('');
};

const getUserInfo = (context: TContext) => (): Promise<TRequestResponse> => request(context)('/auth/userinfo');

const authorize = (context: TContext) => async (params: any): Promise<TAuthResponse | any> => {
  if (context.box.AUTH_MODE === EAuthorizationMode.RESOURCE_OWNER_GRANT) {
    return resourceOwnerAuthorization(context, params);
  }

  if (context.box.AUTH_MODE === EAuthorizationMode.IMPLICIT_GRANT) {
    return typeof params === 'string' ? setAuthorizationToken(context.storage, params) : implicitAuthorization(context);
  }
  return null;
};

const closeSession = (context: TContext) => async (): Promise<TRequestResponse> => {
  const response = await request(context)('/Session', { method: 'DELETE' });
  await resetAuthorizationToken(context.storage);
  return response;
};

const initializeInstance = (credentials: TInstanceCredentials, options?: TInstanceOptions): TPublicAPI | Error => {
  const {
    URL,
    CLIENT_ID,
    CLIENT_SECRET,
    SCOPE,
    FHIR_STRICT = false,
    AUTH_MODE = EAuthorizationMode.RESOURCE_OWNER_GRANT,
  } = credentials;
  if (!options) {
    return new Error('@aidbox/client-js-sdk: Provide options');
  }
  const { insertIntoStorage, obtainFromStorage, removeFromStorage } = options;

  if (!URL) {
    return new Error('@aidbox/client-js-sdk: Provide Aidbox URL');
  }

  if (!CLIENT_ID) {
    return new Error('@aidbox/client-js-sdk: Provide Aidbox CLIENT_ID');
  }

  if (
    typeof insertIntoStorage !== 'function' ||
    typeof obtainFromStorage !== 'function' ||
    typeof removeFromStorage !== 'function'
  ) {
    return new Error('@aidbox/client-js-sdk: Provide insertIntoStorage and obtainFromStorage methods');
  }

  const context = {
    box: { URL, CLIENT_ID, CLIENT_SECRET, AUTH_MODE, FHIR_STRICT, SCOPE },
    storage: { insertIntoStorage, obtainFromStorage, removeFromStorage },
  };

  return {
    request: request(context),
    authorize: authorize(context),
    closeSession: closeSession(context),
    getUserInfo: getUserInfo(context),
    getToken: () => getAuthorizationToken(context.storage),
    resetToken: () => resetAuthorizationToken(context.storage),
    resource,
  };
};

export const Client = {
  initializeInstance,
};

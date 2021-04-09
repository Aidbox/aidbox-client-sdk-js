import * as resource from './resource.json';
import { dataToQuery, parseResponse } from './utils';

export enum EAuthorizationMode {
  RESOURCE_OWNER_GRANT,
  IMPLICIT_GRANT,
}

export type TInstanceCredentials = {
  readonly URL: string;
  readonly CLIENT_ID: string;
  readonly CLIENT_SECRET?: string;
  readonly FHIR_STRICT?: boolean;
  readonly SCOPE: string;
  readonly AUTH_MODE?: EAuthorizationMode;
};

export type TInstanceOptions = {
  readonly insertIntoStorage: (
    name: string,
    value: string
  ) => Promise<void> | void;
  readonly obtainFromStorage: (name: string) => Promise<string> | string | null;
};

export type TAuthorizationData = {
  readonly token_type: string;
  readonly expires_in: number;
  readonly access_token: string;
  readonly refresh_token: string;
  readonly userinfo: {
    readonly email: string;
    readonly id: string;
    readonly resourceType: 'User';
  };
  readonly error_description?: string;
  readonly error?: string;
};

type TContext = {
  readonly box: {
    readonly URL: string;
    readonly CLIENT_ID: string;
    readonly CLIENT_SECRET: string;
    readonly FHIR_STRICT: boolean;
    readonly SCOPE: string;
    readonly AUTH_MODE: EAuthorizationMode;
  };
  readonly storage: TInstanceOptions;
};

export type TRequest = {
  readonly headers?: any;
  readonly data?: any;
  readonly method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
};

export type TRequestResponse<D = any> = {
  readonly data: D;
  readonly status: number;
};

export type TPublicAPI = {
  readonly authorize: (
    credentials?: any
  ) => Promise<TRequestResponse<TAuthorizationData>>;
  readonly request: (
    endpoint: string,
    parameters: TRequest
  ) => Promise<TRequestResponse>;
  readonly closeSession: () => Promise<TRequestResponse>;
  readonly getUserInfo: () => Promise<TRequestResponse>;
  readonly resource: any;
};

type TAuthResponse = Promise<TRequestResponse<TAuthorizationData>>;

const getAuthorizationToken = async (
  storage: TInstanceOptions
): Promise<string | undefined> => {
  try {
    return await storage.obtainFromStorage('app.aidbox.auth.resource');
  } catch (error) {
    return undefined;
  }
};

const setAuthorizationToken = async (
  storage: TInstanceOptions,
  token: string
): Promise<any> => {
  try {
    return await storage.insertIntoStorage('app.aidbox.auth.resource', token);
  } catch (error) {
    return;
  }
};

const request = (context: TContext) => async (
  endpoint: string,
  parameters: TRequest = {}
): Promise<TRequestResponse> => {
  const method = parameters.method || ('data' in parameters ? 'POST' : 'GET');
  const isDataSendMethod = /POST|PUT|PATCH/.test(method);

  const uri = [
    // TODO: use default lib for handle uri
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

const runRequest = async (uri, params) => {
  try {
    const response = await fetch(uri, params);
    const responseData = await parseResponse(response);

    return { data: responseData, status: response.status };
  } catch (exception) {
    return { data: exception, status: 0 };
  }
};

const resourceOwnerAuthorization = async (
  context: TContext,
  credentials
): Promise<TRequestResponse> => {
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

const getUserInfo = (context: TContext) => (): Promise<TRequestResponse> => {
  return request(context)('/auth/userinfo');
};

const authorize = (context: TContext) => async (
  params
): Promise<TAuthResponse | any> => {
  if (context.box.AUTH_MODE === EAuthorizationMode.RESOURCE_OWNER_GRANT) {
    return resourceOwnerAuthorization(context, params);
  }

  if (context.box.AUTH_MODE === EAuthorizationMode.IMPLICIT_GRANT) {
    return typeof params === 'string'
      ? setAuthorizationToken(context.storage, params)
      : implicitAuthorization(context);
  }
};

const closeSession = (
  context: TContext
) => async (): Promise<TRequestResponse> => {
  const response = await request(context)('/Session', { method: 'DELETE' });
  await setAuthorizationToken(context.storage, '');
  return response;
};

const initializeInstance = (
  credentials: TInstanceCredentials,
  options?: TInstanceOptions
): TPublicAPI | Error => {
  const {
    URL,
    CLIENT_ID,
    CLIENT_SECRET,
    SCOPE,
    FHIR_STRICT = false,
    AUTH_MODE = EAuthorizationMode.RESOURCE_OWNER_GRANT,
  } = credentials;
  const { insertIntoStorage, obtainFromStorage } = options;

  if (!URL) {
    return new Error('@aidbox/client-js-sdk: Provide Aidbox URL');
  }

  if (!CLIENT_ID) {
    return new Error('@aidbox/client-js-sdk: Provide Aidbox CLIENT_ID');
  }

  if (!CLIENT_SECRET) {
    return new Error('@aidbox/client-js-sdk: Provide Aidbox CLIENT_SECRET');
  }

  if (
    typeof insertIntoStorage !== 'function' ||
    typeof obtainFromStorage !== 'function'
  ) {
    return new Error(
      '@aidbox/client-js-sdk: Provide insertIntoStorage and obtainFromStorage methods'
    );
  }

  const context = {
    box: { URL, CLIENT_ID, CLIENT_SECRET, AUTH_MODE, FHIR_STRICT, SCOPE },
    storage: { insertIntoStorage, obtainFromStorage },
  };

  return {
    request: request(context),
    authorize: authorize(context),
    closeSession: closeSession(context),
    getUserInfo: getUserInfo(context),
    resource,
  };
};

export const Client = {
  initializeInstance,
};

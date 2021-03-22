import * as resource from './resource.json';

export enum EAuthorizationMode {
  RESOURCE_OWNER_GRANT,
  CLIENT_CREDENTIALS_GRANT,
}

export enum EAPIMode {
  FHIR,
  AIDBOX,
}

export type TInstanceCredentials = {
  readonly URL: string;
  readonly CLIENT_ID: string;
  readonly CLIENT_SECRET: string;
  readonly AUTH_MODE?: EAuthorizationMode;
};

export type TInstanceOptions = {
  readonly insertIntoStorage: (
    name: string,
    value: string
  ) => Promise<void> | void;
  readonly obtainFromStorage: (name: string) => Promise<string> | string;
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
};

type TContext = {
  readonly box: {
    readonly URL: string;
    readonly CLIENT_ID: string;
    readonly CLIENT_SECRET: string;
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
    credentials: any
  ) => Promise<TRequestResponse<TAuthorizationData>>;
  readonly request: (
    endpoint: string,
    parameters: TRequest
  ) => Promise<TRequestResponse>;
  readonly closeSession: () => Promise<TRequestResponse>;
  readonly getUserInfo: () => Promise<TRequestResponse>;
  readonly resource: any;
};

const request = (context: TContext) => async (
  endpoint,
  parameters: TRequest = {}
): Promise<TRequestResponse> => {
  try {
    const isDataExisted = 'data' in parameters;

    const token = await context.storage.obtainFromStorage(
      'app.aidbox.auth.resource'
    );

    const request = await fetch(`${context.box.URL}${endpoint}`, {
      method: isDataExisted ? 'POST' : 'GET',
      headers: {
        ...(isDataExisted && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...parameters.headers,
      },
      ...(isDataExisted && { body: JSON.stringify(parameters.data) }),
      //mode: 'cors', // no-cors, *cors, same-origin
      //cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      //credentials: 'same-origin', // include, *same-origin, omit
      //redirect: 'follow', // manual, *follow, error
      //referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      //signal: () => null
    });

    const response = await request.json();

    return { data: response, status: request.status };
  } catch (exception) {
    return { data: { message: 'something went wrong...' }, status: 0 };
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
    context.storage.insertIntoStorage(
      'app.aidbox.auth.resource',
      response.data.access_token
    );
  }

  return response;
};

const getUserInfo = (context: TContext) => (): Promise<TRequestResponse> => {
  return request(context)('/auth/userinfo');
};

const authorize = (context: TContext) => async (
  credentials
): Promise<TRequestResponse<TAuthorizationData>> => {
  if (context.box.AUTH_MODE === EAuthorizationMode.RESOURCE_OWNER_GRANT) {
    return resourceOwnerAuthorization(context, credentials);
  }
};

const closeSession = (
  context: TContext
) => async (): Promise<TRequestResponse> => {
  const response = await request(context)('/Session', { method: 'DELETE' });
  context.storage.insertIntoStorage('app.aidbox.auth.resource', '');
  return response;
};

const initializeInstance = (
  credentials: TInstanceCredentials,
  options: TInstanceOptions
): TPublicAPI | Error => {
  const {
    URL,
    CLIENT_ID,
    CLIENT_SECRET,
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
    box: { URL, CLIENT_ID, CLIENT_SECRET, AUTH_MODE },
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

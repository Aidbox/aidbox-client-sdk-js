export enum EAuthorizationMode {
  RESOURCE_OWNER_GRANT,
  IMPLICIT_GRANT,
}

export type TInstanceCredentials = {
  readonly URL: string;
  readonly CLIENT_ID: string;
  readonly CLIENT_SECRET?: string;
  readonly FHIR_STRICT?: boolean;
  readonly SCOPE?: string;
  readonly AUTH_MODE?: EAuthorizationMode;
};

export type TInstanceOptions = {
  readonly insertIntoStorage: (
    name: string,
    value: string
  ) => Promise<void> | void;
  readonly obtainFromStorage: (name: string) => Promise<string> | string | null;
  readonly removeFromStorage: (name: string) => Promise<void> | void;
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
    readonly [k: string]: any;
  };
  readonly error_description?: string;
  readonly error?: string;
};

export type TContext = {
  readonly box: {
    readonly URL: string;
    readonly CLIENT_ID: string;
    readonly CLIENT_SECRET?: string;
    readonly FHIR_STRICT: boolean;
    readonly SCOPE?: string;
    readonly AUTH_MODE: EAuthorizationMode;
  };
  readonly storage: TInstanceOptions;
};

export type TRequest = {
  readonly headers?: any;
  readonly data?: any;
  readonly queryParams?: Record<string, any>;
  readonly method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
};

export type TRequestResponse<D = any> = {
  readonly data: D;
  readonly status: number;
};

export type TCredentials = {
  readonly username: string;
  readonly password: string;
};

export type TPublicAPI = {
  readonly authorize: (
    credentials?: any
  ) => Promise<TRequestResponse<TAuthorizationData>>;
  readonly request: (
    endpoint: string,
    parameters?: TRequest
  ) => Promise<TRequestResponse>;
  readonly closeSession: () => Promise<TRequestResponse>;
  readonly getUserInfo: () => Promise<TRequestResponse>;
  readonly getToken: () => Promise<string | null>;
  readonly setToken: (token: string) => Promise<any>;
  readonly resetToken: () => Promise<void>;
};

export type TAuthResponse = Promise<TRequestResponse<TAuthorizationData>>;

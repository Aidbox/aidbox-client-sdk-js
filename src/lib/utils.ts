export const dataToQuery = (data: any): string => {
  if (!data) return '';
  return Object.entries(data)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
};

export const parseResponse = (response: any) => {
  switch (response?.headers?.get('Content-Type')) {
    case 'application/json':
      return response.json();
    default:
      return response.text();
  }
};

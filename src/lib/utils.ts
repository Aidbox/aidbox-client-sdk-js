export const dataToQuery = (data: any): string => {
  if (!data) return '';
  return Object.entries(data)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
};

export const parseResponse = (response: any) => {
  const contentType: string = response?.headers?.get('Content-Type');
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

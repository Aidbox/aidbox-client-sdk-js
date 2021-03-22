// function parseUrlComponent(queryOrHash) {
//   const fragment = queryOrHash.substring(1);
//   const params = {};
//   const regex = /([^&=]+)=([^&]*)/g;
//   let m = null;
//   while ((m = regex.exec(fragment))) {
//     params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
//   }
//   return params;
// }
//
// function join(...parts) {
//   return parts.reduce((path, part) => {
//     return part ? path.replace(/\/?$/, '/') + part : path;
//   });
// }
//
// function randomstring() {
//   return Math.random().toString(36).substring(2);
// }
//
// const resolvePath = (baseURL, ...parts) => {
//   return join(resolve(this.aidboxUrl, path), ...parts);
// }

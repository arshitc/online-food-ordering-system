const stripTrailingSlash = (value = "") => value.replace(/\/+$/, "");

const isLocalHostname = (hostname = "") =>
  hostname === "localhost" || hostname === "127.0.0.1";

const getDefaultServerOrigin = () => {
  if (typeof window === "undefined") {
    return "http://localhost:5050";
  }

  const { hostname, origin, protocol } = window.location;

  if (isLocalHostname(hostname)) {
    return `${protocol}//${hostname}:5050`;
  }

  return stripTrailingSlash(origin);
};

const defaultServerOrigin = getDefaultServerOrigin();

export const API_BASE_URL = stripTrailingSlash(
  process.env.REACT_APP_API_URL || `${defaultServerOrigin}/api`
);

export const SOCKET_URL = stripTrailingSlash(
  process.env.REACT_APP_SOCKET_URL || defaultServerOrigin
);

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const ENABLE_REALTIME =
  process.env.REACT_APP_ENABLE_REALTIME === "true" ||
  (typeof window !== "undefined" && isLocalHostname(window.location.hostname));

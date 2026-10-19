// The request header the middleware sets to the request path: a layout cannot
// read the path itself, and the portal layout needs it to keep the auth pages
// on the plain layout for a signed-in member (KI084).
export const PATHNAME_HEADER = 'x-pathname'

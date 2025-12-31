export const withDbName = (databaseUrl: string, dbName: string) => {
  const url = new URL(databaseUrl);
  url.pathname = `/${dbName}`;
  return url.toString();
};

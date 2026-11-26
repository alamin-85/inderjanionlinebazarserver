
let authInstance = null;

async function getAuth() {
  if (!authInstance) {
    const authModule = await import("./auth.mjs");
    authInstance = authModule.auth;
  }

  return authInstance;
}

module.exports = { getAuth };

import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk"

// Initialize parameters.
const primusZKTLS = new PrimusZKTLS();
const appId = "0x5c4b35a78081b25c779575b75c5224aa921771b3";
const userAddress = "0xA830Cd34D83C10Ba3A8bB2F25ff8BBae9BcD0125";
const attTemplateID = "22cae243-06b6-484d-89cb-bc571b4025be";

// Lazy init (no top-level await — avoids build target issues).
let initPromise = null;
async function ensureInit() {
  if (initPromise) return initPromise;
  let platformDevice = "pc";
  if (typeof navigator !== "undefined" && navigator.userAgent) {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("android")) platformDevice = "android";
    else if (ua.includes("iphone")) platformDevice = "ios";
  }
  initPromise = primusZKTLS.init(appId, "", { platform: platformDevice });
  const result = await initPromise;
  console.log("primusProof initAttestaionResult=", result);
  return result;
}

export async function primusProof() {
  await ensureInit();
  // Generate attestation request
  const request = primusZKTLS.generateRequestParams(attTemplateID, userAddress);

  // Set additionParams. (This is optional)
  const additionParams = JSON.stringify({ "additionParamsKey1": "additionParamsVaule1" });
  request.setAdditionParams(additionParams);

  // Set tls mode, default is proxy model. (This is optional)
  const proxyMode = "proxytls"
  request.setAttMode({
    algorithmType: proxyMode
  });

  // Transfer request object to string.
  const requestStr = request.toJsonString();

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:9000';
  const response = await fetch(`${apiBase}/primus/sign?signParams=${requestStr}`);
  const responseJson = await response.json();
  const signedRequestStr = responseJson.signResult;

  // Start attestation process.
  const attestation = await primusZKTLS.startAttestation(signedRequestStr);
  console.log("attestation=", attestation);

  // Verify siganture
  const verifyResult = await primusZKTLS.verifyAttestation(attestation)
  console.log("verifyResult=", verifyResult);

  if (verifyResult === true) {
    // Business logic checks, such as attestation content and timestamp checks
    // do your own business logic
  } else {
    // If failed, define your own logic.
  }
}
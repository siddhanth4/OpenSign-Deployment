import axios from "axios";
import { serverUrl_fn } from "./appinfo";
const parseAppId = process.env.REACT_APP_APPID ? process.env.REACT_APP_APPID : "opensign";
const serverUrl = serverUrl_fn();

// Dynamically fetch headers so it ALWAYS includes the Session Token
const getHeaders = () => ({
  "Content-Type": "application/json",
  "X-Parse-Application-Id": parseAppId,
  "X-Parse-Session-Token": localStorage.getItem("accesstoken")
});

export const SaveFileSize = async (size, imageUrl, tenantId, userId) => {
  const safeTenantId = tenantId || localStorage.getItem("TenantId") || JSON.parse(localStorage.getItem("Extand_Class") || "[]")?.[0]?.TenantId?.objectId;
  
  const tenantPtr = {
    __type: "Pointer",
    className: "partners_Tenant",
    objectId: safeTenantId
  };
  const UserPtr = userId ? { __type: "Pointer", className: "_User", objectId: userId } : null;
  const _tenantPtr = JSON.stringify(tenantPtr);
  
  try {
    const res = await axios.get(
      `${serverUrl}/classes/partners_TenantCredits?where={"PartnersTenant":${_tenantPtr}}`,
      { headers: getHeaders() } 
    );
    const response = res.data.results;
    if (response && response.length > 0) {
      const data = {
        usedStorage: response[0].usedStorage ? response[0].usedStorage + size : size
      };
      await axios.put(`${serverUrl}/classes/partners_TenantCredits/${response[0].objectId}`, data, { headers: getHeaders() });
    } else {
      const data = { usedStorage: size, PartnersTenant: tenantPtr, AllowedStorage: 5000000000, AllowedUsers: 100 };
      await axios.post(`${serverUrl}/classes/partners_TenantCredits`, data, { headers: getHeaders() });
    }
  } catch (err) {
    console.log("err in save usage", err);
  }
  saveDataFile(size, imageUrl, tenantPtr, UserPtr);
};

const saveDataFile = async (size, imageUrl, tenantPtr, UserId) => {
  const data = {
    FileUrl: imageUrl,
    FileSize: size,
    TenantPtr: tenantPtr,
    ...(UserId ? { UserId: UserId } : {})
  };
  try {
    await axios.post(`${serverUrl}/classes/partners_DataFiles`, data, { headers: getHeaders() }); 
  } catch (err) {
    console.log("err in save usage ", err);
  }
};
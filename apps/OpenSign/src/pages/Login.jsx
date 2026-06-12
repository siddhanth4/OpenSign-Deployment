import { useEffect, useState } from "react";
import Parse from "parse";
import { useDispatch } from "react-redux";
import axios from "axios";
import { NavLink, useNavigate, useLocation } from "react-router";
import login_img from "../assets/images/login_img.svg";
import myLogo from "../assets/images/legaldata.png"; 
import { useWindowSize } from "../hook/useWindowSize";
import { emailRegex } from "../constant/const";
import Alert from "../primitives/Alert";
import { appInfo } from "../constant/appinfo";
import { fetchAppInfo } from "../redux/reducers/infoReducer";
import { showTenant } from "../redux/reducers/ShowTenant";
import {
  getAppLogo,
  saveLanguageInLocal,
  usertimezone
} from "../constant/Utils";
import Loader from "../primitives/Loader";
import { useTranslation } from "react-i18next";
import SelectLanguage from "../components/pdf/SelectLanguage";

function Login() {
  const appName = "OpenSign™";
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { width } = useWindowSize();
  const [state, setState] = useState({
    email: "",
    password: "",
    alertType: "success",
    alertMsg: "",
    passwordVisible: false,
    loading: false,
    thirdpartyLoader: false,
  });
  
  const [image, setImage] = useState();
  const [errMsg, setErrMsg] = useState();

  useEffect(() => {
    handleUserExist();
    // eslint-disable-next-line
  }, []);

  const handleUserExist = async () => {
      checkUserExt();
  };

  const setLocalVar = (user) => {
    localStorage.setItem("accesstoken", user.sessionToken);
    localStorage.setItem("UserInformation", JSON.stringify(user));
    localStorage.setItem("userEmail", user.email);
    if (user.ProfilePic) {
      localStorage.setItem("profileImg", user.ProfilePic);
    } else {
      localStorage.setItem("profileImg", "");
    }
  };

  const showToast = (type, msg) => {
    setState({ ...state, loading: false, alertType: type, alertMsg: msg });
    setTimeout(() => setState({ ...state, alertMsg: "" }), 2000);
  };

  const checkUserExt = async () => {
    const app = await getAppLogo();
    if (app?.error === "invalid_json") {
      setErrMsg(t("server-down", { appName: appName }));
    } else if (app?.user === "not_exist") {
      navigate("/addadmin");
    }
    if (app?.logo) {
      setImage(app?.logo);
    } else {
      setImage(appInfo?.applogo || undefined);
    }
    dispatch(fetchAppInfo());
    if (localStorage.getItem("accesstoken")) {
      setState({ ...state, loading: true });
      GetLoginData();
    }
  };

  const handleChange = (event) => {
    let { name, value } = event.target;
    if (name === "email") {
      value = value?.toLowerCase()?.replace(/\s/g, "");
    }
    setState({ ...state, [name]: value });
  };

  const handleLogin = async () => {
    const email = state?.email;
    const password = state?.password;

    if (!email || !password) {
      return;
    }
    localStorage.removeItem("accesstoken");
    try {
      setState({ ...state, loading: true });
      localStorage.setItem("appLogo", appInfo?.applogo || "");
      
      const loggedInUser = await Parse.User.logIn(email, password);
      const _user = loggedInUser.toJSON();
      _user.sessionToken = loggedInUser.getSessionToken();

      try {
        await Parse.User.become(_user.sessionToken);
        setLocalVar(_user);
        await continueLoginFlow();
      } catch (error) {
        console.error("Error checking 2FA status:", error);
        setState({ ...state, loading: false });
        showToast("danger", t("something-went-wrong-mssg"));
      }
    } catch (error) {
      console.error("Error while logging in user", error);
      setState({ ...state, loading: false });
      if (error?.code === 1001) {
        showToast("danger", t("action-prohibited"));
      } else if (error?.code === 101) {
        showToast("danger", t("invalid-username-password-region") || "Invalid username/password");
      } else {
        showToast("danger", t("invalid-username-password-region") || "Invalid username/password");
      }
    }
  };

  const handleLoginBtn = async (event) => {
    event.preventDefault();
    if (!emailRegex.test(state.email)) {
      alert(t("valid-email-alert"));
      return;
    }
    await handleLogin();
  };

  const GetLoginData = async () => {
    setState({ ...state, loading: true });
    try {
      const user = await Parse.User.become(localStorage.getItem("accesstoken"));
      const _user = user.toJSON();
      setLocalVar(_user);
      
      const extUser = await Parse.Cloud.run("getUserDetails");
      if (extUser) {
        // Ensure object is parsed correctly
        const extInfo = typeof extUser.toJSON === "function" ? extUser.toJSON() : extUser;
        const IsDisabled = extInfo?.IsDisabled || false;
        
        if (!IsDisabled) {
          const userRole = extInfo?.UserRole || "contracts_User"; // Safe fallback role
          const userSettings = appInfo?.settings || [];
          let menu = userSettings.find((m) => m.role === userRole);

          // 🚀 FIX: Fallback to prevent "Role not found" crash
          if (!menu) {
            console.warn(`Menu mapping for role '${userRole}' not found. Using fallback.`);
            menu = {
              role: userRole,
              pageType: "dashboard",
              pageId: "home",
              menuId: "default"
            };
          }

          const _role = userRole.replace("contracts_", "");
          localStorage.setItem("_user_role", _role);
          const redirectUrl = location?.state?.from || `/${menu.pageType}/${menu.pageId}`;
          
          localStorage.setItem("Extand_Class", JSON.stringify([extInfo]));
          localStorage.setItem("userEmail", extInfo?.Email || "");
          localStorage.setItem("username", extInfo?.Name || "");
          
          if (extInfo?.TenantId) {
            const tenant = {
              Id: extInfo?.TenantId?.objectId || extInfo?.TenantId?.id || "",
              Name: extInfo?.TenantId?.TenantName || ""
            };
            localStorage.setItem("TenantId", tenant.Id);
            dispatch(showTenant(tenant.Name));
            localStorage.setItem("TenantName", tenant.Name);
          }
          
          localStorage.setItem("PageLanding", menu.pageId);
          localStorage.setItem("defaultmenuid", menu.menuId);
          localStorage.setItem("pageType", menu.pageType);
          navigate(redirectUrl);
          
        } else {
          showToast("danger", t("do-not-access-contact-admin"));
          logOutUser();
        }
      } else {
        showToast("danger", t("user-not-found"));
        logOutUser();
      }
    } catch (error) {
      showToast("danger", t("something-went-wrong-mssg"));
      setState({ ...state, loading: false });
      console.log("err", error);
    }
  };

  const togglePasswordVisibility = () => {
    setState({ ...state, passwordVisible: !state.passwordVisible });
  };

  const logOutUser = async () => {
    try {
      await Parse.User.logOut();
    } catch (err) {
      console.log("Err while logging out", err);
    }
    let appdata = localStorage.getItem("userSettings");
    let applogo = localStorage.getItem("appLogo");
    let defaultmenuid = localStorage.getItem("defaultmenuid");
    let PageLanding = localStorage.getItem("PageLanding");
    let baseUrl = localStorage.getItem("baseUrl");
    let appid = localStorage.getItem("parseAppId");
    let favicon = localStorage.getItem("favicon");

    localStorage.clear();
    saveLanguageInLocal(i18n);

    localStorage.setItem("appLogo", applogo);
    localStorage.setItem("defaultmenuid", defaultmenuid);
    localStorage.setItem("PageLanding", PageLanding);
    localStorage.setItem("userSettings", appdata);
    localStorage.setItem("baseUrl", baseUrl);
    localStorage.setItem("parseAppId", appid);
    localStorage.setItem("favicon", favicon);
  };

  const continueLoginFlow = async () => {
    try {
      const extUser = await Parse.Cloud.run("getUserDetails");
      if (extUser) {
        // Ensure object is parsed correctly whether it's a Parse.Object or plain JSON
        const extInfo = typeof extUser.toJSON === "function" ? extUser.toJSON() : extUser;
        const IsDisabled = extInfo?.IsDisabled || false;
        
        if (!IsDisabled) {
          const userRole = extInfo?.UserRole || "contracts_User"; // Safe fallback
          const userSettings = appInfo?.settings || [];
          let menu = userSettings.find((m) => m.role === userRole);

          // 🚀 FIX: Fallback instead of throwing "Role not found"
          if (!menu) {
            console.warn(`Menu mapping for role '${userRole}' not found. Using fallback.`);
            menu = {
              role: userRole,
              pageType: "dashboard",
              pageId: "home",
              menuId: "default"
            };
          }

          const redirectUrl = location?.state?.from || `/${menu.pageType}/${menu.pageId}`;
          const _role = userRole.replace("contracts_", "");
          localStorage.setItem("_user_role", _role);
          
          const checkLanguage = extInfo?.Language;
          if (checkLanguage) {
            i18n.changeLanguage(checkLanguage);
          }
          
          localStorage.setItem("Extand_Class", JSON.stringify([extInfo]));
          localStorage.setItem("userEmail", extInfo?.Email || "");
          localStorage.setItem("username", extInfo?.Name || "");
          
          if (extInfo?.TenantId) {
            const tenant = {
              Id: extInfo?.TenantId?.objectId || extInfo?.TenantId?.id || "",
              Name: extInfo?.TenantId?.TenantName || ""
            };
            localStorage.setItem("TenantId", tenant.Id);
            dispatch(showTenant(tenant.Name));
            localStorage.setItem("TenantName", tenant.Name);
          }
          
          localStorage.setItem("PageLanding", menu.pageId);
          localStorage.setItem("defaultmenuid", menu.menuId);
          localStorage.setItem("pageType", menu.pageType);
          
          setState({ ...state, loading: false });
          navigate(redirectUrl);
          
        } else {
          showToast("danger", t("do-not-access-contact-admin"));
          logOutUser();
        }
      } else {
          showToast("danger", t("user-not-found"));
          logOutUser();
      }
    } catch (error) {
      console.error("Error during login flow", error);
      setState({ ...state, loading: false });
      showToast("danger", error.message || t("something-went-wrong-mssg"));
    }
  };

  return errMsg ? (
    <div className="h-screen flex justify-center text-center items-center p-4 text-gray-500 text-base">
      {errMsg}
    </div>
  ) : (
    <>
      {state.loading && (
        <div
          aria-live="assertive"
          className="fixed w-full h-full flex justify-center items-center bg-black bg-opacity-30 z-50"
        >
          <Loader />
        </div>
      )}
      {appInfo && appInfo.appId ? (
        <>
          <div
            aria-labelledby="loginHeading"
            role="region"
            className="pb-1 md:pb-4 pt-10 md:px-10 lg:px-16 h-full"
          >
            <div className="md:p-4 lg:p-10 p-4 bg-base-100 text-base-content op-card">
              <div className="w-[800px] h-[150px] inline-block overflow-hidden mb-90">
  {/* Flex row with increased gap to accommodate larger logos */}
  <div className="flex flex-row items-center gap-8">
    
    {/* 1. Legal Data Forensic Logo (Now very prominent) */}
    <img
      src={myLogo}
      className="object-contain h-[120px] w-auto"
      alt="Legal Data Forensic"
    />

    {/* Vertical Separator - Increased height and thickness to match */}
    <div className="w-[3px] h-[70px] bg-gray-300"></div>

    {/* 2. OpenSign Logo (Larger than before) */}
    {image && (
      <img
        src={image}
        className="object-contain h-[50px] w-auto"
        alt="applogo"
      />
    )}
  </div>
</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2">
                <div>
                  <form onSubmit={handleLoginBtn} aria-label="Login Form">
                    <h1 className="text-[30px] mt-6">{t("welcome")}</h1>
                    <fieldset>
                      <legend className="text-[12px] text-[#878787]">
                        {t("Login-to-your-account")}
                      </legend>
                      <div className="w-full px-6 py-3 my-1 op-card bg-base-100 shadow-md outline outline-1 outline-slate-300/50">
                        <label className="block text-xs" htmlFor="email">
                          {t("email")}
                        </label>
                        <input
                          id="email"
                          type="email"
                          className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                          name="email"
                          autoComplete="username"
                          value={state.email}
                          onChange={handleChange}
                          required
                          onInvalid={(e) =>
                            e.target.setCustomValidity(t("input-required"))
                          }
                          onInput={(e) => e.target.setCustomValidity("")}
                        />
                        <hr className="my-1 border-none" />
                            <label className="block text-xs" htmlFor="password">
                              {t("password")}
                            </label>
                            <div className="relative">
                              <input
                                id="password"
                                type={
                                  state.passwordVisible ? "text" : "password"
                                }
                                className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                                name="password"
                                value={state.password}
                                autoComplete="current-password"
                                onChange={handleChange}
                                onInvalid={(e) =>
                                  e.target.setCustomValidity(
                                    t("input-required")
                                  )
                                }
                                onInput={(e) => e.target.setCustomValidity("")}
                                required
                              />
                              <span
                                className="absolute cursor-pointer top-[50%] right-[10px] -translate-y-[50%] text-base-content"
                                onClick={togglePasswordVisibility}
                              >
                                {state.passwordVisible ? (
                                  <i className="fa-light fa-eye-slash text-xs pb-1" />
                                ) : (
                                  <i className="fa-light fa-eye text-xs pb-1 " />
                                )}
                              </span>
                            </div>
                          <div className="relative mt-1">
                            <NavLink
                              to="/forgetpassword"
                              className="text-[13px] op-link op-link-primary underline-offset-1 focus:outline-none ml-1"
                            >
                              {t("forgot-password")}?
                            </NavLink>
                          </div>
                      </div>
                    </fieldset>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-center text-xs font-bold mt-2">
                      <button
                        type="submit"
                        className="op-btn op-btn-primary"
                        disabled={state.loading}
                      >
                        {state.loading ? t("loading") : t("login")}
                      </button>
                    </div>
                    {/* <div className="text-center mt-4 text-xs">
                      <span className="text-gray-600">{t("dont-have-account") || "Don't have an account?"} </span>
                      <NavLink
                        to="/addadmin"
                        className="op-link op-link-primary underline font-semibold"
                      >
                        {t("sign-up") || "Sign up"}
                      </NavLink>
                    </div> */}
                  </form>
                </div>
                {width >= 768 && (
                  <div className="place-self-center">
                    <div className="mx-auto md:w-[300px] lg:w-[400px] xl:w-[500px]">
                      <img
                        src={login_img}
                        alt="Workspace illustration"
                        width="100%"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <SelectLanguage />
            {state.alertMsg && (
              <Alert type={state.alertType}>{state.alertMsg}</Alert>
            )}
          </div>
        </>
      ) : (
        <div
          aria-live="assertive"
          className="fixed w-full h-full flex justify-center items-center z-50"
        >
          <Loader />
        </div>
      )}
    </>
  );
}
export default Login;
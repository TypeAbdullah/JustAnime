import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faRandom,
  faMagnifyingGlass,
  faXmark,
  faBell,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/src/context/LanguageContext";
import { Link, useLocation } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import { SearchProvider } from "@/src/context/SearchContext";
import WebSearch from "../searchbar/WebSearch";
import MobileSearch from "../searchbar/MobileSearch";
import { useAuth } from "@/src/context/AuthContext";

function Navbar() {
  const location = useLocation();
  const { language, toggleLanguage } = useLanguage();
  const auth = useAuth();
  const [isNotHomePage, setIsNotHomePage] = useState(
    location.pathname !== "/" && location.pathname !== "/home"
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ username: "", password: "", display_name: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleHamburgerClick = () => {
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleRandomClick = () => {
    if (location.pathname === "/random") {
      window.location.reload();
    }
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      if (authMode === "register") {
        await auth.register(authForm);
      } else {
        await auth.login({ username: authForm.username, password: authForm.password });
      }
      setAuthForm({ username: "", password: "", display_name: "" });
      setIsAuthOpen(false);
    } catch (error) {
      setAuthError(error?.response?.data?.detail || error.message || "Account request failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    setIsNotHomePage(
      location.pathname !== "/" && location.pathname !== "/home"
    );
  }, [location.pathname]);

  return (
    <SearchProvider>
      <nav
        className={`fixed top-0 left-0 w-full z-[1000000] transition-all duration-300 ease-in-out
          ${(isScrolled || isNotHomePage) 
            ? "bg-black/80 backdrop-blur-md shadow-lg border-b border-white/5" 
            : "bg-transparent"}`}
      >
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 h-14 flex items-center justify-between">
          {/* Left Section: Hamburger & Logo */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Custom Hamburger */}
            <button 
              onClick={handleHamburgerClick}
              className="flex flex-col gap-[4px] cursor-pointer group p-2 -ml-2"
            >
              <div className="w-5 h-[2px] bg-white/70 group-hover:bg-white transition-colors"></div>
              <div className="w-5 h-[2px] bg-white/70 group-hover:bg-white transition-colors"></div>
            </button>
            
            <Link to="/home" className="flex items-center">
              <span className="text-xl font-black text-white tracking-tighter uppercase italic">
                ANIMETSU
              </span>
            </Link>
          </div>


  useEffect(() => {
    setIsNotHomePage(
      location.pathname !== "/" && location.pathname !== "/home"
    );
  }, [location.pathname]);

  return (
    <SearchProvider>
      <nav
        className={`fixed top-0 left-0 w-full z-[1000000] transition-all duration-300 ease-in-out
          ${(isScrolled || isNotHomePage) 
            ? "bg-black/80 backdrop-blur-md shadow-lg border-b border-white/5" 
            : "bg-transparent"}`}
      >
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 h-14 flex items-center justify-between">
          {/* Left Section: Hamburger & Logo */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Custom Hamburger */}
            <button 
              onClick={handleHamburgerClick}
              className="flex flex-col gap-[4px] cursor-pointer group p-2 -ml-2"
            >
              <div className="w-5 h-[2px] bg-white/70 group-hover:bg-white transition-colors"></div>
              <div className="w-5 h-[2px] bg-white/70 group-hover:bg-white transition-colors"></div>
            </button>
            
            <Link to="/home" className="flex items-center">
              <span className="text-xl font-black text-white tracking-tighter uppercase italic">
                ANIMETSU
              </span>
            </Link>
          </div>

          {/* Right Section: Search & Icons */}
          <div className="flex items-center gap-3 sm:gap-6 flex-1 justify-end">
            <div className="hidden md:block w-full max-w-[400px]">
              <WebSearch />
            </div>

            <div className="flex items-center gap-4 sm:gap-6 text-white/60">
              {/* Mobile Search Icon */}
              <button
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className="md:hidden hover:text-white transition-colors"
              >
                <FontAwesomeIcon 
                  icon={isMobileSearchOpen ? faXmark : faMagnifyingGlass} 
                  className="text-[17px]"
                />
              </button>
              <button className="hover:text-white transition-colors relative">
                <FontAwesomeIcon icon={faBell} className="text-[17px]" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0a0a]"></span>
              </button>
              <button
                className="hover:text-white transition-colors"
                onClick={() => setIsAuthOpen((open) => !open)}
                title={auth?.user ? auth.user.username : "Account"}
              >
                <FontAwesomeIcon icon={faUser} className="text-[17px]" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Dropdown */}
        {isMobileSearchOpen && (
        </div>
        )}

        {isAuthOpen && (
          <div className="absolute right-3 sm:right-6 top-14 w-[min(92vw,340px)] rounded-xl border border-white/10 bg-[#111] p-4 text-white shadow-2xl">
            {auth?.user ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/40">Signed in</p>
                  <p className="font-bold">{auth.user.display_name || auth.user.username}</p>
                  <p className="text-sm text-white/50">@{auth.user.username}</p>
                </div>
                <button
                  onClick={async () => {
                    await auth.logout();
                    setIsAuthOpen(false);
                  }}
                  className="w-full rounded-lg bg-white px-3 py-2 text-sm font-bold text-black hover:bg-white/90"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-3">
                <div className="flex rounded-lg bg-white/5 p-1 text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className={`flex-1 rounded-md py-1.5 ${authMode === "login" ? "bg-white text-black" : "text-white/60"}`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("register")}
                    className={`flex-1 rounded-md py-1.5 ${authMode === "register" ? "bg-white text-black" : "text-white/60"}`}
                  >
                    Register
                  </button>
                </div>
                {authMode === "register" && (
                  <input
                    value={authForm.display_name}
                    onChange={(e) => setAuthForm((form) => ({ ...form, display_name: e.target.value }))}
                    placeholder="Display name"
                    className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-white/40"
                  />
                )}
                <input
                  value={authForm.username}
                  onChange={(e) => setAuthForm((form) => ({ ...form, username: e.target.value }))}
                  placeholder="Username"
                  className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-white/40"
                  required
                />
                <input
                  value={authForm.password}
                  onChange={(e) => setAuthForm((form) => ({ ...form, password: e.target.value }))}
                  placeholder="Password"
                  type="password"
                  className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-white/40"
                  required
                />
                {authError && <p className="text-xs text-red-300">{authError}</p>}
                <button
                  disabled={authLoading}
                  className="w-full rounded-lg bg-white px-3 py-2 text-sm font-bold text-black hover:bg-white/90 disabled:opacity-60"
                >
                  {authLoading ? "Please wait..." : authMode === "register" ? "Create account" : "Login"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
      </nav>
    </SearchProvider>
  );
}

export default Navbar;

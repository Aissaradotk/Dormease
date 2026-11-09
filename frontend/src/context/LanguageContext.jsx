import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext({ lang: "th", setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem("dormease_lang") || "th";
  });

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem("dormease_lang", l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

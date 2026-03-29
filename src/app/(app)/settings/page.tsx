"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const router = useRouter();
  const t = useTranslations("settings");
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
    if (match) setLang(match[1]);
  }, []);

  const save = () => {
    document.cookie = `lang=${lang}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1 year
    toast.success(t("saved"));
    // refresh server components
    router.refresh();
  };

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold mb-4">{t("title")}</h1>
      <div className="max-w-sm">
        <label className="block text-sm text-gray-600 mb-2">{t("language")}</label>
        <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full border rounded px-3 py-2">
          <option value="en">{t("languages.en")}</option>
          <option value="it">{t("languages.it")}</option>
        </select>
        <div className="mt-4 flex gap-2">
          <button onClick={save} className="px-4 py-2 bg-accent text-white rounded">{t("save")}</button>
        </div>
      </div>
    </div>
  );
}

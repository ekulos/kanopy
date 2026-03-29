import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/projects");

  const t = await getTranslations("login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white border border-gray-200 rounded-2xl p-10 w-full max-w-sm shadow-sm">
        <div className="flex items-center justify-center mb-8">
          <Image src="/kanopy.svg" alt="Kanopy" width={200} height={300} />
        </div>

        <h1 className="text-xl font-semibold mb-1">{t("welcome")}</h1>
        <p className="text-sm text-gray-500 mb-8">{t("subtitle")}</p>

        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/projects" });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            {t("signInWithGithub")}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">{t("terms")}</p>
      </div>
    </div>
  );
}

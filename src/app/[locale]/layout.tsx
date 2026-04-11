import { SetLocale } from "@/components/set-locale";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <SetLocale locale={locale} />
      {children}
    </>
  );
}

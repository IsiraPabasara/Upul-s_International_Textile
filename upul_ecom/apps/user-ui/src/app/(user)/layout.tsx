import Header from "./shared/widgets/header";

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <Header/>
      <main>{children}</main>

    </section>
  );
}
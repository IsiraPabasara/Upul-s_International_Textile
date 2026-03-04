export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="">
      {/* <AdminSidebar /> */}
      <div className="">
        {children}
      </div>
    </section>
  );
}
import Header from "./shared/widgets/header";
import CartSlider from "./shared/cart-components/CartSlider";

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <Header/>
      <CartSlider />
      <main>{children}</main>

    </section>
  );
}
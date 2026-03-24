import Header from "./shared/widgets/header";
import CartSlider from "./shared/cart-components/CartSlider";
import Footer from "./shared/widgets/footer";

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <Header/>
      <CartSlider />
      <main>{children}</main>
      <Footer/>
    </section>
  );
}
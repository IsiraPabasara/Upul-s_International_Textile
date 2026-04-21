import CartSlider from "./shared/cart-components/CartSlider";
import Footer from "./shared/widgets/footer";
import Header from "./shared/widgets/header";
import WelcomePopup from "./components/WelcomePopup";

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <Header/>
      <CartSlider />
      <WelcomePopup resetDuration={15 * 60 * 1000} showDelay={5 * 1000} />
      <main>{children}</main>
      <Footer/>
    </section>
  );
}
import { Outlet } from "react-router-dom";
import PublicNavbar from "../components/navbar/PublicNavbar";
import Footer from "../components/footer/Footer";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

import Header from "./Header";
import Footer from "./Footer";
import ChatBotAI from "./ChatBotAI";
export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Header />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <ChatBotAI />
    </div>
  );
}

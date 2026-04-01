import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { LeadMagnet } from "./pages/LeadMagnet";
import { ThankYou } from "./pages/ThankYou";
import { Pricing } from "./pages/Pricing";
import { Checkout } from "./pages/Checkout";
import { Dashboard } from "./pages/Dashboard";
import { Legal } from "./pages/Legal";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Account } from "./pages/Account";
import { ProtectedRoute } from "./lib/auth";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "lead-magnet", Component: LeadMagnet },
      { path: "thank-you", Component: ThankYou },
      { path: "pricing", Component: Pricing },
      { path: "checkout", Component: Checkout },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "account",
        element: (
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        ),
      },
      { path: "legal", Component: Legal },
      { path: "privacy", Component: Legal },
      {
        path: "*",
        Component: () => (
          <div className="p-24 text-center text-white dark:text-white">
            Page non trouvee
          </div>
        ),
      },
    ],
  },
]);

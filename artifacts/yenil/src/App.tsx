import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BonusPulProvider } from "@/contexts/BonusPulContext";
import { ToastProvider } from "@/components/Toast";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Demiryol from "@/pages/Demiryol";
import Pay from "@/pages/Pay";
import About from "@/pages/About";
import Help from "@/pages/Help";
import Sms from "@/pages/Sms";
import Tmcell from "@/pages/Tmcell";
import Ulgamlar from "@/pages/Ulgamlar";
import Teklip from "@/pages/Teklip";
import Bazar from "@/pages/Bazar";
import Konum from "@/pages/Konum";
import KonumViewer from "@/pages/KonumViewer";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/konum/:token" component={KonumViewer} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/demiryol" component={Demiryol} />
            <Route path="/pay" component={Pay} />
            <Route path="/about" component={About} />
            <Route path="/help" component={Help} />
            <Route path="/sms" component={Sms} />
            <Route path="/tmcell" component={Tmcell} />
            <Route path="/ulgamlar" component={Ulgamlar} />
            <Route path="/teklip" component={Teklip} />
            <Route path="/bazar" component={Bazar} />
            <Route path="/konum" component={Konum} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BonusPulProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </BonusPulProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;

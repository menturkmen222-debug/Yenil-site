import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Demiryol from "@/pages/Demiryol";
import Pay from "@/pages/Pay";
import About from "@/pages/About";
import Help from "@/pages/Help";
import Sms from "@/pages/Sms";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/demiryol" component={Demiryol} />
        <Route path="/pay" component={Pay} />
        <Route path="/about" component={About} />
        <Route path="/help" component={Help} />
        <Route path="/sms" component={Sms} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;

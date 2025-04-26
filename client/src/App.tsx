import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import PasswordEntry from "@/pages/PasswordEntry";
import ChatRoom from "@/pages/ChatRoom";

function Router() {
  return (
    <Switch>
      <Route path="/" component={PasswordEntry} />
      <Route path="/chat/:roomId" component={ChatRoom} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;

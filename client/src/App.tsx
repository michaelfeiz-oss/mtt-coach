import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import TournamentDetail from "@/pages/TournamentDetail";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import LogTournament from "./pages/LogTournament";
import HandsList from "./pages/HandsList";
import HandDetail from "./pages/HandDetail";
import BottomNav from "./components/BottomNav";
import Log from "./pages/Log";
import Notes from "./pages/Notes";
import Tournaments from "./pages/Tournaments";

function Router() {
  return (
    <Switch>
      <Route key="home" path={"/"} component={Dashboard} />
      <Route key="log" path={"/log"} component={Log} />
      <Route key="log-tournament" path={"/log-tournament"} component={LogTournament} />
      <Route key="hands" path={"/hands"} component={HandsList} />
      <Route key="hands-detail" path={"/hands/:id"} component={HandDetail} />
      <Route key="tournaments" path={"/tournaments"} component={Tournaments} />
      <Route key="tournament-detail" path={"/tournaments/:id"} component={TournamentDetail} />
      <Route key="notes" path={"/notes"} component={Notes} />
      <Route key="not-found-404" path={"/404"} component={NotFound} />
      <Route key="not-found-default" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <BottomNav />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

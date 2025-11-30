import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import LeakDetail from "@/pages/LeakDetail";
import TournamentDetail from "@/pages/TournamentDetail";
import StudyPlan from "@/pages/StudyPlan";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import LogStudySession from "./pages/LogStudySession";
import LogTournament from "./pages/LogTournament";
import HandsList from "./pages/HandsList";
import HandDetail from "./pages/HandDetail";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/log-session"} component={LogStudySession} />
      <Route path={"/log-tournament"} component={LogTournament} />
      <Route path={"/hands"} component={HandsList} />
      <Route path={"/hands/:id"} component={HandDetail} />
      <Route path={"/leaks/:id"} component={LeakDetail} />
      <Route path={"/tournaments/:id"} component={TournamentDetail} />
      <Route path={"/study-plan"} component={StudyPlan} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
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
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

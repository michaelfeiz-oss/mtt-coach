import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import LeakDetail from "@/pages/LeakDetail";
import TournamentDetail from "@/pages/TournamentDetail";
import StudyPlan from "@/pages/StudyPlan";
import GuidedSession from "@/pages/GuidedSession";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import LogStudySession from "./pages/LogStudySession";
import LogTournament from "./pages/LogTournament";
import HandsList from "./pages/HandsList";
import HandDetail from "./pages/HandDetail";
import BottomNav from "./components/BottomNav";
import Log from "./pages/Log";
import Study from "./pages/Study";
import StudyHub from "./pages/strategy/StudyHub";
import StrategyLibrary from "./pages/strategy/StrategyLibrary";
import RangeTrainer from "./pages/strategy/RangeTrainer";
import IcmPacks from "./pages/icm/IcmPacks";
import IcmPackDetail from "./pages/icm/IcmPackDetail";
import IcmSpotDetail from "./pages/icm/IcmSpotDetail";

function Router() {
  return (
    <Switch>
      <Route key="home" path={"/"} component={Dashboard} />
      <Route key="log" path={"/log"} component={Log} />
      <Route key="study" path={"/study"} component={Study} />
      <Route key="log-session" path={"/log-session"} component={LogStudySession} />
      <Route key="log-tournament" path={"/log-tournament"} component={LogTournament} />
      <Route key="hands" path={"/hands"} component={HandsList} />
      <Route key="hands-detail" path={"/hands/:id"} component={HandDetail} />
      <Route key="leak-detail" path={"/leaks/:id"} component={LeakDetail} />
      <Route key="tournament-detail" path={"/tournaments/:id"} component={TournamentDetail} />
      <Route key="study-plan" path={"/study-plan"} component={StudyPlan} />
      <Route key="guided-session" path={"/guided-session"} component={GuidedSession} />
      <Route key="icm-spot" path={"/study/icm/spot/:spotId"} component={IcmSpotDetail} />
      <Route key="icm-pack" path={"/study/icm/:packSlug"} component={IcmPackDetail} />
      <Route key="icm-packs" path={"/study/icm"} component={IcmPacks} />
      <Route key="strategy" path={"/strategy"} component={StudyHub} />
      <Route key="strategy-library" path={"/strategy/library"} component={StrategyLibrary} />
      <Route key="strategy-trainer" path={"/strategy/trainer"} component={RangeTrainer} />
      <Route key="not-found-404" path={"/404"} component={NotFound} />
      <Route key="not-found-default" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
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

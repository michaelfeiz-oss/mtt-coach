import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuditV2 from "./pages/local/AuditV2";
import ChartEditorV2 from "./pages/local/ChartEditorV2";
import ChartViewerV2 from "./pages/local/ChartViewerV2";
import ImportExportV2 from "./pages/local/ImportExportV2";
import LocalDashboard from "./pages/local/LocalDashboard";
import StrategyLibraryV2 from "./pages/local/StrategyLibraryV2";
import TrainerV2 from "./pages/local/TrainerV2";

function Router() {
  return (
    <Switch>
      <Route key="home" path="/" component={LocalDashboard} />
      <Route key="strategy-library" path="/strategy/library" component={StrategyLibraryV2} />
      <Route key="strategy-chart" path="/strategy/chart/:nodeKey" component={ChartViewerV2} />
      <Route key="strategy-editor" path="/strategy/editor/:nodeKey" component={ChartEditorV2} />
      <Route key="strategy-trainer" path="/strategy/trainer" component={TrainerV2} />
      <Route key="admin-import-export" path="/admin/import-export" component={ImportExportV2} />
      <Route key="admin-audit" path="/admin/audit" component={AuditV2} />
      <Route key="not-found-404" path="/404" component={NotFound} />
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
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

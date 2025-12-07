import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, CheckCircle2, Circle } from "lucide-react";
interface DrillTemplateConfig {
  name: string;
  tool: string;
  duration: string;
  steps: string[];
  deliverable: string;
}

interface DrillCardProps {
  day: string;
  title: string;
  tool: string;
  template: DrillTemplateConfig;
  completed?: boolean;
  onStartSession?: () => void;
  onAddRules?: () => void;
}

export function DrillCard({
  day,
  title,
  tool,
  template,
  completed = false,
  onStartSession,
  onAddRules,
}: DrillCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={`border-l-4 ${completed ? "border-l-green-500 bg-green-50/50" : "border-l-primary"}`}>
      <CardHeader
        className="pb-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <CardTitle className="text-base">{day} — {title}</CardTitle>
                <CardDescription className="text-xs mt-1">{tool}</CardDescription>
              </div>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Template Info */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Template: {template.name}</p>
            <p className="text-xs text-muted-foreground">Duration: {template.duration}</p>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Steps:</p>
            <ol className="space-y-1">
              {template.steps.map((step: string, idx: number) => (
                <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                  <span className="font-medium">{idx + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Deliverable */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs font-semibold text-muted-foreground mb-1">DELIVERABLE</p>
            <p className="text-sm font-medium">{template.deliverable}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={onStartSession}
            >
              Start Session
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={onAddRules}
            >
              Add Rules
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

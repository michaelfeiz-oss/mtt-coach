import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

interface SessionTimerProps {
  onDurationChange: (minutes: number) => void;
  initialMinutes?: number;
}

export function SessionTimer({ onDurationChange, initialMinutes = 0 }: SessionTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const newSeconds = prev + 1;
        const newMinutes = Math.floor(newSeconds / 60);
        onDurationChange(newMinutes);
        return newSeconds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onDurationChange]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleReset = () => {
    setElapsedSeconds(0);
    setIsRunning(false);
    onDurationChange(0);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-slate-600 mb-1">Session Timer</p>
          <p className="text-3xl font-mono font-bold text-blue-900">
            {formatTime(elapsedSeconds)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {Math.floor(elapsedSeconds / 60)} minutes
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            size="lg"
            variant={isRunning ? "secondary" : "default"}
            onClick={toggleTimer}
            className="h-12 w-12 p-0"
          >
            {isRunning ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>

          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={handleReset}
            className="h-12 w-12 p-0"
            disabled={elapsedSeconds === 0}
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {isRunning && (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <p className="text-xs text-green-700 font-medium">Timer running...</p>
        </div>
      )}
    </Card>
  );
}

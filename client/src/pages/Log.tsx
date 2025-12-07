import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import { LogHandModal } from "@/components/LogHandModal";
import { LogTournamentModal } from "@/components/LogTournamentModal";
import { AddLeakModal } from "@/components/AddLeakModal";
import { AddNoteModal } from "@/components/AddNoteModal";
import { Card } from "@/components/ui/card";
import { Zap, Trophy, AlertCircle, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Log() {
  const [showLogHandModal, setShowLogHandModal] = useState(false);
  const [showLogTournamentModal, setShowLogTournamentModal] = useState(false);
  const [showAddLeakModal, setShowAddLeakModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);

  const { mutate: createHand, isPending: isCreatingHand } =
    trpc.hands.create.useMutation({
      onSuccess: () => {
        setShowLogHandModal(false);
      },
    });

  const { mutate: createTournament, isPending: isCreatingTournament } =
    trpc.tournaments.create.useMutation({
      onSuccess: () => {
        setShowLogTournamentModal(false);
      },
    });

  const { mutate: createLeak, isPending: isCreatingLeak } =
    trpc.leaks.create.useMutation({
      onSuccess: () => {
        setShowAddLeakModal(false);
      },
    });

  const handleLogHand = (data: any) => {
    createHand({
      heroPosition: data.position,
      effectiveStackBb: parseInt(data.stackSize),
      boardRunout: data.board || "",
    });
  };

  const handleLogTournament = (data: any) => {
    createTournament({
      date: new Date(),
      buyIn: parseFloat(data.buyIn),
      reEntries: parseInt(data.reEntries) || 0,
      startingStack: parseInt(data.startingStack) || 0,
      finalPosition: data.finalPosition,
      prize: parseFloat(data.prize) || 0,
      venue: data.venue || "",
      notesOverall: data.notes || "",
    });
  };

  const handleAddLeak = (data: any) => {
    createLeak({
      name: data.leakType,
      category: (data.leakType || "PREFLOP").toUpperCase() as any,
      description: data.notes || "",
      status: "ACTIVE",
    });
  };

  const handleAddNote = (data: any) => {
    console.log("Note saved:", data);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200 px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Log</h1>
        <p className="text-sm text-gray-600">Quick entry for hands, tournaments, leaks, and notes</p>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto">
        {/* Log Hand */}
        <Card
          className="p-4 border-l-4 border-l-orange-600 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowLogHandModal(true)}
        >
          <div className="flex items-start gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Log Hand</h3>
              <p className="text-sm text-gray-600">Record a hand you played</p>
            </div>
          </div>
        </Card>

        {/* Log Tournament */}
        <Card
          className="p-4 border-l-4 border-l-orange-600 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowLogTournamentModal(true)}
        >
          <div className="flex items-start gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Trophy className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Log Tournament</h3>
              <p className="text-sm text-gray-600">Record tournament results</p>
            </div>
          </div>
        </Card>

        {/* Add Leak */}
        <Card
          className="p-4 border-l-4 border-l-orange-600 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowAddLeakModal(true)}
        >
          <div className="flex items-start gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Add Leak</h3>
              <p className="text-sm text-gray-600">Identify a weakness in your game</p>
            </div>
          </div>
        </Card>

        {/* Add Note */}
        <Card
          className="p-4 border-l-4 border-l-orange-600 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowAddNoteModal(true)}
        >
          <div className="flex items-start gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Add Note</h3>
              <p className="text-sm text-gray-600">Save observations or strategy ideas</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <LogHandModal
        isOpen={showLogHandModal}
        onClose={() => setShowLogHandModal(false)}
        onSubmit={handleLogHand}
        isLoading={isCreatingHand}
      />

      <LogTournamentModal
        isOpen={showLogTournamentModal}
        onClose={() => setShowLogTournamentModal(false)}
        onSubmit={handleLogTournament}
        isLoading={isCreatingTournament}
      />

      <AddLeakModal
        isOpen={showAddLeakModal}
        onClose={() => setShowAddLeakModal(false)}
        onSubmit={handleAddLeak}
        isLoading={isCreatingLeak}
      />

      <AddNoteModal
        isOpen={showAddNoteModal}
        onClose={() => setShowAddNoteModal(false)}
        onSubmit={handleAddNote}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

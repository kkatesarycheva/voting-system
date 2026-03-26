import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useElection } from "@/lib/electionContext";
import CandidateCard from "@/components/CandidateCard";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Vote, AlertTriangle, CheckCircle, Search, Ban } from "lucide-react";

const VotePage = () => {
  const { isLoggedIn, hasVoted, votingOpen, votes, setVotes, submitVote, candidates } = useElection();
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchPrefect, setSearchPrefect] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    } else if (hasVoted) {
      navigate("/confirmation");
    }
  }, [isLoggedIn, hasVoted, navigate]);

  const filterCandidates = (search: string) =>
    candidates.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const togglePrefect = (id: string) => {
    const current = votes.prefects;
    if (current.includes(id)) {
      setVotes({ ...votes, prefects: current.filter((p) => p !== id) });
    } else if (current.length < 10) {
      setVotes({ ...votes, prefects: [...current, id] });
    }
  };

  const canSubmit = votes.prefects.length > 0;

  const selectedPrefects = candidates.filter((c) => votes.prefects.includes(c.id));

  const handleConfirmSubmit = () => {
    submitVote();
    setShowConfirm(false);
    navigate("/confirmation");
  };

  if (!isLoggedIn || hasVoted) {
    return null;
  }

  if (!votingOpen) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Ban className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Voting is Closed</h1>
            <p className="text-muted-foreground">The voting period has ended or has not started yet. Please check back later.</p>
          </div>
        </div>
      </div>
    );
  }

  const SearchInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
    <div className="relative mb-3">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input className="pl-9" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Cast Your Vote</h1>
          <p className="text-muted-foreground">Select your candidates below. You may choose up to 10 prefects.</p>
        </div>

        {/* Prefects */}
        <section className="mb-10">
          <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-primary-foreground">⭐</span>
            Prefects <span className="text-sm font-body font-normal text-muted-foreground">(select up to 10) — {votes.prefects.length}/10 selected</span>
          </h2>
          <SearchInput value={searchPrefect} onChange={setSearchPrefect} placeholder="Search candidates..." />
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filterCandidates(searchPrefect).map((c) => (
              <CandidateCard key={c.id} candidate={c} selected={votes.prefects.includes(c.id)} onSelect={() => togglePrefect(c.id)} selectable />
            ))}
          </div>
        </section>

        {/* Submit */}
        <div className="sticky bottom-4 bg-card border border-border rounded-xl p-4 shadow-elevated flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {!canSubmit && (
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-accent" />
                Select at least one prefect
              </span>
            )}
            {canSubmit && (
              <span className="flex items-center gap-1.5 text-success">
                <CheckCircle className="w-4 h-4" />
                Ready to submit
              </span>
            )}
          </div>
          <Button
            disabled={!canSubmit}
            onClick={() => setShowConfirm(true)}
            className="bg-gradient-gold text-secondary-foreground font-semibold hover:opacity-90 shadow-gold"
          >
            <Vote className="w-4 h-4 mr-2" />
            Review & Submit
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Confirm Your Vote</DialogTitle>
            <DialogDescription>Please review your selections. Votes cannot be changed after submission.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Prefects</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                {selectedPrefects.map((p) => <li key={p.id}>{p.name}</li>)}
              </ul>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Go Back</Button>
            <Button onClick={handleConfirmSubmit} className="bg-gradient-navy text-primary-foreground font-semibold hover:opacity-90">
              Submit Vote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VotePage;
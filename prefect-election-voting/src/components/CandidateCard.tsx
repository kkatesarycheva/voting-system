import { Candidate } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

interface CandidateCardProps {
  candidate: Candidate;
  selected?: boolean;
  onSelect?: () => void;
  selectable?: boolean;
}

const CandidateCard = ({ candidate, selected, onSelect, selectable }: CandidateCardProps) => {
  return (
    <button
      type="button"
      onClick={selectable ? onSelect : undefined}
      disabled={!selectable}
      className={`group w-full text-left rounded-lg border-2 p-4 transition-all duration-200 ${
        selected
          ? "border-accent bg-gold-light/30 shadow-gold"
          : selectable
          ? "border-border bg-card hover:border-accent/50 hover:shadow-elevated cursor-pointer"
          : "border-border bg-card"
      } ${!selectable ? "cursor-default" : ""}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors overflow-hidden ${
          selected ? "bg-gradient-gold" : "bg-muted"
        }`}>
          {candidate.photo ? (
            <img src={candidate.photo} alt={candidate.name} className="w-full h-full object-cover" />
          ) : (
            <User className={`w-5 h-5 ${selected ? "text-secondary-foreground" : "text-muted-foreground"}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-card-foreground truncate">{candidate.name}</h3>
            {selected && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-gold flex items-center justify-center text-xs font-bold text-secondary-foreground">✓</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};


export default CandidateCard;

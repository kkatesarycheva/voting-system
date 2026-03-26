import { useState } from "react";
import { useElection } from "@/lib/electionContext";
import CandidateCard from "@/components/CandidateCard";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";

const Candidates = () => {
  const { candidates } = useElection();
  const [search, setSearch] = useState("");

  const filtered = candidates.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Meet the Candidates</h1>
          <p className="text-muted-foreground max-w-md mx-auto">Get to know the students standing for election before you cast your vote.</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search candidates..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          {filtered.length} candidate{filtered.length !== 1 ? "s" : ""}
        </p>

        <div className="space-y-2">
          {filtered.map((c) => (
            <CandidateCard key={c.id} candidate={c} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Candidates;

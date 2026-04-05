import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useElection } from "@/lib/electionContext";
import { Candidate, Teacher } from "@/lib/mockData";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { BarChart, Users, Vote, Settings, Download, Power, PlusCircle, Trophy, Star, Trash2, Pencil, Image, AlertTriangle, KeyRound } from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { isLoggedIn, isAdmin, votingOpen, toggleVoting, candidates, results, allVotes, teachers, addCandidate, removeCandidate, removeAllCandidates, updateCandidate, addTeacher, removeTeacher, setTeacherPassword } = useElection();
  const navigate = useNavigate();
  const [newCandidate, setNewCandidate] = useState({ name: "", id: "", year: "" });
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  
  // Edit candidate state
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [editForm, setEditForm] = useState({ id: "", name: "", year: "" });
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [teacherForPassword, setTeacherForPassword] = useState<Teacher | null>(null);
  const [teacherPasswordForm, setTeacherPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      navigate("/login");
    }
  }, [isLoggedIn, isAdmin, navigate]);

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  const totalVoters = teachers.filter((t) => t.email !== "admin@school.com" && t.email !== "it@school.com").length;
  const votedCount = allVotes.length;

  const handleAddCandidate = async () => {
    if (!newCandidate.name.trim() || !newCandidate.id.trim()) {
      toast.error("Please enter a name and ID.");
      return;
    }
    if (candidates.some((c) => c.id === newCandidate.id)) {
      toast.error("A candidate with this ID already exists.");
      return;
    }
    const success = await addCandidate({ id: newCandidate.id, name: newCandidate.name, photo: "", year: newCandidate.year });
    if (!success) {
      toast.error("Failed to add candidate.");
      return;
    }
    setNewCandidate({ name: "", id: "", year: "" });
    toast.success("Candidate added successfully.");
  };

  const handleAddTeacher = async () => {
    if (!newTeacherEmail.trim() || !newTeacherEmail.includes("@")) {
      toast.error("Please enter a valid email.");
      return;
    }
    if (teachers.some((t) => t.email === newTeacherEmail)) {
      toast.error("This teacher already exists.");
      return;
    }
    const success = await addTeacher(newTeacherEmail);
    if (!success) {
      toast.error("Failed to add teacher.");
      return;
    }
    setNewTeacherEmail("");
    toast.success("Teacher added successfully.");
  };

  const handleEditCandidate = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setEditForm({ id: candidate.id, name: candidate.name, year: candidate.year || "" });
  };

  const handleSaveEdit = async () => {
    if (!editingCandidate) return;
    if (!editForm.name.trim() || !editForm.id.trim()) {
      toast.error("Name and ID are required.");
      return;
    }
    // Check if new ID conflicts with another candidate
    if (editForm.id !== editingCandidate.id && candidates.some((c) => c.id === editForm.id)) {
      toast.error("A candidate with this ID already exists.");
      return;
    }
    const success = await updateCandidate(editingCandidate.id, { id: editForm.id, name: editForm.name, year: editForm.year });
    if (!success) {
      toast.error("Candidate editing is not supported by backend API yet.");
      return;
    }
    setEditingCandidate(null);
    toast.success("Candidate updated successfully.");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingCandidate || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      updateCandidate(editingCandidate.id, { photo: reader.result as string }).then((success) => {
        if (!success) {
          toast.error("Photo updates are not supported by backend API yet.");
          return;
        }
        setEditingCandidate({ ...editingCandidate, photo: reader.result as string });
        toast.success("Photo updated.");
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAll = async () => {
    const success = await removeAllCandidates();
    if (!success) {
      toast.error("Failed to delete all candidates.");
      return;
    }
    setShowDeleteAllDialog(false);
    toast.success("All candidates deleted.");
  };

  const exportCSV = () => {
    const rows = [["Position", "Name", "Votes"]];
    results.prefects.forEach((r) => rows.push(["Prefect", r.name, String(r.votes)]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "election_results.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const ResultSection = ({ title, icon: Icon, resultData }: { title: string; icon: React.ElementType; resultData: { name: string; votes: number }[] }) => {
    const maxVotes = Math.max(...resultData.map((r) => r.votes), 1);
    return (
      <div className="bg-card border border-border rounded-xl p-6 shadow-card">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2 mb-4">
          <Icon className="w-5 h-5 text-accent" />
          {title}
        </h3>
        {resultData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No votes yet.</p>
        ) : (
          <div className="space-y-3">
            {resultData.map((r, i) => (
              <div key={r.name} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? "bg-gradient-gold text-secondary-foreground" : "bg-muted text-muted-foreground"
                }`}>{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-foreground">{r.name}</span>
                    <span className="text-sm font-bold text-foreground">{r.votes}</span>
                  </div>
                  <Progress value={(r.votes / maxVotes) * 100} className="h-2" />
                </div>
                {i === 0 && <Trophy className="w-4 h-4 text-accent" />}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage the election process</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={votingOpen ? "default" : "secondary"} className={votingOpen ? "bg-success text-success-foreground" : ""}>
              {votingOpen ? "Voting Open" : "Voting Closed"}
            </Badge>
            <Button variant="outline" onClick={async () => {
              const success = await toggleVoting();
              if (!success) toast.error("Failed to update voting status.");
            }} className="gap-2">
              <Power className="w-4 h-4" />
              {votingOpen ? "Close Voting" : "Open Voting"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Teachers", value: totalVoters, icon: Users },
            { label: "Votes Cast", value: votedCount, icon: Vote },
            { label: "Turnout", value: totalVoters > 0 ? `${Math.round((votedCount / totalVoters) * 100)}%` : "0%", icon: BarChart },
            { label: "Candidates", value: candidates.length, icon: Star },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 shadow-card">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="results" className="space-y-6">
          <TabsList>
            <TabsTrigger value="results" className="gap-1.5"><BarChart className="w-4 h-4" />Results</TabsTrigger>
            <TabsTrigger value="candidates" className="gap-1.5"><Users className="w-4 h-4" />Candidates</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5"><Settings className="w-4 h-4" />Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" onClick={exportCSV} className="gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
            <ResultSection title="Prefects" icon={Star} resultData={results.prefects} />
          </TabsContent>

          <TabsContent value="candidates">
            <div className="bg-card border border-border rounded-xl p-6 shadow-card">
              <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-accent" />
                Add New Candidate
              </h3>
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label className="text-card-foreground">Student ID</Label>
                  <Input className="mt-1" placeholder="e.g. 4291" value={newCandidate.id} onChange={(e) => setNewCandidate({ ...newCandidate, id: e.target.value })} />
                </div>
                <div>
                  <Label className="text-card-foreground">Full Name</Label>
                  <Input className="mt-1" placeholder="Student name" value={newCandidate.name} onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-card-foreground">Year Group</Label>
                  <Input className="mt-1" placeholder="e.g. Year 13" value={newCandidate.year} onChange={(e) => setNewCandidate({ ...newCandidate, year: e.target.value })} />
                </div>
              </div>
              <Button onClick={handleAddCandidate} className="bg-gradient-navy text-primary-foreground font-semibold hover:opacity-90 gap-2">
                <PlusCircle className="w-4 h-4" />
                Add Candidate
              </Button>
            </div>

            <div className="mt-6 bg-card border border-border rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-foreground">Current Candidates ({candidates.length})</h3>
                {candidates.length > 0 && (
                  <Button variant="destructive" size="sm" onClick={() => setShowDeleteAllDialog(true)} className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete All
                  </Button>
                )}
              </div>
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {candidates.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {c.photo ? (
                          <img src={c.photo} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">
                            {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {c.id}{c.year && ` • ${c.year}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => handleEditCandidate(c)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={async () => {
                        const success = await removeCandidate(c.id);
                        if (!success) {
                          toast.error("Failed to remove candidate.");
                          return;
                        }
                        toast.success("Candidate removed.");
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {candidates.length === 0 && (
                  <p className="py-6 text-center text-muted-foreground text-sm">No candidates yet.</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-6">
              <div>
                <h3 className="font-display font-semibold text-foreground mb-2">Voting Controls</h3>
                <p className="text-sm text-muted-foreground mb-3">Enable or disable voting for all teachers.</p>
                <Button variant={votingOpen ? "destructive" : "default"} onClick={async () => {
                  const success = await toggleVoting();
                  if (!success) toast.error("Failed to update voting status.");
                }} className="gap-2">
                  <Power className="w-4 h-4" />
                  {votingOpen ? "Close Voting" : "Open Voting"}
                </Button>
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground mb-2">Add Teacher Account</h3>
                <p className="text-sm text-muted-foreground mb-3">Create login credentials for a new teacher. Default password is "teacher123".</p>
                <div className="flex gap-3">
                  <Input placeholder="Teacher email" className="max-w-xs" value={newTeacherEmail} onChange={(e) => setNewTeacherEmail(e.target.value)} />
                  <Button onClick={handleAddTeacher} className="bg-gradient-navy text-primary-foreground font-semibold hover:opacity-90">Add Teacher</Button>
                </div>
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground mb-2">Teacher Accounts</h3>
                <div className="divide-y divide-border">
                  {teachers.filter((t) => t.email !== "admin@school.com" && t.email !== "it@school.com").map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={t.hasVoted ? "text-success border-success/30" : "text-muted-foreground"}>
                          {t.hasVoted ? "Voted" : "Not voted"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          title="Set password"
                          onClick={() => {
                            setTeacherForPassword(t);
                            setTeacherPasswordForm({ newPassword: "", confirmPassword: "" });
                          }}
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={async () => {
                          const success = await removeTeacher(t.id);
                          if (!success) {
                            toast.error("Failed to remove teacher.");
                            return;
                          }
                          toast.success("Teacher removed.");
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Candidate Dialog */}
      <Dialog open={!!editingCandidate} onOpenChange={(open) => !open && setEditingCandidate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit Candidate</DialogTitle>
            <DialogDescription>Update candidate information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex justify-center">
              <div 
                className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => photoInputRef.current?.click()}
              >
                {editingCandidate?.photo ? (
                  <img src={editingCandidate.photo} alt="Candidate" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Image className="w-8 h-8 text-muted-foreground mx-auto" />
                    <span className="text-xs text-muted-foreground">Add Photo</span>
                  </div>
                )}
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <div>
              <Label>Student ID</Label>
              <Input className="mt-1" value={editForm.id} onChange={(e) => setEditForm({ ...editForm, id: e.target.value })} />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input className="mt-1" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Year Group</Label>
              <Input className="mt-1" value={editForm.year} onChange={(e) => setEditForm({ ...editForm, year: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingCandidate(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} className="bg-gradient-navy text-primary-foreground font-semibold hover:opacity-90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set teacher password */}
      <Dialog
        open={!!teacherForPassword}
        onOpenChange={(open) => {
          if (!open) {
            setTeacherForPassword(null);
            setTeacherPasswordForm({ newPassword: "", confirmPassword: "" });
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Set teacher password</DialogTitle>
            <DialogDescription>
              {teacherForPassword ? (
                <>Set a new login password for {teacherForPassword.name} ({teacherForPassword.email}).</>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>New password</Label>
              <Input
                type="password"
                className="mt-1"
                autoComplete="new-password"
                value={teacherPasswordForm.newPassword}
                onChange={(e) => setTeacherPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
              />
            </div>
            <div>
              <Label>Confirm password</Label>
              <Input
                type="password"
                className="mt-1"
                autoComplete="new-password"
                value={teacherPasswordForm.confirmPassword}
                onChange={(e) => setTeacherPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTeacherForPassword(null)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-navy text-primary-foreground font-semibold hover:opacity-90"
              onClick={async () => {
                if (!teacherForPassword) return;
                const { newPassword, confirmPassword } = teacherPasswordForm;
                if (!newPassword.trim()) {
                  toast.error("Please enter a new password.");
                  return;
                }
                if (newPassword.length < 6) {
                  toast.error("Password must be at least 6 characters.");
                  return;
                }
                if (newPassword !== confirmPassword) {
                  toast.error("Passwords do not match.");
                  return;
                }
                const success = await setTeacherPassword(teacherForPassword.id, newPassword);
                if (!success) {
                  toast.error("Failed to update password.");
                  return;
                }
                toast.success("Password updated.");
                setTeacherForPassword(null);
                setTeacherPasswordForm({ newPassword: "", confirmPassword: "" });
              }}
            >
              Save password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete All Candidates
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all {candidates.length} candidates and reset all votes. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteAllDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAll}>
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

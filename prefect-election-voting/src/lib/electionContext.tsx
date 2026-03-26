import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from "react";
import { Candidate, VoteSelection, Teacher } from "./mockData";
import { saveCandidates, loadCandidates, saveVotes, loadVotes, saveTeachers, loadTeachers, saveSetting, loadSetting } from "./storage";

interface StoredVote {
  teacherEmail: string;
  selections: VoteSelection;
}

interface ElectionContextType {
  // Auth
  isLoggedIn: boolean;
  isAdmin: boolean;
  isITAdmin: boolean;
  teacherName: string;
  currentEmail: string;
  hasVoted: boolean;
  votingOpen: boolean;

  // Votes
  votes: VoteSelection;
  allVotes: StoredVote[];

  // Candidates
  candidates: Candidate[];

  // Teachers
  teachers: Teacher[];

  // Computed results
  results: {
    prefects: { name: string; votes: number }[];
  };

  // Loading state
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setVotes: (votes: VoteSelection) => void;
  submitVote: () => void;
  toggleVoting: () => void;
  addCandidate: (candidate: Candidate) => void;
  removeCandidate: (id: string) => void;
  removeAllCandidates: () => void;
  updateCandidate: (id: string, updates: Partial<Candidate>) => void;
  updateCandidatePhoto: (id: string, photo: string) => void;
  addTeacher: (email: string) => void;
  removeTeacher: (id: string) => void;
  changePassword: (oldPassword: string, newPassword: string) => boolean;
}

const ElectionContext = createContext<ElectionContextType | null>(null);

export const useElection = () => {
  const ctx = useContext(ElectionContext);
  if (!ctx) throw new Error("useElection must be used within ElectionProvider");
  return ctx;
};

const defaultTeachers: Teacher[] = [
  { id: "t1", name: "Admin", email: "admin@school.com", hasVoted: false },
  { id: "t2", name: "IT Administrator", email: "it@school.com", hasVoted: false },
];

export const ElectionProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isITAdmin, setIsITAdmin] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [votingOpen, setVotingOpen] = useState(true);
  const [votes, setVotes] = useState<VoteSelection>({ prefects: [] });
  const [allVotes, setAllVotes] = useState<StoredVote[]>([]);
  const [candidateList, setCandidateList] = useState<Candidate[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>(defaultTeachers);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedCandidates, storedVotes, storedTeachers, storedVotingOpen] = await Promise.all([
          loadCandidates(),
          loadVotes(),
          loadTeachers(),
          loadSetting("votingOpen", true),
        ]);

        if (storedCandidates.length > 0) {
          setCandidateList(storedCandidates);
        }
        if (storedVotes.length > 0) {
          setAllVotes(storedVotes);
        }
        if (storedTeachers.length > 0) {
          setTeachers(storedTeachers);
        }
        setVotingOpen(storedVotingOpen);
      } catch (error) {
        console.error("Error loading data from IndexedDB:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save candidates to IndexedDB whenever they change
  useEffect(() => {
    if (!isLoading && candidateList.length >= 0) {
      saveCandidates(candidateList).catch(console.error);
    }
  }, [candidateList, isLoading]);

  // Save votes to IndexedDB whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveVotes(allVotes).catch(console.error);
    }
  }, [allVotes, isLoading]);

  // Save teachers to IndexedDB whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveTeachers(teachers).catch(console.error);
    }
  }, [teachers, isLoading]);

  // Save votingOpen status to IndexedDB
  useEffect(() => {
    if (!isLoading) {
      saveSetting("votingOpen", votingOpen).catch(console.error);
    }
  }, [votingOpen, isLoading]);

  const hasVoted = allVotes.some((v) => v.teacherEmail === currentEmail);

  const results = useMemo(() => {
    const prCount: Record<string, number> = {};

    allVotes.forEach((v) => {
      v.selections.prefects.forEach((p) => { prCount[p] = (prCount[p] || 0) + 1; });
    });

    const toSorted = (counts: Record<string, number>) =>
      Object.entries(counts)
        .map(([id, voteCount]) => ({
          name: candidateList.find((c) => c.id === id)?.name || id,
          votes: voteCount,
        }))
        .sort((a, b) => b.votes - a.votes);

    return {
      prefects: toSorted(prCount),
    };
  }, [allVotes, candidateList]);

  const login = (email: string, password: string) => {
    if (email === "admin@school.com" && password === "admin123") {
      setIsLoggedIn(true); setIsAdmin(true); setIsITAdmin(false);
      setTeacherName("Admin"); setCurrentEmail(email);
      return true;
    }
    if (email === "it@school.com" && password === "it123") {
      setIsLoggedIn(true); setIsAdmin(false); setIsITAdmin(true);
      setTeacherName("IT Administrator"); setCurrentEmail(email);
      return true;
    }
    // Check if teacher exists
    const teacher = teachers.find((t) => t.email === email);
    if (teacher) {
      // Check password - use custom password if set, otherwise default "teacher123"
      const correctPassword = teacher.password || "teacher123";
      if (password === correctPassword) {
        setIsLoggedIn(true); setIsAdmin(false); setIsITAdmin(false);
        setTeacherName(teacher.name); setCurrentEmail(email);
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false); setIsAdmin(false); setIsITAdmin(false);
    setTeacherName(""); setCurrentEmail("");
    setVotes({ prefects: [] });
  };

  const changePassword = (oldPassword: string, newPassword: string): boolean => {
    const teacher = teachers.find((t) => t.email === currentEmail);
    if (!teacher) return false;
    
    // Verify old password
    const currentPassword = teacher.password || "teacher123";
    if (oldPassword !== currentPassword) return false;
    
    // Update password
    setTeachers((prev) => prev.map((t) => 
      t.email === currentEmail ? { ...t, password: newPassword } : t
    ));
    return true;
  };

  const submitVote = () => {
    const newVotes = [...allVotes, { teacherEmail: currentEmail, selections: { ...votes } }];
    setAllVotes(newVotes);
    // Mark teacher as voted
    setTeachers((prev) => prev.map((t) => t.email === currentEmail ? { ...t, hasVoted: true } : t));
  };

  const toggleVoting = () => setVotingOpen((prev) => !prev);

  const addCandidate = (candidate: Candidate) => {
    setCandidateList((prev) => {
      // Prevent duplicates
      if (prev.some(c => c.id === candidate.id)) {
        return prev;
      }
      return [...prev, candidate];
    });
  };

  const removeCandidate = (id: string) => {
    setCandidateList((prev) => prev.filter((c) => c.id !== id));
    // Also remove votes for this candidate
    setAllVotes((prev) => prev.map((vote) => ({
      ...vote,
      selections: {
        ...vote.selections,
        prefects: vote.selections.prefects.filter((p) => p !== id),
      },
    })));
  };

  const removeAllCandidates = () => {
    setCandidateList([]);
    // Clear all votes since there are no candidates
    setAllVotes([]);
    // Reset teacher voting status
    setTeachers((prev) => prev.map((t) => ({ ...t, hasVoted: false })));
  };

  const updateCandidate = (id: string, updates: Partial<Candidate>) => {
    setCandidateList((prev) => prev.map((c) => {
      if (c.id === id) {
        // If ID is being changed, update votes too
        if (updates.id && updates.id !== id) {
          setAllVotes((prevVotes) => prevVotes.map((vote) => ({
            ...vote,
            selections: {
              ...vote.selections,
              prefects: vote.selections.prefects.map((p) => p === id ? updates.id! : p),
            },
          })));
        }
        return { ...c, ...updates };
      }
      return c;
    }));
  };

  const updateCandidatePhoto = (id: string, photo: string) => {
    setCandidateList((prev) => prev.map((c) => c.id === id ? { ...c, photo } : c));
  };

  const addTeacher = (email: string) => {
    const name = email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    setTeachers((prev) => {
      // Prevent duplicates
      if (prev.some(t => t.email === email)) {
        return prev;
      }
      return [...prev, { id: `t${Date.now()}`, name, email, hasVoted: false }];
    });
  };

  const removeTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ElectionContext.Provider value={{
      isLoggedIn, isAdmin, isITAdmin, teacherName, currentEmail, hasVoted, votingOpen,
      votes, allVotes, candidates: candidateList, teachers, results, isLoading,
      login, logout, setVotes, submitVote, toggleVoting,
      addCandidate, removeCandidate, removeAllCandidates, updateCandidate, updateCandidatePhoto, addTeacher, removeTeacher, changePassword,
    }}>
      {children}
    </ElectionContext.Provider>
  );
};

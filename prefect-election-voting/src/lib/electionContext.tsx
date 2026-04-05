import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode, useCallback } from "react";
import { Candidate, VoteSelection, Teacher } from "./mockData";
import { request, ApiError } from "./api";

interface StoredVote {
  teacherEmail: string;
  selections: VoteSelection;
}

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "it_admin" | "teacher";
  has_voted: boolean;
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
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setVotes: (votes: VoteSelection) => void;
  submitVote: () => Promise<boolean>;
  toggleVoting: () => Promise<boolean>;
  addCandidate: (candidate: Candidate) => Promise<boolean>;
  removeCandidate: (id: string) => Promise<boolean>;
  removeAllCandidates: () => Promise<boolean>;
  updateCandidate: (id: string, updates: Partial<Candidate>) => Promise<boolean>;
  updateCandidatePhoto: (id: string, photo: string) => Promise<boolean>;
  addTeacher: (email: string) => Promise<boolean>;
  removeTeacher: (id: string) => Promise<boolean>;
  setTeacherPassword: (id: string, newPassword: string) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const ElectionContext = createContext<ElectionContextType | null>(null);

export const useElection = () => {
  const ctx = useContext(ElectionContext);
  if (!ctx) throw new Error("useElection must be used within ElectionProvider");
  return ctx;
};

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

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
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [serverPrefectResults, setServerPrefectResults] = useState<{ name: string; votes: number }[]>([]);

  const hydrateFromBackend = useCallback(async (token: string, user: AuthUser) => {
    const candidatesResp = await request<any[]>("/api/candidates", { token });
    const normalizedCandidates: Candidate[] = candidatesResp.map((c) => ({
      id: String(c.id),
      name: c.name || "",
      photo: c.photo || "",
      year: c.year || "",
    }));
    setCandidateList(normalizedCandidates);

    if (user.role === "admin" || user.role === "it_admin") {
      const teachersResp = await request<any[]>("/api/teachers", { token });
      const normalizedTeachers: Teacher[] = teachersResp.map((t) => ({
        id: String(t.id),
        name: t.name || "",
        email: t.email || "",
        hasVoted: !!t.has_voted,
      }));
      setTeachers(normalizedTeachers);
    } else {
      setTeachers([]);
    }

    if (user.role === "admin") {
      const resultsResp = await request<any>("/api/results", { token });
      setServerPrefectResults(Array.isArray(resultsResp?.prefects) ? resultsResp.prefects : []);
      const turnout = resultsResp?.turnout;
      if (turnout && typeof turnout.total === "number" && typeof turnout.voted === "number") {
        const generated: StoredVote[] = Array.from({ length: turnout.voted }, (_, idx) => ({
          teacherEmail: `teacher-${idx + 1}@generated.local`,
          selections: { prefects: [] },
        }));
        setAllVotes(generated);
      } else {
        setAllVotes([]);
      }
      setVotingOpen(true);
    } else {
      setAllVotes([]);
      setServerPrefectResults([]);
      setVotingOpen(!user.has_voted);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const userRaw = localStorage.getItem(AUTH_USER_KEY);

      if (!token || !userRaw) {
        setIsLoading(false);
        return;
      }

      try {
        const user = JSON.parse(userRaw) as AuthUser;
        setAuthToken(token);
        setAuthUser(user);
        setIsLoggedIn(true);
        setIsAdmin(user.role === "admin");
        setIsITAdmin(user.role === "it_admin");
        setTeacherName(user.name);
        setCurrentEmail(user.email);
        await hydrateFromBackend(token, user);
      } catch (error) {
        console.error("Failed to restore session:", error);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, [hydrateFromBackend]);

  const hasVoted = authUser?.has_voted || false;

  const refreshData = useCallback(async () => {
    if (!authToken || !authUser) return;
    await hydrateFromBackend(authToken, authUser);
  }, [authToken, authUser, hydrateFromBackend]);

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

    if (isAdmin && serverPrefectResults.length > 0) {
      return { prefects: serverPrefectResults };
    }
    return {
      prefects: toSorted(prCount),
    };
  }, [allVotes, candidateList, isAdmin, serverPrefectResults]);

  const login = async (email: string, password: string) => {
    try {
      const data = await request<{ token: string; user: AuthUser }>("/api/login", {
        method: "POST",
        body: { email, password },
      });

      setAuthToken(data.token);
      setAuthUser(data.user);
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

      setIsLoggedIn(true);
      setIsAdmin(data.user.role === "admin");
      setIsITAdmin(data.user.role === "it_admin");
      setTeacherName(data.user.name);
      setCurrentEmail(data.user.email);
      await hydrateFromBackend(data.token, data.user);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    setIsLoggedIn(false); setIsAdmin(false); setIsITAdmin(false);
    setTeacherName(""); setCurrentEmail("");
    setAuthToken(null);
    setAuthUser(null);
    setVotes({ prefects: [] });
    setCandidateList([]);
    setTeachers([]);
    setAllVotes([]);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  const changePassword = async (_oldPassword: string, _newPassword: string): Promise<boolean> => {
    // Backend currently has no password-change endpoint.
    return false;
  };

  const submitVote = async () => {
    if (!authToken || !authUser) return false;
    try {
      await request("/api/vote", {
        method: "POST",
        token: authToken,
        body: { prefects: votes.prefects },
      });

      const nextUser = { ...authUser, has_voted: true };
      setAuthUser(nextUser);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
      setAllVotes((prev) => [...prev, { teacherEmail: currentEmail, selections: { ...votes } }]);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.message.toLowerCase().includes("closed")) {
        setVotingOpen(false);
      }
      return false;
    }
  };

  const toggleVoting = async () => {
    if (!authToken) return false;
    try {
      const data = await request<{ status: "open" | "closed" }>("/api/election/toggle", {
        method: "POST",
        token: authToken,
      });
      setVotingOpen(data.status === "open");
      return true;
    } catch {
      return false;
    }
  };

  const addCandidate = async (candidate: Candidate) => {
    if (!authToken) return false;
    try {
      await request("/api/candidates", {
        method: "POST",
        token: authToken,
        body: {
          id: candidate.id?.trim() || undefined,
          name: candidate.name,
          photo: candidate.photo || "",
          year: candidate.year || "",
        },
      });
      if (authUser) {
        await hydrateFromBackend(authToken, authUser);
      }
      return true;
    } catch {
      return false;
    }
  };

  const removeCandidate = async (id: string) => {
    if (!authToken) return false;
    try {
      await request(`/api/candidates/${id}`, {
        method: "DELETE",
        token: authToken,
      });
      if (authUser) {
        await hydrateFromBackend(authToken, authUser);
      }
      return true;
    } catch {
      return false;
    }
  };

  const removeAllCandidates = async () => {
    if (!authToken) return false;
    try {
      for (const candidate of candidateList) {
        await request(`/api/candidates/${candidate.id}`, {
          method: "DELETE",
          token: authToken,
        });
      }
      if (authUser) {
        await hydrateFromBackend(authToken, authUser);
      }
      return true;
    } catch {
      return false;
    }
  };

  const updateCandidate = async (id: string, updates: Partial<Candidate>) => {
    if (!authToken) return false;
    const body: { id?: string; name?: string; year?: string; photo?: string } = {};
    if (updates.id !== undefined) body.id = updates.id.trim();
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.year !== undefined) body.year = updates.year;
    if (updates.photo !== undefined) body.photo = updates.photo;
    if (Object.keys(body).length === 0) return true;
    try {
      await request(`/api/candidates/${encodeURIComponent(id)}`, {
        method: "PATCH",
        token: authToken,
        body,
      });
      if (authUser) {
        await hydrateFromBackend(authToken, authUser);
      }
      return true;
    } catch {
      return false;
    }
  };

  const updateCandidatePhoto = async (id: string, photo: string) => {
    if (!authToken) return false;
    try {
      await request(`/api/candidates/${encodeURIComponent(id)}`, {
        method: "PATCH",
        token: authToken,
        body: { photo },
      });
      if (authUser) {
        await hydrateFromBackend(authToken, authUser);
      }
      return true;
    } catch {
      return false;
    }
  };

  const addTeacher = async (email: string) => {
    if (!authToken) return false;
    try {
      await request("/api/teachers", {
        method: "POST",
        token: authToken,
        body: { email },
      });
      if (authUser) {
        await hydrateFromBackend(authToken, authUser);
      }
      return true;
    } catch {
      return false;
    }
  };

  const removeTeacher = async (id: string) => {
    if (!authToken) return false;
    try {
      await request(`/api/teachers/${id}`, {
        method: "DELETE",
        token: authToken,
      });
      if (authUser) {
        await hydrateFromBackend(authToken, authUser);
      }
      return true;
    } catch {
      return false;
    }
  };

  const setTeacherPassword = async (id: string, newPassword: string) => {
    if (!authToken) return false;
    try {
      await request(`/api/teachers/${id}/password`, {
        method: "PATCH",
        token: authToken,
        body: { password: newPassword },
      });
      return true;
    } catch {
      return false;
    }
  };

  return (
    <ElectionContext.Provider value={{
      isLoggedIn, isAdmin, isITAdmin, teacherName, currentEmail, hasVoted, votingOpen,
      votes, allVotes, candidates: candidateList, teachers, results, isLoading,
      login, logout, setVotes, submitVote, toggleVoting,
      addCandidate, removeCandidate, removeAllCandidates, updateCandidate, updateCandidatePhoto, addTeacher, removeTeacher, setTeacherPassword, changePassword,
      refreshData,
    }}>
      {children}
    </ElectionContext.Provider>
  );
};

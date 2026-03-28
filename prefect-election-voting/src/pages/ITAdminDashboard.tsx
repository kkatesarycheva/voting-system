import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useElection } from "@/lib/electionContext";
import { Candidate } from "@/lib/mockData";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Upload, FileSpreadsheet, Image, Users, PlusCircle, Trash2, Search,
  FolderUp, CheckCircle, AlertCircle, X, Eye, Loader2, Pencil,
} from "lucide-react";

interface ParsedCandidate {
  id: string;
  name: string;
  year: string;
}

const API_BASE = "";

const ITAdminDashboard = () => {
  const { isLoggedIn, isITAdmin, candidates, addCandidate, removeCandidate, removeAllCandidates, updateCandidate, updateCandidatePhoto } = useElection();
  const navigate = useNavigate();

  const [newCandidate, setNewCandidate] = useState({ name: "", id: "", year: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [xlsxFile, setXlsxFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [photoUploadStatus, setPhotoUploadStatus] = useState<"idle" | "success" | "error">("idle");

  // Excel parsing state
  const [parsedCandidates, setParsedCandidates] = useState<ParsedCandidate[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importYear, setImportYear] = useState("Year 12");
  const [showPreview, setShowPreview] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  // Edit candidate state
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [editForm, setEditForm] = useState({ id: "", name: "", year: "" });
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);

  const xlsxInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoggedIn || !isITAdmin) {
      navigate("/login");
    }
  }, [isLoggedIn, isITAdmin, navigate]);

  if (!isLoggedIn || !isITAdmin) {
    return null;
  }

  const filteredCandidates = candidates.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.includes(searchQuery)
  );

  const handleAddCandidate = () => {
    if (!newCandidate.name.trim() || !newCandidate.id.trim()) {
      toast.error("Please enter a name and Student ID.");
      return;
    }
    if (candidates.some((c) => c.id === newCandidate.id)) {
      toast.error("A candidate with this ID already exists.");
      return;
    }
    addCandidate({ id: newCandidate.id, name: newCandidate.name, photo: "", year: newCandidate.year });
    setNewCandidate({ name: "", id: "", year: "" });
    toast.success("Candidate added successfully.");
  };

  const handleRemoveCandidate = (id: string) => {
    removeCandidate(id);
    toast.success("Candidate removed.");
  };

  const handleEditCandidate = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setEditForm({ id: candidate.id, name: candidate.name, year: candidate.year || "" });
  };

  const handleSaveEdit = () => {
    if (!editingCandidate) return;
    if (!editForm.name.trim() || !editForm.id.trim()) {
      toast.error("Name and ID are required.");
      return;
    }
    if (editForm.id !== editingCandidate.id && candidates.some((c) => c.id === editForm.id)) {
      toast.error("A candidate with this ID already exists.");
      return;
    }
    updateCandidate(editingCandidate.id, { id: editForm.id, name: editForm.name, year: editForm.year });
    setEditingCandidate(null);
    toast.success("Candidate updated successfully.");
  };

  const handleEditPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingCandidate || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      updateCandidate(editingCandidate.id, { photo: reader.result as string });
      setEditingCandidate({ ...editingCandidate, photo: reader.result as string });
      toast.success("Photo updated.");
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAll = () => {
    removeAllCandidates();
    setShowDeleteAllDialog(false);
    toast.success("All candidates deleted.");
  };

  const handleXlsxSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
      if (validTypes.includes(file.type) || file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        setXlsxFile(file);
        setUploadStatus("idle");
        setParsedCandidates([]);
        setShowPreview(false);
      }
    }
  };

  const handleParseXlsx = async () => {
    if (!xlsxFile) return;
    setIsParsing(true);
    
    try {
      const token = localStorage.getItem("auth_token");
      const formData = new FormData();
      formData.append("file", xlsxFile);

      const res = await fetch(`${API_BASE}/api/candidates/parse-xlsx`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse file");
      }

      const data = await res.json();
      setParsedCandidates(data.candidates);
      setShowPreview(true);
      toast.success(`Extracted ${data.extracted} candidates from ${data.total} rows`);
    } catch (err: any) {
      toast.error(err.message || "Failed to parse Excel file");
      // Fallback: parse locally in the browser
      handleParseLocally();
    } finally {
      setIsParsing(false);
    }
  };

  const handleParseLocally = async () => {
    if (!xlsxFile) return;
    try {
      const XLSX = await import("xlsx");
      const buffer = await xlsxFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const extracted: ParsedCandidate[] = rows
        .map((row) => {
          const firstName = (row["Pupil 1st name"] || row["Pupil 1st Name"] || "").toString().trim();
          const surname = (row["Pupil surname"] || row["Pupil Surname"] || "").toString().trim();
          const id = (row["Roll number"] || row["Roll Number"] || row["ID"] || row["Id"] || row["id"] || row["Roll No"] || row["Student ID"] || row["Pupil ID"] || "").toString().trim();
          if (!firstName && !surname) return null;
          return { id, name: `${firstName} ${surname}`.trim(), year: "" };
        })
        .filter(Boolean) as ParsedCandidate[];

      setParsedCandidates(extracted);
      setShowPreview(true);
      toast.success(`Extracted ${extracted.length} candidates locally`);
    } catch {
      toast.error("Failed to parse file locally");
    }
  };

  const handleConfirmImport = async () => {
    if (parsedCandidates.length === 0) return;
    setIsImporting(true);

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/api/candidates/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ candidates: parsedCandidates, year: importYear }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Import failed");
      }

      const data = await res.json();
      // Also add to local context
      data.imported.forEach((c: any) => {
        addCandidate({ id: String(c.id), name: c.name, photo: "", year: c.year });
      });

      toast.success(`Successfully imported ${data.count} candidates!`);
      setUploadStatus("success");
      setParsedCandidates([]);
      setShowPreview(false);
      setXlsxFile(null);
    } catch (err: any) {
      // Fallback: add locally
      parsedCandidates.forEach((c, i) => {
        const candidateId = c.id || `xlsx-${Date.now()}-${i}`;
        addCandidate({ id: candidateId, name: c.name, photo: "", year: importYear });
      });
      toast.success(`Imported ${parsedCandidates.length} candidates locally`);
      setUploadStatus("success");
      setParsedCandidates([]);
      setShowPreview(false);
      setXlsxFile(null);
    } finally {
      setIsImporting(false);
    }
  };

  const handleRemoveParsed = (index: number) => {
    setParsedCandidates((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) { setPhotoFiles(Array.from(files)); setPhotoUploadStatus("idle"); }
  };

  // Convert file to base64 data URL
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePhotoUpload = async () => {
    if (photoFiles.length === 0) return;
    setIsUploadingPhotos(true);

    try {
      let matchedCount = 0;
      
      for (const file of photoFiles) {
        // Extract student ID from filename (e.g., "4291.jpg" -> "4291")
        const studentId = file.name.replace(/\.[^/.]+$/, "");
        
        // Check if candidate exists with this ID
        const candidate = candidates.find(c => c.id === studentId);
        
        if (candidate) {
          // Convert to base64 for persistent storage
          const photoUrl = await fileToBase64(file);
          updateCandidatePhoto(studentId, photoUrl);
          matchedCount++;
        }
      }

      setPhotoUploadStatus("success");
      toast.success(`Uploaded ${photoFiles.length} photo(s): ${matchedCount} matched to candidates`);
    } catch (err: any) {
      setPhotoUploadStatus("error");
      toast.error(err.message || "Failed to upload photos");
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">IT Administrator</h1>
            <p className="text-muted-foreground">Manage candidates, upload data &amp; photos</p>
          </div>
          <Badge className="bg-accent text-accent-foreground">IT Admin</Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Candidates", value: candidates.length, icon: Users },
            { label: "With Photos", value: candidates.filter((c) => c.photo).length, icon: Image },
            { label: "Without Photos", value: candidates.filter((c) => !c.photo).length, icon: AlertCircle },
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

        <Tabs defaultValue="manage" className="space-y-6">
          <TabsList>
            <TabsTrigger value="manage" className="gap-1.5"><Users className="w-4 h-4" />Manage Candidates</TabsTrigger>
            <TabsTrigger value="upload" className="gap-1.5"><FileSpreadsheet className="w-4 h-4" />Upload Candidates</TabsTrigger>
            <TabsTrigger value="photos" className="gap-1.5"><Image className="w-4 h-4" />Upload Photos</TabsTrigger>
          </TabsList>

          {/* Manage Candidates Tab */}
          <TabsContent value="manage">
            <div className="bg-card border border-border rounded-xl p-6 shadow-card mb-6">
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

            <div className="bg-card border border-border rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-foreground">Current Candidates ({candidates.length})</h3>
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search by name or ID..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  {candidates.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={() => setShowDeleteAllDialog(true)} className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete All
                    </Button>
                  )}
                </div>
              </div>
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {filteredCandidates.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground overflow-hidden">
                        {c.photo ? (
                          <img src={c.photo} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {c.id}{c.year && ` • ${c.year}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.photo ? (
                        <Badge variant="outline" className="text-success border-success/30 text-xs">Photo ✓</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-xs">No Photo</Badge>
                      )}
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => handleEditCandidate(c)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveCandidate(c.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredCandidates.length === 0 && (
                  <p className="py-6 text-center text-muted-foreground text-sm">No candidates found.</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* XLSX Upload Tab */}
          <TabsContent value="upload">
            <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-6">
              <div>
                <h3 className="font-display font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-accent" />
                  Upload Student List (.xlsx)
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload the Excel file exactly as exported from the school system. The system will automatically extract <strong>Pupil 1st name</strong> and <strong>Pupil surname</strong> columns and combine them into candidate names.
                </p>
              </div>

              {/* Year group input */}
              <div className="max-w-xs">
                <Label className="text-card-foreground">Year Group for Import</Label>
                <Input className="mt-1" placeholder="e.g. Year 12" value={importYear} onChange={(e) => setImportYear(e.target.value)} />
              </div>

              {/* Drop zone */}
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-colors"
                onClick={() => xlsxInputRef.current?.click()}
              >
                <input ref={xlsxInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleXlsxSelect} />
                <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                {xlsxFile ? (
                  <div className="space-y-1">
                    <p className="text-foreground font-medium">{xlsxFile.name}</p>
                    <p className="text-sm text-muted-foreground">{(xlsxFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-foreground font-medium">Click to select an Excel file</p>
                    <p className="text-sm text-muted-foreground">Supports .xlsx and .xls formats from the school system</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {xlsxFile && !showPreview && (
                <div className="flex items-center gap-3">
                  <Button onClick={handleParseXlsx} disabled={isParsing} className="bg-gradient-navy text-primary-foreground font-semibold hover:opacity-90 gap-2">
                    {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                    {isParsing ? "Reading file..." : "Preview Candidates"}
                  </Button>
                  <Button variant="ghost" onClick={() => { setXlsxFile(null); setUploadStatus("idle"); setParsedCandidates([]); setShowPreview(false); }}>
                    <X className="w-4 h-4 mr-1" />Clear
                  </Button>
                </div>
              )}

              {/* Preview table */}
              {showPreview && parsedCandidates.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
                      <Eye className="w-4 h-4 text-accent" />
                      Preview: {parsedCandidates.length} candidates extracted
                    </h4>
                    <Badge variant="outline" className="text-muted-foreground">{importYear}</Badge>
                  </div>

                  <div className="border border-border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground">#</th>
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground">ID</th>
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Name</th>
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Year</th>
                          <th className="text-right px-4 py-2 font-medium text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {parsedCandidates.map((c, i) => (
                          <tr key={i} className="hover:bg-muted/30">
                            <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                            <td className="px-4 py-2 text-muted-foreground">{c.id || "-"}</td>
                            <td className="px-4 py-2 text-foreground font-medium">{c.name}</td>
                            <td className="px-4 py-2 text-muted-foreground">{importYear}</td>
                            <td className="px-4 py-2 text-right">
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7 w-7 p-0" onClick={() => handleRemoveParsed(i)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button onClick={handleConfirmImport} disabled={isImporting} className="bg-gradient-gold text-secondary-foreground font-semibold hover:opacity-90 gap-2">
                      {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {isImporting ? "Importing..." : `Confirm Import (${parsedCandidates.length})`}
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowPreview(false); setParsedCandidates([]); setXlsxFile(null); }}>
                      <X className="w-4 h-4 mr-1" />Cancel
                    </Button>
                  </div>
                </div>
              )}

              {showPreview && parsedCandidates.length === 0 && (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-md px-4 py-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">No candidates found. Ensure the file has "Pupil 1st name" and "Pupil surname" columns.</span>
                </div>
              )}

              {uploadStatus === "success" && (
                <div className="flex items-center gap-2 text-success bg-success/10 rounded-md px-4 py-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Candidates imported successfully!</span>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Photo Upload Tab */}
          <TabsContent value="photos">
            <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-6">
              <div>
                <h3 className="font-display font-semibold text-foreground mb-1 flex items-center gap-2">
                  <FolderUp className="w-5 h-5 text-accent" />
                  Upload Student Photos
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select multiple photos from a folder. File names should match Student IDs (e.g. 4291.jpg) for automatic matching.
                </p>
              </div>
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-colors"
                onClick={() => photoInputRef.current?.click()}
              >
                <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
                <Image className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                {photoFiles.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-foreground font-medium">{photoFiles.length} photo(s) selected</p>
                    <p className="text-sm text-muted-foreground">
                      {photoFiles.slice(0, 3).map((f) => f.name).join(", ")}
                      {photoFiles.length > 3 && ` and ${photoFiles.length - 3} more...`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-foreground font-medium">Click to select student photos</p>
                    <p className="text-sm text-muted-foreground">Select multiple images (JPG, PNG). Name files by Student ID.</p>
                  </div>
                )}
              </div>
              {photoFiles.length > 0 && (
                <div className="flex items-center gap-3">
                  <Button onClick={handlePhotoUpload} disabled={isUploadingPhotos} className="bg-gradient-gold text-secondary-foreground font-semibold hover:opacity-90 gap-2">
                    {isUploadingPhotos ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isUploadingPhotos ? "Uploading..." : "Upload Photos"}
                  </Button>
                  <Button variant="ghost" onClick={() => { setPhotoFiles([]); setPhotoUploadStatus("idle"); }}>
                    <X className="w-4 h-4 mr-1" />Clear
                  </Button>
                </div>
              )}
              {photoUploadStatus === "success" && (
                <div className="flex items-center gap-2 text-success bg-success/10 rounded-md px-4 py-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Photos uploaded successfully!</span>
                </div>
              )}
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
                onClick={() => editPhotoInputRef.current?.click()}
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
              <input ref={editPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleEditPhotoUpload} />
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

      {/* Delete All Confirmation Dialog */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
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

export default ITAdminDashboard;

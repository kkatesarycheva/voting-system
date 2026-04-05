import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useElection } from "@/lib/electionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { LogOut, Shield, Vote, Users, Monitor, Key } from "lucide-react";
import { toast } from "sonner";
import eskLogo from "@/assets/esk.png";

const Header = () => {
  const { isLoggedIn, isAdmin, isITAdmin, teacherName, logout, changePassword } = useElection();
  const navigate = useNavigate();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const result = await changePassword(oldPassword, newPassword);
    if (result.success) {
      toast.success("Password changed successfully");
      setShowPasswordDialog(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(result.error || "Could not change password");
    }
  };

  return (
    <header className="bg-gradient-navy border-b border-navy-light/30">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-gold">
            <img src={eskLogo} alt="School logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-primary-foreground font-display text-lg font-bold leading-tight">
              ESK Prefects Election
            </h1>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {isLoggedIn && !isITAdmin && (
            <>
              <Link to="/candidates">
                <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
                  <Users className="w-4 h-4 mr-1.5" />
                  Candidates
                </Button>
              </Link>
              <Link to="/vote">
                <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
                  <Vote className="w-4 h-4 mr-1.5" />
                  Vote
                </Button>
              </Link>
            </>
          )}
          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
                <Shield className="w-4 h-4 mr-1.5" />
                Admin
              </Button>
            </Link>
          )}
          {isITAdmin && (
            <Link to="/it-admin">
              <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
                <Monitor className="w-4 h-4 mr-1.5" />
                IT Admin
              </Button>
            </Link>
          )}
          {isLoggedIn ? (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-primary-foreground/20">
              <span className="text-primary-foreground/70 text-sm hidden sm:inline">{teacherName}</span>
              <Button variant="ghost" size="sm" onClick={() => setShowPasswordDialog(true)} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" title="Change Password">
                <Key className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm" className="bg-gradient-gold text-secondary-foreground font-semibold hover:opacity-90 shadow-gold">
                Login
              </Button>
            </Link>
          )}
        </nav>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Change Password</DialogTitle>
            <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="oldPassword">Current Password</Label>
              <Input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} className="bg-gradient-navy text-primary-foreground font-semibold hover:opacity-90">
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Calendar,
  Briefcase,
  Award,
  FileText,
  Edit2,
  Save,
  X,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition } from "@/components/AnimationWrappers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { url } from "../url";

const defaultUserData = {
  id: "",
  username: "",
  email: "",
  title: "",
  avatar: "",
  created_at: "",
  lastActive: "",
  papersSubmitted: 0,
  papersReviewed: 0,
  citationCount: 0,
  hIndex: 0,
  expertise: [],
  qualifications: null,
  certifications: null,
  role: "author",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(defaultUserData);
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    handleUpdate();
    setIsEditing(false);
  };

  const handleCancel = () => {
    fetchProfile();
    setIsEditing(false);
  };

  const handleDeleteAccount = () => {
    console.log("Deleting account:", userData.id);
    setShowDeleteConfirm(false);
    navigate("/login");
  };

  const handleChangePassword = () => {
    if (newPassword && newPassword === confirmPassword) {
      console.log("Changing password");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${url}/profile/getProfile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        const apiUser = result.data.user;
        const apiProfile = result.data.profile;

        setUserData({
          id: apiUser.id,
          username: apiUser.username,
          email: apiUser.email,
          role: apiUser.role,
          created_at: apiUser.created_at,
          title: "",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiUser.username
            ?.charAt(0)
            .toUpperCase()}`,
          lastActive: new Date().toISOString(),
          papersSubmitted: 0,
          papersReviewed: 0,
          citationCount: 0,
          hIndex: 0,
          expertise: apiProfile.expertise
            ? Array.isArray(apiProfile.expertise)
              ? apiProfile.expertise
              : []
            : [],
          qualifications: apiProfile.qualifications,
          certifications: apiProfile.certifications,
        });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    try {
      setLoading(true);

      const payload: any = {
        username: userData.username,
        email: userData.email,
      };

      if (userData.qualifications)
        payload.qualifications = userData.qualifications;
      if (userData.expertise) payload.expertise = userData.expertise;
      if (userData.certifications)
        payload.certifications = userData.certifications;

      const response = await fetch(`${url}/profile/updateProfile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        await fetchProfile();
        alert("Profile updated successfully");
      } else {
        alert(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role={userData.role} userName={userData.username}>
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Profile Settings
              </h1>
              <p className="text-muted-foreground">
                Manage your account information and preferences
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="gap-2 bg-gradient-primary hover:opacity-90"
                  disabled={loading}
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="gap-2 border-border hover:bg-muted text-muted-foreground hover:text-muted-foreground"
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="gap-2 bg-gradient-primary hover:opacity-90"
                    disabled={loading}
                  >
                    <Save className="h-4 w-4" />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="bg-muted/50">
              <TabsTrigger value="overview">
                <User className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Personal Information
                      </CardTitle>
                      <CardDescription>
                        Your public profile information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="relative">
                          <Avatar className="h-24 w-24 border-4 border-background shadow-2xl">
                            <AvatarImage src={userData.avatar} />
                            <AvatarFallback className="text-lg bg-gradient-primary text-primary-foreground">
                              {userData.username
                                ? getInitials(userData.username)
                                : "U"}
                            </AvatarFallback>
                          </Avatar>
                          {isEditing && (
                            <Button
                              size="icon"
                              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-lg"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="flex-1 space-y-4">
                          <div>
                            {isEditing ? (
                              <Input
                                value={userData.username}
                                onChange={(e) =>
                                  setUserData({
                                    ...userData,
                                    username: e.target.value,
                                  })
                                }
                                className="text-xl font-bold"
                              />
                            ) : (
                              <h2 className="text-xl font-bold text-foreground">
                                {userData.username || "No username"}
                              </h2>
                            )}
                            {isEditing ? (
                              <Input
                                value={userData.role}
                                onChange={(e) =>
                                  setUserData({
                                    ...userData,
                                    role: e.target.value,
                                  })
                                }
                                className="mt-1"
                                placeholder="role"
                              />
                            ) : (
                              <div className="flex gap-2 items-center">
                                <span>Role:</span>
                                <p className="text-primary font-medium">
                                  {userData.role || "No role"}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="gap-1">
                              <FileText className="h-3 w-3" />
                              {userData.papersSubmitted} papers
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Award className="h-3 w-3" />
                              h-index: {userData.hIndex}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Briefcase className="h-3 w-3" />
                              {userData.papersReviewed} reviews
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              Email Address
                            </Label>
                            {isEditing ? (
                              <Input
                                value={userData.email}
                                onChange={(e) =>
                                  setUserData({
                                    ...userData,
                                    email: e.target.value,
                                  })
                                }
                                type="email"
                              />
                            ) : (
                              <p className="text-foreground">
                                {userData.email || "No email"}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              Member Since
                            </Label>
                            <p className="text-foreground">
                              {userData.created_at
                                ? new Date(
                                    userData.created_at
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : "N/A"}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              Last Active
                            </Label>
                            <p className="text-foreground">
                              {userData.lastActive
                                ? new Date(
                                    userData.lastActive
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : "N/A"}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">User ID</Label>
                            <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
                              {userData.id || "N/A"}
                            </code>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Areas of Expertise</Label>
                        <div className="flex flex-wrap gap-2">
                          {isEditing ? (
                            <Input
                              value={
                                Array.isArray(userData.expertise)
                                  ? userData.expertise.join(", ")
                                  : ""
                              }
                              onChange={(e) =>
                                setUserData({
                                  ...userData,
                                  expertise: e.target.value
                                    .split(",")
                                    .map((e) => e.trim())
                                    .filter((e) => e.length > 0),
                                })
                              }
                              placeholder="Enter expertise separated by commas"
                            />
                          ) : userData.expertise &&
                            userData.expertise.length > 0 ? (
                            userData.expertise.map((skill, index) => (
                              <Badge key={index} variant="secondary">
                                {skill}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No expertise added yet
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Qualifications</Label>
                        {isEditing ? (
                          <Textarea
                            value={userData.qualifications || ""}
                            onChange={(e) =>
                              setUserData({
                                ...userData,
                                qualifications: e.target.value,
                              })
                            }
                            rows={3}
                            placeholder="Enter your qualifications"
                          />
                        ) : (
                          <p className="text-muted-foreground leading-relaxed">
                            {userData.qualifications ||
                              "No qualifications added yet"}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Certifications</Label>
                        {isEditing ? (
                          <Textarea
                            value={userData.certifications || ""}
                            onChange={(e) =>
                              setUserData({
                                ...userData,
                                certifications: e.target.value,
                              })
                            }
                            rows={3}
                            placeholder="Enter your certifications"
                          />
                        ) : (
                          <p className="text-muted-foreground leading-relaxed">
                            {userData.certifications ||
                              "No certifications added yet"}
                          </p>
                        )}
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Role</Label>
                        <Badge variant="default" className="text-sm">
                          {userData.role.charAt(0).toUpperCase() +
                            userData.role.slice(1)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" />
                        Change Password
                      </CardTitle>
                      <CardDescription>
                        Update your password to keep your account secure
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Label>New Password</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="pl-10"
                          />
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="pl-10"
                          />
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      </div>

                      {newPassword &&
                        confirmPassword &&
                        newPassword !== confirmPassword && (
                          <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            Passwords do not match
                          </div>
                        )}

                      <Button
                        onClick={handleChangePassword}
                        disabled={
                          !newPassword || newPassword !== confirmPassword
                        }
                        className="w-full bg-gradient-primary hover:opacity-90"
                      >
                        Update Password
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-destructive/20">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-destructive mb-2">
                            Danger Zone
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Once you delete your account, there is no going
                            back. Please be certain.
                          </p>
                        </div>

                        {!showDeleteConfirm ? (
                          <Button
                            variant="destructive"
                            className="w-full gap-2"
                            onClick={() => setShowDeleteConfirm(true)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Account
                          </Button>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-4 p-4 rounded-lg border border-destructive/20 bg-destructive/5"
                          >
                            <div className="flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-destructive">
                                  Are you absolutely sure?
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  This action cannot be undone. All your data
                                  will be permanently deleted.
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowDeleteConfirm(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                className="flex-1 gap-2"
                                onClick={handleDeleteAccount}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete Account
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}

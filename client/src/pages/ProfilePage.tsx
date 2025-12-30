// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import {
//   User,
//   Mail,
//   Calendar,
//   Building,
//   Globe,
//   Briefcase,
//   Award,
//   FileText,
//   Edit2,
//   Save,
//   X,
//   Trash2,
//   Lock,
//   Eye,
//   EyeOff,
//   AlertCircle,
// } from "lucide-react";
// import { DashboardLayout } from "@/components/DashboardLayout";
// import { PageTransition } from "@/components/AnimationWrappers";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { cn } from "@/lib/utils";
// import { useAuth } from "@/context/AuthContext";
// import { json } from "stream/consumers";

// const mockUserData = {
//   id: "USR-2024-001",
//   username: "Dr. Michael Chen",
//   email: "michael.chen@research.edu",
//   title: "Senior Research Scientist",
//   affiliation: "Stanford University",
//   department: "Computer Science Department",
//   location: "Stanford, California, USA",
//   bio: "Dr. Michael Chen is a Senior Research Scientist specializing in Machine Learning and Quantum Computing. With over 10 years of experience in academic research, he has published numerous papers in top-tier conferences and journals.",
//   avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
//   created_at: "2022-03-15",
//   lastActive: "2024-01-20",
//   papersSubmitted: 24,
//   papersReviewed: 42,
//   citationCount: 1560,
//   hIndex: 18,
//   expertise: [
//     "Machine Learning",
//     "Quantum Computing",
//     "Artificial Intelligence",
//     "Data Science",
//   ],
//   links: {
//     googleScholar: "https://scholar.google.com/citations?user=michaelchen",
//     orcid: "0000-0002-1825-0097",
//     github: "michaelchen-research",
//     linkedin: "michaelchen-research",
//   },
// };

// // const fetchProfileData =

// export default function ProfilePage() {
//   const navigate = useNavigate();
//   const [isEditing, setIsEditing] = useState(false);
//   const [userData, setUserData] = useState(mockUserData);
//   const [activeTab, setActiveTab] = useState("overview");
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const { token } = useAuth();
//   const [profile, setProfile] = useState(null);

//   const [loading, setLoading] = useState(false);

//   const handleSave = () => {
//     handleUpdate();
//     setIsEditing(false);
//   };

//   const handleCancel = () => {
//     setUserData(mockUserData);
//     setIsEditing(false);
//   };

//   const handleDeleteAccount = () => {
//     console.log("Deleting account:", userData.id);
//     setShowDeleteConfirm(false);
//     navigate("/login");
//   };

//   const handleChangePassword = () => {
//     if (newPassword && newPassword === confirmPassword) {
//       console.log("Changing password");
//       setNewPassword("");
//       setConfirmPassword("");
//     }
//   };

//   const getInitials = (name: string) => {
//     return name
//       .split(" ")
//       .map((n) => n[0])
//       .join("")
//       .toUpperCase()
//       .slice(0, 2);
//   };

//   const fetchProfile = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(
//         `http://localhost:5000/api/profile/getProfile`,
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       const result = await response.json();

//       if (result.success) {
//         setUserData(result.user);
//       }

//       console.log(result.user);
//     } catch (error: any) {
//       alert(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     setLoading(true);
//     fetchProfile();
//     setLoading(false);
//   }, []);

//   const handleUpdate = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(
//         `http://localhost:5000/api/profile/updateProfile`,
//         {
//           method: "PUT",
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             name: profile.username,
//             email: profile.email,
//           }),
//         }
//       );
//       const result = await response.json();

//       if (result.success) {
//         setUserData(result.user);
//       }
//     } catch (error) {
//       console.log("failed to update");
//     }
//   };

//   // const handleDelete = async () => {
//   //   const confirmDelete = window.confirm(
//   //     "Are you sure you want to delete your profile?"
//   //   );

//   //   if (!confirmDelete) return;

//   //   try {
//   //     setLoading(true);
//   //     await deleteProfile();
//   //     logout();
//   //     navigate("/login");
//   //   } catch (error: any) {
//   //     alert(error.message);
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };
//   return (
//     <DashboardLayout role="reviewer" userName={userData.username}>
//       <PageTransition>
//         <div className="space-y-6">
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//             <div>
//               <h1 className="text-3xl font-bold text-foreground">
//                 Profile Settings
//               </h1>
//               <p className="text-muted-foreground">
//                 Manage your account information and preferences
//               </p>
//             </div>
//             <div className="flex items-center gap-3">
//               {!isEditing ? (
//                 <Button
//                   onClick={() => setIsEditing(true)}
//                   className="gap-2 bg-gradient-primary hover:opacity-90"
//                 >
//                   <Edit2 className="h-4 w-4" />
//                   Edit Profile
//                 </Button>
//               ) : (
//                 <div className="flex gap-2">
//                   <Button
//                     variant="outline"
//                     onClick={handleCancel}
//                     className="gap-2 border-border hover:bg-muted text-muted-foreground hover:text-muted-foreground"
//                   >
//                     <X className="h-4 w-4" />
//                     Cancel
//                   </Button>
//                   <Button
//                     onClick={handleSave}
//                     className="gap-2 bg-gradient-primary hover:opacity-90"
//                   >
//                     <Save className="h-4 w-4" />
//                     Save Changes
//                   </Button>
//                 </div>
//               )}
//             </div>
//           </div>

//           <Tabs
//             value={activeTab}
//             onValueChange={setActiveTab}
//             className="space-y-6"
//           >
//             <TabsList className="bg-muted/50">
//               <TabsTrigger value="overview">
//                 <User className="h-4 w-4 mr-2" />
//                 Overview
//               </TabsTrigger>
//             </TabsList>

//             <TabsContent value="overview" className="space-y-6">
//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 <div className="lg:col-span-2 space-y-6">
//                   <Card className="glass-card">
//                     <CardHeader>
//                       <CardTitle className="flex items-center gap-2">
//                         <User className="h-5 w-5 text-primary" />
//                         Personal Information
//                       </CardTitle>
//                       <CardDescription>
//                         Your public profile information
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent className="space-y-6">
//                       <div className="flex flex-col sm:flex-row items-start gap-6">
//                         <div className="relative">
//                           <Avatar className="h-24 w-24 border-4 border-background shadow-2xl">
//                             <AvatarImage src={userData.avatar} />
//                             <AvatarFallback className="text-lg bg-gradient-primary text-primary-foreground">
//                               {getInitials(userData.username)}
//                             </AvatarFallback>
//                           </Avatar>
//                           {isEditing && (
//                             <Button
//                               size="icon"
//                               className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-lg"
//                             >
//                               <Edit2 className="h-4 w-4" />
//                             </Button>
//                           )}
//                         </div>

//                         <div className="flex-1 space-y-4">
//                           <div>
//                             {isEditing ? (
//                               <Input
//                                 value={userData.username}
//                                 onChange={(e) =>
//                                   setUserData({
//                                     ...userData,
//                                     username: e.target.value,
//                                   })
//                                 }
//                                 className="text-xl font-bold"
//                               />
//                             ) : (
//                               <h2 className="text-xl font-bold text-foreground">
//                                 {userData?.username || "username"}
//                               </h2>
//                             )}
//                             {isEditing ? (
//                               <Input
//                                 value={userData.title}
//                                 onChange={(e) =>
//                                   setUserData({
//                                     ...userData,
//                                     title: e.target.value,
//                                   })
//                                 }
//                                 className="mt-1"
//                               />
//                             ) : (
//                               <p className="text-primary font-medium">
//                                 {userData.title}
//                               </p>
//                             )}
//                           </div>

//                           <div className="flex flex-wrap gap-2">
//                             <Badge variant="outline" className="gap-1">
//                               <FileText className="h-3 w-3" />
//                               {userData.papersSubmitted} papers
//                             </Badge>
//                             <Badge variant="outline" className="gap-1">
//                               <Award className="h-3 w-3" />
//                               h-index: {userData.hIndex}
//                             </Badge>
//                             <Badge variant="outline" className="gap-1">
//                               <Briefcase className="h-3 w-3" />
//                               {userData.papersReviewed} reviews
//                             </Badge>
//                           </div>
//                         </div>
//                       </div>

//                       <Separator />

//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         <div className="space-y-4">
//                           <div className="space-y-2">
//                             <Label className="flex items-center gap-2 text-sm">
//                               <Mail className="h-4 w-4 text-muted-foreground" />
//                               Email Address
//                             </Label>
//                             {isEditing ? (
//                               <Input
//                                 value={userData.email}
//                                 onChange={(e) =>
//                                   setUserData({
//                                     ...userData,
//                                     email: e.target.value,
//                                   })
//                                 }
//                                 type="email"
//                               />
//                             ) : (
//                               <p className="text-foreground">
//                                 {userData?.email || "email"}
//                               </p>
//                             )}
//                           </div>

//                           <div className="space-y-2">
//                             <Label className="flex items-center gap-2 text-sm">
//                               <Building className="h-4 w-4 text-muted-foreground" />
//                               Affiliation
//                             </Label>
//                             {isEditing ? (
//                               <Input
//                                 value={userData.affiliation}
//                                 onChange={(e) =>
//                                   setUserData({
//                                     ...userData,
//                                     affiliation: e.target.value,
//                                   })
//                                 }
//                               />
//                             ) : (
//                               <p className="text-foreground">
//                                 {userData.affiliation}
//                               </p>
//                             )}
//                           </div>

//                           <div className="space-y-2">
//                             <Label className="flex items-center gap-2 text-sm">
//                               <Globe className="h-4 w-4 text-muted-foreground" />
//                               Location
//                             </Label>
//                             {isEditing ? (
//                               <Input
//                                 value={userData.location}
//                                 onChange={(e) =>
//                                   setUserData({
//                                     ...userData,
//                                     location: e.target.value,
//                                   })
//                                 }
//                               />
//                             ) : (
//                               <p className="text-foreground">
//                                 {userData.location}
//                               </p>
//                             )}
//                           </div>
//                         </div>

//                         <div className="space-y-4">
//                           <div className="space-y-2">
//                             <Label className="flex items-center gap-2 text-sm">
//                               <Calendar className="h-4 w-4 text-muted-foreground" />
//                               Member Since
//                             </Label>
//                             <p className="text-foreground">
//                               {new Date(
//                                 userData?.created_at || "date"
//                               ).toLocaleDateString("en-US", {
//                                 year: "numeric",
//                                 month: "long",
//                                 day: "numeric",
//                               })}
//                             </p>
//                           </div>

//                           <div className="space-y-2">
//                             <Label className="flex items-center gap-2 text-sm">
//                               <Calendar className="h-4 w-4 text-muted-foreground" />
//                               Last Active
//                             </Label>
//                             <p className="text-foreground">
//                               {new Date(userData.lastActive).toLocaleDateString(
//                                 "en-US",
//                                 {
//                                   year: "numeric",
//                                   month: "long",
//                                   day: "numeric",
//                                 }
//                               )}
//                             </p>
//                           </div>

//                           <div className="space-y-2">
//                             <Label className="text-sm">User ID</Label>
//                             <code className="text-xs bg-muted px-2 py-1 rounded">
//                               {userData?.id || "id"}
//                             </code>
//                           </div>
//                         </div>
//                       </div>

//                       <div className="space-y-2">
//                         <Label className="text-sm">Bio</Label>
//                         {isEditing ? (
//                           <Textarea
//                             value={userData.bio}
//                             onChange={(e) =>
//                               setUserData({ ...userData, bio: e.target.value })
//                             }
//                             rows={4}
//                             className="min-h-[120px]"
//                           />
//                         ) : (
//                           <p className="text-muted-foreground leading-relaxed">
//                             {userData.bio}
//                           </p>
//                         )}
//                       </div>

//                       <div className="space-y-2">
//                         <Label className="text-sm">Areas of Expertise</Label>
//                         <div className="flex flex-wrap gap-2">
//                           {isEditing ? (
//                             <Input
//                               value={userData.expertise.join(", ")}
//                               onChange={(e) =>
//                                 setUserData({
//                                   ...userData,
//                                   expertise: e.target.value
//                                     .split(",")
//                                     .map((e) => e.trim()),
//                                 })
//                               }
//                               placeholder="Enter expertise separated by commas"
//                             />
//                           ) : (
//                             userData.expertise.map((skill, index) => (
//                               <Badge key={index} variant="secondary">
//                                 {skill}
//                               </Badge>
//                             ))
//                           )}
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </div>

//                 <div className="space-y-6">
//                   <Card className="glass-card">
//                     <CardHeader>
//                       <CardTitle className="flex items-center gap-2">
//                         <Lock className="h-5 w-5 text-primary" />
//                         Change Password
//                       </CardTitle>
//                       <CardDescription>
//                         Update your password to keep your account secure
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent className="space-y-4">
//                       <div className="space-y-3">
//                         <Label>New Password</Label>
//                         <div className="relative">
//                           <Input
//                             type={showPassword ? "text" : "password"}
//                             value={newPassword}
//                             onChange={(e) => setNewPassword(e.target.value)}
//                             placeholder="Enter new password"
//                             className="pl-10"
//                           />
//                           <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                           <button
//                             type="button"
//                             onClick={() => setShowPassword(!showPassword)}
//                             className="absolute right-3 top-1/2 -translate-y-1/2"
//                           >
//                             {showPassword ? (
//                               <EyeOff className="h-4 w-4 text-muted-foreground" />
//                             ) : (
//                               <Eye className="h-4 w-4 text-muted-foreground" />
//                             )}
//                           </button>
//                         </div>
//                       </div>

//                       <div className="space-y-3">
//                         <Label>Confirm New Password</Label>
//                         <div className="relative">
//                           <Input
//                             type={showPassword ? "text" : "password"}
//                             value={confirmPassword}
//                             onChange={(e) => setConfirmPassword(e.target.value)}
//                             placeholder="Confirm new password"
//                             className="pl-10"
//                           />
//                           <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                         </div>
//                       </div>

//                       {newPassword &&
//                         confirmPassword &&
//                         newPassword !== confirmPassword && (
//                           <div className="flex items-center gap-2 text-sm text-destructive">
//                             <AlertCircle className="h-4 w-4" />
//                             Passwords do not match
//                           </div>
//                         )}

//                       <Button
//                         onClick={handleChangePassword}
//                         disabled={
//                           !newPassword || newPassword !== confirmPassword
//                         }
//                         className="w-full bg-gradient-primary hover:opacity-90"
//                       >
//                         Update Password
//                       </Button>
//                     </CardContent>
//                   </Card>

//                   <Card className="glass-card border-destructive/20">
//                     <CardContent className="p-6">
//                       <div className="space-y-4">
//                         <div>
//                           <h4 className="font-medium text-destructive mb-2">
//                             Danger Zone
//                           </h4>
//                           <p className="text-sm text-muted-foreground">
//                             Once you delete your account, there is no going
//                             back. Please be certain.
//                           </p>
//                         </div>

//                         {!showDeleteConfirm ? (
//                           <Button
//                             variant="destructive"
//                             className="w-full gap-2"
//                             onClick={() => setShowDeleteConfirm(true)}
//                           >
//                             <Trash2 className="h-4 w-4" />
//                             Delete Account
//                           </Button>
//                         ) : (
//                           <motion.div
//                             initial={{ opacity: 0, height: 0 }}
//                             animate={{ opacity: 1, height: "auto" }}
//                             className="space-y-4 p-4 rounded-lg border border-destructive/20 bg-destructive/5"
//                           >
//                             <div className="flex items-start gap-3">
//                               <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
//                               <div>
//                                 <p className="font-medium text-destructive">
//                                   Are you absolutely sure?
//                                 </p>
//                                 <p className="text-sm text-muted-foreground mt-1">
//                                   This action cannot be undone. All your data
//                                   will be permanently deleted.
//                                 </p>
//                               </div>
//                             </div>
//                             <div className="flex gap-2">
//                               <Button
//                                 variant="outline"
//                                 className="flex-1"
//                                 onClick={() => setShowDeleteConfirm(false)}
//                               >
//                                 Cancel
//                               </Button>
//                               <Button
//                                 variant="destructive"
//                                 className="flex-1 gap-2"
//                                 onClick={handleDeleteAccount}
//                               >
//                                 <Trash2 className="h-4 w-4" />
//                                 Delete Account
//                               </Button>
//                             </div>
//                           </motion.div>
//                         )}
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </div>
//               </div>
//             </TabsContent>
//           </Tabs>
//         </div>
//       </PageTransition>
//     </DashboardLayout>
//   );
// }

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Calendar,
  Building,
  Globe,
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
  Shield,
  Settings,
  Edit,
  Users,
  BarChart3,
  Star,
  CheckCircle,
  Clock,
  Bell,
  Database,
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { roleConfig } from "../lib/roles";

interface UserData {
  id: string;
  username: string;
  email: string;
  role: "author" | "reviewer" | "editor" | "publisher";
  title: string;
  affiliation: string;
  department: string;
  location: string;
  bio: string;
  avatar: string;
  created_at: string;
  lastActive: string;
  papersSubmitted?: number;
  papersReviewed?: number;
  citationCount?: number;
  hIndex?: number;
  expertise: string[];
  links?: {
    googleScholar?: string;
    orcid?: string;
    github?: string;
    linkedin?: string;
  };
  stats?: {
    totalPapers?: number;
    pendingReviews?: number;
    activeProjects?: number;
    teamSize?: number;
    publishedArticles?: number;
    rejectedArticles?: number;
    systemUsers?: number;
    totalStorage?: string;
    uptime?: string;
  };
  notifications?: number;
  recentActivity?: Array<{
    id: string;
    action: string;
    timestamp: string;
    status: "success" | "warning" | "error";
  }>;
}

const defaultRoleData: Record<string, Partial<UserData>> = {
  admin: {
    title: "System Administrator",
    bio: "Full system administrator with access to all platform features and user management capabilities.",
    expertise: [
      "System Administration",
      "Security",
      "User Management",
      "Database",
    ],
    stats: {
      systemUsers: 0,
      totalStorage: "0 GB",
      uptime: "99.9%",
    },
  },
  user: {
    title: "Researcher",
    bio: "Academic researcher contributing papers and participating in peer review processes.",
    expertise: ["Academic Research", "Paper Writing", "Peer Review"],
    stats: {
      totalPapers: 0,
      pendingReviews: 0,
      activeProjects: 0,
    },
  },
  manager: {
    title: "Project Manager",
    bio: "Manages research projects, coordinates teams, and oversees publication processes.",
    expertise: [
      "Project Management",
      "Team Coordination",
      "Workflow Management",
    ],
    stats: {
      activeProjects: 0,
      teamSize: 0,
      totalPapers: 0,
    },
  },
  editor: {
    title: "Content Editor",
    bio: "Reviews and edits submissions, manages publication queues, and ensures content quality.",
    expertise: [
      "Content Editing",
      "Quality Assurance",
      "Publication Standards",
    ],
    stats: {
      publishedArticles: 0,
      rejectedArticles: 0,
      pendingReviews: 0,
    },
  },
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { role: authUser, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize with role-specific data
  useEffect(() => {
    if (authUser?.role) {
      const roleData = defaultRoleData[authUser.role] || {};
      setUserData({
        id: "",
        username: "",
        email: "",
        role: authUser.role,
        title: "",
        affiliation: "",
        department: "",
        location: "",
        bio: "",
        avatar: "",
        created_at: "",
        lastActive: new Date().toISOString(),
        expertise: [],
        ...roleData,
        stats: roleData.stats || {},
      });
    }
  }, [authUser]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/profile/updateProfile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: userData?.username,
            email: userData?.email,
            title: userData?.title,
            affiliation: userData?.affiliation,
            location: userData?.location,
            bio: userData?.bio,
            expertise: userData?.expertise,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        setUserData(result.user);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    fetchProfile();
    setIsEditing(false);
  };

  const handleDeleteAccount = () => {
    // Implement delete account logic
    setShowDeleteConfirm(false);
    navigate("/login");
  };

  const handleChangePassword = async () => {
    if (newPassword && newPassword === confirmPassword) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/profile/changePassword`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ newPassword }),
          }
        );

        if (response.ok) {
          setNewPassword("");
          setConfirmPassword("");
        }
      } catch (error) {
        console.error("Failed to change password:", error);
      }
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
      const response = await fetch(
        `http://localhost:5000/api/profile/getProfile`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        // Merge with role-specific defaults
        const roleData = defaultRoleData[result.user.role] || {};
        setUserData({
          ...roleData,
          ...result.user,
          stats: { ...roleData.stats, ...result.user.stats },
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  // Role-specific icons
  const roleIcons = {
    admin: Shield,
    user: User,
    manager: Settings,
    editor: Edit,
  };

  // Role-specific badges
  const roleBadges = {
    admin: {
      label: "Administrator",
      color: "bg-red-100 text-red-800 border-red-200",
      icon: Shield,
    },
    user: {
      label: "Researcher",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: User,
    },
    manager: {
      label: "Manager",
      color: "bg-purple-100 text-purple-800 border-purple-200",
      icon: Settings,
    },
    editor: {
      label: "Editor",
      color: "bg-green-100 text-green-800 border-green-200",
      icon: Edit,
    },
  };

  // Role-specific stats cards
  const renderRoleStats = () => {
    if (!userData?.stats) return null;

    const statsConfig = {
      admin: [
        {
          label: "System Users",
          value: userData.stats.systemUsers,
          icon: Users,
          color: "text-red-600",
        },
        {
          label: "Total Storage",
          value: userData.stats.totalStorage,
          icon: Database,
          color: "text-blue-600",
        },
        {
          label: "Uptime",
          value: userData.stats.uptime,
          icon: BarChart3,
          color: "text-green-600",
        },
      ],
      user: [
        {
          label: "Papers Submitted",
          value: userData.stats.totalPapers,
          icon: FileText,
          color: "text-blue-600",
        },
        {
          label: "Pending Reviews",
          value: userData.stats.pendingReviews,
          icon: Clock,
          color: "text-yellow-600",
        },
        {
          label: "Active Projects",
          value: userData.stats.activeProjects,
          icon: Briefcase,
          color: "text-purple-600",
        },
        {
          label: "Citations",
          value: userData.citationCount,
          icon: Award,
          color: "text-green-600",
        },
      ],
      manager: [
        {
          label: "Active Projects",
          value: userData.stats.activeProjects,
          icon: Briefcase,
          color: "text-purple-600",
        },
        {
          label: "Team Size",
          value: userData.stats.teamSize,
          icon: Users,
          color: "text-blue-600",
        },
        {
          label: "Total Papers",
          value: userData.stats.totalPapers,
          icon: FileText,
          color: "text-green-600",
        },
      ],
      editor: [
        {
          label: "Published Articles",
          value: userData.stats.publishedArticles,
          icon: CheckCircle,
          color: "text-green-600",
        },
        {
          label: "Rejected Articles",
          value: userData.stats.rejectedArticles,
          icon: X,
          color: "text-red-600",
        },
        {
          label: "Pending Reviews",
          value: userData.stats.pendingReviews,
          icon: Clock,
          color: "text-yellow-600",
        },
      ],
    };

    const stats = statsConfig[userData.role] || [];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(
          (stat, index) =>
            stat.value !== undefined && (
              <Card
                key={index}
                className="glass-card hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div
                      className={`p-3 rounded-full bg-opacity-10 ${stat.color.replace(
                        "text-",
                        "bg-"
                      )}`}
                    >
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
        )}
      </div>
    );
  };

  // Role-specific actions
  const renderRoleActions = () => {
    const actions = {
      admin: [
        { label: "Manage Users", icon: Users, href: "/admin/users" },
        { label: "System Logs", icon: Database, href: "/admin/logs" },
        { label: "Settings", icon: Settings, href: "/admin/settings" },
      ],
      user: [
        { label: "My Papers", icon: FileText, href: "/user/papers" },
        { label: "Submit Paper", icon: Edit2, href: "/user/submit" },
        { label: "Review Requests", icon: CheckCircle, href: "/user/reviews" },
      ],
      manager: [
        { label: "Team Dashboard", icon: Users, href: "/manager/team" },
        {
          label: "Project Overview",
          icon: Briefcase,
          href: "/manager/projects",
        },
        { label: "Reports", icon: BarChart3, href: "/manager/reports" },
      ],
      editor: [
        { label: "Submission Queue", icon: FileText, href: "/editor/queue" },
        {
          label: "Review Assignments",
          icon: CheckCircle,
          href: "/editor/reviews",
        },
        { label: "Quality Metrics", icon: BarChart3, href: "/editor/metrics" },
      ],
    };

    const roleActions = actions[userData?.role || "user"] || [];

    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {roleActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="justify-start h-auto py-4"
              onClick={() => navigate(action.href)}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  // Role-specific tabs
  const renderRoleTabs = () => {
    const tabsConfig = {
      admin: [
        { value: "overview", label: "Overview", icon: User },
        { value: "system", label: "System", icon: Settings },
        { value: "users", label: "Users", icon: Users },
        { value: "logs", label: "Logs", icon: Database },
      ],
      user: [
        { value: "overview", label: "Overview", icon: User },
        { value: "papers", label: "My Papers", icon: FileText },
        { value: "reviews", label: "Reviews", icon: CheckCircle },
        { value: "activity", label: "Activity", icon: BarChart3 },
      ],
      manager: [
        { value: "overview", label: "Overview", icon: User },
        { value: "projects", label: "Projects", icon: Briefcase },
        { value: "team", label: "Team", icon: Users },
        { value: "reports", label: "Reports", icon: BarChart3 },
      ],
      editor: [
        { value: "overview", label: "Overview", icon: User },
        { value: "queue", label: "Queue", icon: FileText },
        { value: "reviews", label: "Reviews", icon: CheckCircle },
        { value: "metrics", label: "Metrics", icon: BarChart3 },
      ],
    };

    const tabs = tabsConfig[userData?.role || "user"] || [];

    return (
      <TabsList className="bg-muted/50">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    );
  };

  if (loading || !userData) {
    return (
      <DashboardLayout role={authUser?.role || "user"}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const RoleIcon = roleIcons[userData.role];
  const roleBadge = roleBadges[userData.role];

  return (
    <DashboardLayout role={userData.role} userName={userData.username}>
      <PageTransition>
        <div className="space-y-6">
          {/* Header with Role Badge */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">
                  Profile Settings
                </h1>
                <Badge className={`gap-1 ${roleBadge.color}`}>
                  <RoleIcon className="h-3 w-3" />
                  {roleBadge.label}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {roleConfig[userData.role]?.description ||
                  "Manage your account"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="gap-2 bg-gradient-primary hover:opacity-90"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="gap-2 border-border hover:bg-muted"
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

          {/* Role-specific Stats */}
          {renderRoleStats()}

          {/* Role-specific Actions */}
          {renderRoleActions()}

          <Separator />

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            {renderRoleTabs()}

            {/* Overview Tab - Common for all roles */}
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
                        Your {roleBadge.label.toLowerCase()} profile information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="relative">
                          <Avatar className="h-24 w-24 border-4 border-background shadow-2xl">
                            <AvatarImage src={userData.avatar} />
                            <AvatarFallback className="text-lg bg-gradient-primary text-primary-foreground">
                              {getInitials(userData.username)}
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
                                {userData.username}
                              </h2>
                            )}
                            {isEditing ? (
                              <Input
                                value={userData.title}
                                onChange={(e) =>
                                  setUserData({
                                    ...userData,
                                    title: e.target.value,
                                  })
                                }
                                className="mt-1"
                              />
                            ) : (
                              <p className="text-primary font-medium">
                                {userData.title}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {userData.role === "user" && (
                              <>
                                <Badge variant="outline" className="gap-1">
                                  <FileText className="h-3 w-3" />
                                  {userData.papersSubmitted || 0} papers
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                  <Award className="h-3 w-3" />
                                  h-index: {userData.hIndex || 0}
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  {userData.papersReviewed || 0} reviews
                                </Badge>
                              </>
                            )}
                            {userData.role === "editor" && (
                              <Badge variant="outline" className="gap-1">
                                <Edit className="h-3 w-3" />
                                Content Editor
                              </Badge>
                            )}
                            {userData.role === "admin" && (
                              <Badge variant="outline" className="gap-1">
                                <Shield className="h-3 w-3" />
                                System Administrator
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Rest of the form fields remain the same */}
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
                                {userData.email}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              Affiliation
                            </Label>
                            {isEditing ? (
                              <Input
                                value={userData.affiliation}
                                onChange={(e) =>
                                  setUserData({
                                    ...userData,
                                    affiliation: e.target.value,
                                  })
                                }
                              />
                            ) : (
                              <p className="text-foreground">
                                {userData.affiliation}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              Location
                            </Label>
                            {isEditing ? (
                              <Input
                                value={userData.location}
                                onChange={(e) =>
                                  setUserData({
                                    ...userData,
                                    location: e.target.value,
                                  })
                                }
                              />
                            ) : (
                              <p className="text-foreground">
                                {userData.location}
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
                              {new Date(userData.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              Last Active
                            </Label>
                            <p className="text-foreground">
                              {new Date(userData.lastActive).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">User ID</Label>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {userData.id}
                            </code>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Bio</Label>
                        {isEditing ? (
                          <Textarea
                            value={userData.bio}
                            onChange={(e) =>
                              setUserData({ ...userData, bio: e.target.value })
                            }
                            rows={4}
                            className="min-h-[120px]"
                          />
                        ) : (
                          <p className="text-muted-foreground leading-relaxed">
                            {userData.bio}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Areas of Expertise</Label>
                        <div className="flex flex-wrap gap-2">
                          {isEditing ? (
                            <Input
                              value={userData.expertise.join(", ")}
                              onChange={(e) =>
                                setUserData({
                                  ...userData,
                                  expertise: e.target.value
                                    .split(",")
                                    .map((e) => e.trim()),
                                })
                              }
                              placeholder="Enter expertise separated by commas"
                            />
                          ) : (
                            userData.expertise.map((skill, index) => (
                              <Badge key={index} variant="secondary">
                                {skill}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right sidebar remains the same */}
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

            {/* Add other role-specific tab contents here */}
            {/* For example, System tab for admin, Papers tab for user, etc. */}
          </Tabs>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}

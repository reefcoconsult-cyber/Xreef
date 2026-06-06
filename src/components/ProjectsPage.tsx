import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, X, LifeBuoy, Loader2, Sparkles, LogOut, Image as ImageIcon, Search, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, signInWithGoogle, logOut, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';
import Scene3D from './Scene3D';

interface Project {
  id: string;
  name: string;
  createdAt: number;
  userId: string;
}

const getGradient = (id: string) => {
  const colors = [
    'from-blue-600 to-indigo-600',
    'from-violet-600 to-purple-600',
    'from-fuchsia-600 to-pink-600',
    'from-rose-600 to-red-600',
    'from-orange-600 to-amber-600',
    'from-emerald-600 to-teal-600',
    'from-cyan-600 to-blue-600'
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'صباح الخير';
  if (hour < 18) return 'مساء الخير';
  return 'طاب مساؤك';
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const navigate = useNavigate();

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    if (user) {
      const projectsRef = collection(db, `users/${user.uid}/projects`);
      const qProjects = query(projectsRef, orderBy('createdAt', 'desc'));
      const unsubProjects = onSnapshot(qProjects, (snapshot) => {
        const projectsData: Project[] = [];
        snapshot.forEach((doc) => {
          projectsData.push(doc.data() as Project);
        });
        setProjects(projectsData);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/projects`);
      });

      return () => unsubProjects();
    } else {
      setProjects([]);
    }
  }, [user, isAuthReady]);

  const handleGoogleAuth = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError("حدث خطأ أثناء تسجيل الدخول بحساب Google.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCreateProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newProjectName.trim() || !user) return;

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName.trim(),
      createdAt: Date.now(),
      userId: user.uid
    };

    try {
      await setDoc(doc(db, `users/${user.uid}/projects`, newProject.id), newProject);
      setNewProjectName('');
      setIsModalOpen(false);
      navigate(`/project/${newProject.id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/projects`);
    }
  };

  const deleteProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(project);
  };

  const confirmDelete = async () => {
    if (!projectToDelete || !user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/projects`, projectToDelete.id));
      setProjectToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/projects`);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [projects, searchQuery]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030712] text-white font-cairo flex items-center justify-center overflow-hidden relative" dir="rtl">
        {/* Abstract animated background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(147,51,234,0.15),transparent_50%)]"></div>
        
        <div className="absolute inset-0 z-0 opacity-50 blur-sm mix-blend-screen pointer-events-none">
           <Scene3D className="h-full" showBorder={false} />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/80 to-transparent z-0"></div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-lg w-full px-6"
        >
          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-10 rounded-[2rem] shadow-2xl relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-blue-500/10 p-4 rounded-2xl mb-8 border border-blue-500/20">
                <Sparkles className="w-10 h-10 text-blue-400" />
              </div>
              
              <h1 className="text-4xl font-bold text-white mb-3 text-center tracking-tight">Xreef 1.8</h1>
              <p className="text-gray-400 text-center mb-10 text-lg">منصة توليد الصور المتقدمة بالذكاء الاصطناعي</p>

              {authError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 text-sm text-center font-medium">
                  {authError}
                </motion.div>
              )}

              <button 
                onClick={handleGoogleAuth}
                disabled={isAuthLoading}
                className="w-full relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative bg-[#090b14] border border-white/10 hover:border-white/20 hover:bg-[#0c0f1a] text-white font-semibold py-4 px-6 rounded-2xl transition-all flex justify-center items-center gap-3">
                  {isAuthLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  <span>المتابعة باستخدام حساب Google</span>
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-neutral-100 font-cairo selection:bg-blue-500/30 selection:text-white" dir="rtl">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-30 mix-blend-screen scale-[1.15]">
          <Scene3D className="w-full h-full" showBorder={false} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-[#030712]/50"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
      </div>

      <nav className="sticky top-0 z-40 bg-[#030712]/80 backdrop-blur-xl border-b border-white/[0.05] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Xreef</h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/support')}
              className="hidden sm:flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              <LifeBuoy size={18} /> الدعم
            </button>
            <div className="w-px h-6 bg-white/10 hidden sm:block"></div>
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full border border-white/10" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 text-sm font-bold">
                  {user.displayName?.[0] || user.email?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-semibold">{user.displayName || user.email?.split('@')[0]}</p>
              </div>
              <button 
                onClick={() => logOut()}
                className="p-2 ml-2 text-neutral-400 hover:text-red-400 hover:bg-white/5 rounded-full transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-24 relative z-10">
        
        {/* Welcome Hero */}
        <div className="mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold mb-4 text-white"
            >
              {getGreeting()}، {user.displayName?.split(' ')[0] || 'المبدع'} <span className="opacity-70">✨</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-neutral-400 text-lg"
            >
              مرحباً بك في مساحة عملك. أنشئ مشاريع جديدة واكتشف إمكانيات غير محدودة مع Xreef.
            </motion.p>
          </div>
          
          <div className="w-full md:w-1/3 flex md:justify-end">
             {/* Engine Status */}
             <div className="px-5 py-3 rounded-2xl border border-white/10 shadow-lg bg-black/20 backdrop-blur-md inline-flex items-center">
                <div className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_12px_#10b981] animate-pulse"></div>
                   <span className="text-sm font-bold text-white uppercase tracking-widest">المحرك متصل</span>
                </div>
             </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <div className="relative w-full sm:w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input 
              type="text"
              placeholder="البحث في المشاريع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-full py-3 pr-12 pl-4 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="bg-[#0a0a0a] border border-white/10 p-1 rounded-full flex items-center">
                 <button className="px-5 py-2 bg-white/10 rounded-full text-white text-sm font-medium shadow-sm transition-colors flex items-center gap-2">
                    <LayoutGrid size={16} /> الشبكة
                 </button>
             </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {/* Create New Project Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            <div className="h-48 rounded-[2rem] bg-gradient-to-br from-blue-500/[0.05] to-purple-500/[0.05] border-2 border-dashed border-white/20 group-hover:border-blue-500/50 group-hover:bg-blue-500/[0.05] flex flex-col items-center justify-center transition-all duration-300">
              <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all duration-300 mb-4">
                <Plus size={28} className="text-neutral-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <h3 className="font-bold text-lg text-neutral-300 group-hover:text-white transition-colors">إنشاء مشروع</h3>
            </div>
          </motion.div>

          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="group relative cursor-pointer flex flex-col"
              >
                <div className={`h-36 rounded-t-[2xl] bg-gradient-to-br ${getGradient(project.id)} p-5 flex items-end justify-between overflow-hidden relative`}>
                   <div className="absolute top-0 right-0 w-full h-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
                     <button 
                      onClick={(e) => deleteProject(project, e)} 
                      className="p-2.5 bg-black/50 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-colors"
                      title="حذف المشروع"
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                   <ImageIcon className="w-16 h-16 text-white/20 absolute -bottom-4 -right-4 rotate-12" />
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 border-t-0 p-5 rounded-b-[2xl] flex-1 flex flex-col justify-between group-hover:bg-white/[0.03] transition-colors relative z-10">
                  <h2 className="font-bold text-lg text-white mb-2 truncate" title={project.name}>{project.name}</h2>
                  <p className="text-xs text-neutral-500 font-medium">
                    {new Date(project.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {searchQuery && filteredProjects.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
               <Search className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">لا توجد نتائج</h3>
            <p className="text-neutral-400">لم يتم العثور على مشاريع تطابق "{searchQuery}"</p>
          </div>
        )}

      </main>

      {/* Create Project Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">مشروع جديد</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-neutral-500 hover:bg-white/10 hover:text-white rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreateProject}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-400 mb-2">الاسم</label>
                    <input 
                      autoFocus
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="لعبة الخيال، صور تسويقية..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-white placeholder-neutral-600 font-medium"
                    />
                  </div>
                  <div className="pt-2">
                    <button 
                      type="submit"
                      disabled={!newProjectName.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex justify-center items-center gap-2"
                    >
                      <Plus size={20} />
                      إنشاء مساحة العمل
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {projectToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProjectToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl -z-10 rounded-full"></div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="text-red-500" size={28} />
                </div>
                <h2 className="text-xl font-bold mb-3 text-white">حذف المشروع؟</h2>
                <p className="text-neutral-400 mb-8 leading-relaxed">
                  هل أنت متأكد من حذف مشروع <span className="text-white font-semibold block mt-1">"{projectToDelete.name}"</span>
                  سيتم التخلص منه نهائياً بما يحتويه.
                </p>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setProjectToDelete(null)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-2xl transition-colors border border-white/5"
                  >
                    تراجع
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-red-900/20"
                  >
                    نعم، احذف
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

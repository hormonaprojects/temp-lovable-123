
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Shield, ShieldCheck, Trash2, Mail } from 'lucide-react';
import { fetchAllUsers, assignAdminRole, removeAdminRole, AdminUserOverview } from '@/services/adminQueries';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface RolesManagementProps {
  currentUser: User;
}

export function RolesManagement({ currentUser }: RolesManagementProps) {
  const [users, setUsers] = useState<AdminUserOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [emailToAssign, setEmailToAssign] = useState('');
  const [assigning, setAssigning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await fetchAllUsers();
      setUsers(usersData);
    } catch (error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a felhasználókat.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAdmin = async () => {
    if (!emailToAssign.trim()) {
      toast({
        title: "Hiba",
        description: "Kérlek add meg az email címet.",
        variant: "destructive"
      });
      return;
    }

    try {
      setAssigning(true);
      await assignAdminRole(emailToAssign, currentUser.id);
      
      toast({
        title: "Siker",
        description: `Admin jogosultság sikeresen kiosztva: ${emailToAssign}`,
      });
      
      setEmailToAssign('');
      setAssignModalOpen(false);
      await loadUsers(); // Frissítjük a listát
    } catch (error: any) {
      toast({
        title: "Hiba",
        description: error.message || "Nem sikerült kiosztani az admin jogosultságot.",
        variant: "destructive"
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAdmin = async (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      toast({
        title: "Hiba",
        description: "Nem vonhatod meg a saját admin jogosultságodat.",
        variant: "destructive"
      });
      return;
    }

    try {
      await removeAdminRole(userId);
      
      toast({
        title: "Siker",
        description: `Admin jogosultság sikeresen megvonva: ${userName}`,
      });
      
      await loadUsers(); // Frissítjük a listát
    } catch (error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült megvonni az admin jogosultságot.",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU');
  };

  const adminUsers = users.filter(user => user.role === 'admin');
  const regularUsers = users.filter(user => user.role !== 'admin');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Szerepkörök betöltése...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Szerepkörök kezelése</h2>
          <p className="text-white/70">Admin jogosultságok kiosztása és kezelése</p>
        </div>
        
        <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Admin kinevezése
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/20 text-white">
            <DialogHeader>
              <DialogTitle>Admin jogosultság kiosztása</DialogTitle>
              <DialogDescription className="text-white/70">
                Add meg annak a felhasználónak az email címét, akinek admin jogosultságot szeretnél adni.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/70 block mb-2">Email cím</label>
                <Input
                  type="email"
                  placeholder="felhasznalo@example.com"
                  value={emailToAssign}
                  onChange={(e) => setEmailToAssign(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAssignModalOpen(false)}
                className="border-white/30 text-white hover:bg-white/10"
              >
                Mégse
              </Button>
              <Button
                onClick={handleAssignAdmin}
                disabled={assigning}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {assigning ? 'Kiosztás...' : 'Admin kinevezése'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statisztikák */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Összes felhasználó</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Adminisztrátorok</p>
                <p className="text-2xl font-bold">{adminUsers.length}</p>
              </div>
              <ShieldCheck className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Sima felhasználók</p>
                <p className="text-2xl font-bold">{regularUsers.length}</p>
              </div>
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin felhasználók */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            Adminisztrátorok ({adminUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {adminUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-white/70">Felhasználó</TableHead>
                    <TableHead className="text-white/70">Email</TableHead>
                    <TableHead className="text-white/70">Admin lett</TableHead>
                    <TableHead className="text-white/70">Műveletek</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((user) => (
                    <TableRow key={user.id} className="border-white/20 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 border border-white/30">
                            <AvatarImage src={user.avatar_url || undefined} alt="Avatar" />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xs font-bold">
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{user.full_name || 'Nincs név'}</p>
                            <Badge className="bg-purple-600 text-white text-xs">
                              Administrator
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-white/70">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-white/70">
                        {formatDate(user.user_created_at)}
                      </TableCell>
                      <TableCell>
                        {user.id !== currentUser.id ? (
                          <Button
                            onClick={() => handleRemoveAdmin(user.id, user.full_name || user.email)}
                            size="sm"
                            variant="outline"
                            className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Jogosultság megvonása
                          </Button>
                        ) : (
                          <Badge variant="outline" className="border-green-400/30 text-green-400">
                            Te vagy
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-white/70">
              Nincsenek admin felhasználók.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sima felhasználók (első 10) */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            Felhasználók (első 10 a {regularUsers.length}-ból)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {regularUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-white/70">Felhasználó</TableHead>
                    <TableHead className="text-white/70">Email</TableHead>
                    <TableHead className="text-white/70">Regisztráció</TableHead>
                    <TableHead className="text-white/70">Aktivitás</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regularUsers.slice(0, 10).map((user) => (
                    <TableRow key={user.id} className="border-white/20 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 border border-white/30">
                            <AvatarImage src={user.avatar_url || undefined} alt="Avatar" />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{user.full_name || 'Nincs név'}</p>
                            <Badge variant="secondary" className="bg-gray-600 text-white text-xs">
                              Felhasználó
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-white/70">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-white/70">
                        {formatDate(user.user_created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="text-white/70 text-sm">
                          <p>🍽️ {user.preferences_count} preferencia</p>
                          <p>❤️ {user.favorites_count} kedvenc</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-white/70">
              Nincsenek felhasználók.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

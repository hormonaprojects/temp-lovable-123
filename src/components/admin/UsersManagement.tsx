
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, Shield, ShieldCheck, Calendar, Heart, Settings2 } from 'lucide-react';
import { fetchAllUsers, searchUsers, getUserDetails, AdminUserOverview } from '@/services/adminQueries';
import { useToast } from '@/hooks/use-toast';

export function UsersManagement() {
  const [users, setUsers] = useState<AdminUserOverview[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUserOverview[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch();
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await fetchAllUsers();
      setUsers(usersData);
      setFilteredUsers(usersData);
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

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    try {
      const searchResults = await searchUsers(searchTerm);
      setFilteredUsers(searchResults);
    } catch (error) {
      toast({
        title: "Keresési hiba",
        description: "Nem sikerült végrehajtani a keresést.",
        variant: "destructive"
      });
    }
  };

  const viewUserDetails = async (userId: string) => {
    try {
      const userDetails = await getUserDetails(userId);
      setSelectedUser(userDetails);
      setShowUserModal(true);
    } catch (error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a felhasználó adatait.",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Felhasználók betöltése...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header és keresés */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Felhasználók kezelése</h2>
          <p className="text-white/70">Összes felhasználó: {users.length}</p>
        </div>
        
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Keresés email vagy név alapján..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
        </div>
      </div>

      {/* Statisztikák */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm text-white/70">Adminok</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
              </div>
              <ShieldCheck className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Aktív felhasználók</p>
                <p className="text-2xl font-bold">{users.filter(u => u.preferences_count > 0).length}</p>
              </div>
              <Settings2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Kedvencekkel</p>
                <p className="text-2xl font-bold">{users.filter(u => u.favorites_count > 0).length}</p>
              </div>
              <Heart className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Felhasználók táblázat */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Felhasználók listája</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/20">
                  <TableHead className="text-white/70">Felhasználó</TableHead>
                  <TableHead className="text-white/70">Szerepkör</TableHead>
                  <TableHead className="text-white/70">Regisztráció</TableHead>
                  <TableHead className="text-white/70">Aktivitás</TableHead>
                  <TableHead className="text-white/70">Műveletek</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
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
                          <p className="text-white/60 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={
                        user.role === 'admin' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-600 text-white'
                      }>
                        {user.role === 'admin' ? 'Admin' : 'Felhasználó'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/70">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(user.user_created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-white/70 text-sm">
                        <p>🍽️ {user.preferences_count} preferencia</p>
                        <p>❤️ {user.favorites_count} kedvenc</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => viewUserDetails(user.id)}
                        size="sm"
                        variant="outline"
                        className="text-white border-white/30 hover:bg-white/10"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Részletek
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-white/70">
              {searchTerm ? 'Nincs találat a keresésre.' : 'Nincsenek felhasználók.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Felhasználó részletek modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-900 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Felhasználó részletei</DialogTitle>
            <DialogDescription className="text-white/70">
              Teljes profil és aktivitás áttekintése
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* Alapadatok */}
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Profil információk
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-white/70">Név</p>
                      <p className="text-white">{selectedUser.user.full_name || 'Nincs megadva'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Email</p>
                      <p className="text-white">{selectedUser.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Kor</p>
                      <p className="text-white">{selectedUser.user.age || 'Nincs megadva'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Súly</p>
                      <p className="text-white">{selectedUser.user.weight ? `${selectedUser.user.weight} kg` : 'Nincs megadva'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Magasság</p>
                      <p className="text-white">{selectedUser.user.height ? `${selectedUser.user.height} cm` : 'Nincs megadva'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Aktivitási szint</p>
                      <p className="text-white">{selectedUser.user.activity_level || 'Nincs megadva'}</p>
                    </div>
                  </div>
                  
                  {selectedUser.user.dietary_preferences && selectedUser.user.dietary_preferences.length > 0 && (
                    <div>
                      <p className="text-sm text-white/70 mb-2">Étkezési preferenciák</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.user.dietary_preferences.map((pref: string, index: number) => (
                          <Badge key={index} variant="outline" className="border-white/30 text-white">
                            {pref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedUser.user.allergies && selectedUser.user.allergies.length > 0 && (
                    <div>
                      <p className="text-sm text-white/70 mb-2">Allergiák</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.user.allergies.map((allergy: string, index: number) => (
                          <Badge key={index} variant="destructive" className="bg-red-600">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Kedvencek */}
              {selectedUser.favorites.length > 0 && (
                <Card className="bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-400" />
                      Kedvenc receptek ({selectedUser.favorites.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedUser.favorites.map((favorite: any) => (
                        <div key={favorite.id} className="flex justify-between items-center p-2 bg-white/5 rounded">
                          <span className="text-white">{favorite.recipe_name}</span>
                          <span className="text-white/60 text-sm">{formatDate(favorite.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Preferenciák */}
              {selectedUser.preferences.length > 0 && (
                <Card className="bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings2 className="w-5 h-5 text-green-400" />
                      Étel preferenciák ({selectedUser.preferences.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedUser.preferences.map((preference: any) => (
                        <div key={preference.id} className="flex justify-between items-center p-2 bg-white/5 rounded">
                          <div className="text-white">
                            <span className="font-medium">{preference.ingredient}</span>
                            <span className="text-white/60 ml-2">({preference.category})</span>
                          </div>
                          <Badge 
                            variant={preference.preference === 'szeretem' ? 'default' : preference.preference === 'nem_szeretem' ? 'destructive' : 'secondary'}
                            className={
                              preference.preference === 'szeretem' ? 'bg-green-600' :
                              preference.preference === 'nem_szeretem' ? 'bg-red-600' : 'bg-gray-600'
                            }
                          >
                            {preference.preference === 'szeretem' ? '❤️ Szeretem' : 
                             preference.preference === 'nem_szeretem' ? '❌ Nem szeretem' : '😐 Semleges'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

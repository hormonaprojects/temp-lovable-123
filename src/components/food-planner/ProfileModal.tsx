
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface ProfileModalProps {
  user: User;
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ user, open, onClose }: ProfileModalProps) {
  const { toast } = useToast();

  const handleChangePassword = () => {
    toast({
      title: "Fejlesztés alatt",
      description: "Jelszó változtatás funkció hamarosan elérhető lesz.",
    });
  };

  const handleDeleteAccount = () => {
    if (confirm('⚠️ FIGYELEM! Ez véglegesen törli a fiókodat és minden adatodat.\n\nBiztosan folytatod?')) {
      if (confirm('Utolsó figyelmeztetés! Ez a művelet visszavonhatatlan.\n\nTöröljem a fiókodat?')) {
        toast({
          title: "Fejlesztés alatt",
          description: "Fiók törlése funkció hamarosan elérhető lesz.",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            👤 Felhasználói profil
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Info */}
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="font-semibold text-gray-700">Név:</span>
              <span className="text-gray-600">{user.fullName}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b">
              <span className="font-semibold text-gray-700">Email:</span>
              <span className="text-gray-600">{user.email}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b">
              <span className="font-semibold text-gray-700">Regisztráció:</span>
              <span className="text-gray-600">-</span>
            </div>
            
            <div className="flex justify-between items-center py-3">
              <span className="font-semibold text-gray-700">Utolsó bejelentkezés:</span>
              <span className="text-gray-600">Most</span>
            </div>
          </div>

          {/* Profile Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleChangePassword}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              🔑 Jelszó változtatás
            </Button>
            
            <Button
              onClick={handleDeleteAccount}
              variant="destructive"
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              🗑️ Fiók törlése
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

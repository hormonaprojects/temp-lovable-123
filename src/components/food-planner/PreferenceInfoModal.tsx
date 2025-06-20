
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, X, ThumbsUp, ThumbsDown } from "lucide-react";

interface PreferenceInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function PreferenceInfoModal({ isOpen, onClose, onComplete }: PreferenceInfoModalProps) {
  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            Hogyan jelöld meg a preferenciáidat?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Szeretem */}
          <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <ThumbsUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800 mb-2">Szeretem</h3>
              <p className="text-green-700 text-sm">
                Azokat az alapanyagokat jelöld meg, amelyeket szeretsz és szívesen fogyasztasz. Ezekből több receptet fogsz kapni.
              </p>
            </div>
          </div>

          {/* Nem szeretem / Allergia */}
          <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <ThumbsDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800 mb-2">Nem szeretem / Allergia</h3>
              <p className="text-red-700 text-sm">
                Azokat az alapanyagokat jelöld meg, amelyeket nem szeretsz, vagy amelyekre allergiád/intoleranciád van. Ezeket az alapanyagokat tartalmazó recepteket nem fogunk ajánlani.
              </p>
            </div>
          </div>

          {/* Semleges / Nem tudom */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
              <X className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Semleges / Nem tudom</h3>
              <p className="text-gray-700 text-sm">
                Ha nem jelölsz meg semmit egy alapanyagnál, azt semlegesnek tekintjük. Ezek az alapanyagok szerepelhetnek a receptekben, de nem fogunk aktívan keresni őket.
              </p>
            </div>
          </div>

          {/* Fontos megjegyzés */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <div>
                <h4 className="font-semibold text-amber-800 mb-1">Fontos megjegyzés</h4>
                <p className="text-amber-700 text-sm">
                  Ha allergiád vagy intoleranciád van valamilyen alapanyagra, mindenképpen jelöld meg "Nem szeretem" gombbal, hogy biztonosan elkerüljük ezeket a receptekben.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6"
          >
            Megoszlás leállítása
          </Button>
          <Button
            onClick={handleComplete}
            className="px-6 bg-green-600 hover:bg-green-700 text-white"
          >
            Beállítás befejezve!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

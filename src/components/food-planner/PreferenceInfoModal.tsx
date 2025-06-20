
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ThumbsUp, ThumbsDown, Heart, AlertTriangle } from "lucide-react";

interface PreferenceInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PreferenceInfoModal({ isOpen, onClose }: PreferenceInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Hogyan jelöld meg a preferenciáidat?
          </h2>
          <p className="text-gray-600">
            Segítünk beállítani az ételpreferenciáidat
          </p>
        </div>

        {/* Instructions */}
        <div className="space-y-6">
          {/* Like Section */}
          <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <ThumbsUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800 mb-1">Szeretem</h3>
              <p className="text-sm text-green-700">
                Azokat az alapanyagokat jelöld meg, amelyeket szeretsz és szívesen fogyasztasz. 
                Ezekből több receptet fogsz kapni.
              </p>
            </div>
          </div>

          {/* Dislike Section */}
          <div className="flex items-start gap-4 p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
              <ThumbsDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800 mb-1">Nem szeretem / Allergia</h3>
              <p className="text-sm text-red-700">
                Azokat az alapanyagokat jelöld meg, amelyeket nem szeretsz, vagy amelyekre allergiád/intoleranciád van. 
                Ezeket az alapanyagokat tartalmazó recepteket nem fogjuk ajánlani.
              </p>
            </div>
          </div>

          {/* Neutral Section */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-10 h-10 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Semleges / Nem tudom</h3>
              <p className="text-sm text-gray-700">
                Ha nem jelölsz meg semmit egy alapanyagnál, azt semlegesnek tekintjük. 
                Ezek az alapanyagok szerepelhetnek a receptekben.
              </p>
            </div>
          </div>

          {/* Special Note for Allergies */}
          <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">Fontos megjegyzés</h3>
              <p className="text-sm text-yellow-700">
                Ha allergiád vagy intoleranciád van valamilyen alapanyagra, 
                mindenképpen jelöld meg "Nem szeretem" gombbal, hogy biztosan elkerüljük ezeket a receptekben.
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Értem, kezdjük el!
          </Button>
        </div>
      </div>
    </div>
  );
}

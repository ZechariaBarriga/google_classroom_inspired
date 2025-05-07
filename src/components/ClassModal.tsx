// components/ClassModal.tsx
import React from "react";

type ModalProps = {
   children: React.ReactNode;
   onClose: () => void;
};

const ClassModal: React.FC<ModalProps> = ({ children, onClose }) => {
   return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
         <div className="bg-white p-6 rounded-lg w-96 relative">
            <button
               className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
               onClick={onClose}
            >
               &times;
            </button>
            {children}
         </div>
      </div>
   );
};

export default ClassModal;

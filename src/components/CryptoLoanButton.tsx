
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import CryptoLoanModal from "./CryptoLoanModal";
import { Bitcoin, Zap } from "lucide-react";

export const CryptoLoanButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
      >
        <Bitcoin className="mr-2 h-4 w-4" />
        <Zap className="mr-1 h-3 w-3" />
        Create Crypto Loan
      </Button>
      
      <CryptoLoanModal 
        open={isOpen} 
        onOpenChange={setIsOpen} 
      />
    </>
  );
};

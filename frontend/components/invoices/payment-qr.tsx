"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { useBusinessProfile } from "@/hooks/use-business-profile";

interface PaymentQRProps {
  amount: number;
  invoiceNumber: string;
}

export function PaymentQR({ amount, invoiceNumber }: PaymentQRProps) {
  const { data: profile } = useBusinessProfile();
  const [qrSrc, setQrSrc] = useState<string>("");

  useEffect(() => {
    if (profile?.upi_id && amount) {
      // upi://pay?pa={upi_id}&pn={business_name}&am={amount}&cu=INR&tn=Invoice-{invoice_number}
      const upiString = `upi://pay?pa=${profile.upi_id}&pn=${encodeURIComponent(profile.business_name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Invoice-${invoiceNumber}`)}`;
      
      QRCode.toDataURL(upiString, { width: 200, margin: 1 })
        .then(url => setQrSrc(url))
        .catch(err => console.error(err));
    }
  }, [profile, amount, invoiceNumber]);

  if (!profile?.upi_id) return null;

  return (
    <div className="flex flex-col items-center p-4 border rounded-lg bg-white">
      <h3 className="text-sm font-semibold mb-2 text-slate-800">Pay via UPI</h3>
      {qrSrc ? (
        <Image src={qrSrc} alt="UPI QR Code" width={128} height={128} className="w-32 h-32" />
      ) : (
        <div className="w-32 h-32 bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400">Loading QR...</div>
      )}
      <p className="text-xs text-slate-500 mt-2">{profile.upi_id}</p>
    </div>
  );
}
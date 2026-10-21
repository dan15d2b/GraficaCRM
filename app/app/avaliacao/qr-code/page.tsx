/**
 * CRMGráfica 2.0 — QR Code para Avaliação Google
 * 
 * Tela para gerar e imprimir QR Code do link de avaliação
 */
"use client";

import { useState, useEffect } from "react";
import { Printer, Copy, Check } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function QRCODEPage() {
  const [reviewLink, setReviewLink] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar configurações da empresa
    fetch("/api/settings/theme")
      .then((res) => res.json())
      .then((data) => {
        setReviewLink(data.review_link || "https://reviews.google.com");
        setCompanyName(data.company_name || "Minha Gráfica");
      })
      .catch(() => {
        setReviewLink("https://reviews.google.com");
      })
      .finally(() => setLoading(false));
  }, []);

  function handleCopy() {
    navigator.clipboard.writeText(reviewLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">QR Code de Avaliação</h1>
        <p className="text-sm text-gray-500 mt-1">
          Imprima e coloque no balcão para clientes avaliarem
        </p>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 flex flex-col items-center">
        <QRCodeCanvas
          value={reviewLink}
          size={256}
          level="H"
          includeMargin
          fgColor="#000000"
          bgColor="#ffffff"
        />
        <div className="mt-6 text-center">
          <p className="text-lg font-semibold text-gray-900">{companyName}</p>
          <p className="text-sm text-gray-500 mt-1">Avalie nosso atendimento!</p>
        </div>
      </div>

      {/* Link */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Link de Avaliação
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={reviewLink}
            onChange={(e) => setReviewLink(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Cole este link na aba do navegador ou imprima o QR code acima
        </p>
      </div>

      {/* Ações */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
      </div>

      {/* CSS para impressão */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-only,
          .print-only * {
            visibility: visible;
          }
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

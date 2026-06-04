import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '@/api/client';
import { formatDate } from '@/lib/utils';

export default function CertificateView() {
  const { id } = useParams();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiClient.get(`/certificates/${id}`).then((res) => {
      setCert(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (cert) {
      setTimeout(() => window.print(), 500);
    }
  }, [cert]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-[#0b6e4f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Certificate not found.</p>
      </div>
    );
  }

  const style = `
    @page { margin: 20mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  `;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <style>{style}</style>
      <div className="no-print text-center mb-4">
        <button onClick={() => window.print()} className="px-4 py-2 bg-[#0b6e4f] text-white rounded-lg hover:bg-[#08573e] mr-2">Print</button>
        <button onClick={() => window.close()} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Close</button>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white shadow-lg p-8 print:shadow-none" style={{ fontFamily: 'Times New Roman, serif' }}>
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wide">Alyssa Wellness & Medical Clinic</h1>
          <p className="text-sm text-gray-600 mt-1">Medical Certificate</p>
        </div>

        <p className="text-right text-sm text-gray-500 mb-6">
          Date Issued: {formatDate(cert.issued_at, 'long')}
        </p>

        <p className="mb-4">TO WHOM IT MAY CONCERN:</p>

        <p className="mb-4 leading-relaxed">
          This is to certify that <strong>{cert.patient_name}</strong>
          {cert.gender ? ` (${cert.gender})` : ''}
          {cert.date_of_birth ? `, born on ${formatDate(cert.date_of_birth)}` : ''}
          , has been examined and evaluated by the undersigned physician.
        </p>

        <div className="mb-4">
          <p className="font-semibold">Diagnosis / Findings:</p>
          <p className="leading-relaxed whitespace-pre-wrap ml-4">{cert.diagnosis}</p>
        </div>

        {cert.rest_from && cert.rest_to && (
          <div className="mb-4">
            <p className="font-semibold">Medical Rest / Excuse:</p>
            <p className="ml-4">
              The patient is advised to rest from <strong>{formatDate(cert.rest_from)}</strong> to <strong>{formatDate(cert.rest_to)}</strong>.
            </p>
          </div>
        )}

        {cert.restrictions && (
          <div className="mb-4">
            <p className="font-semibold">Restrictions / Recommendations:</p>
            <p className="leading-relaxed whitespace-pre-wrap ml-4">{cert.restrictions}</p>
          </div>
        )}

        {cert.notes && (
          <div className="mb-4">
            <p className="font-semibold">Additional Notes:</p>
            <p className="leading-relaxed whitespace-pre-wrap ml-4">{cert.notes}</p>
          </div>
        )}

        <div className="mt-10 text-right">
          <p className="font-bold text-lg">{cert.doctor_name}</p>
          <p className="text-sm text-gray-600">{cert.specialization}</p>
          <div className="mt-16 border-t border-gray-400 w-64 ml-auto pt-1">
            <p className="text-xs text-gray-500 text-center">Signature Over Printed Name</p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
          <p>Alyssa Wellness & Medical Clinic | This certificate is valid only with the doctor's signature and clinic stamp.</p>
        </div>
      </div>
    </div>
  );
}

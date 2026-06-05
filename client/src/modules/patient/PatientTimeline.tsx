import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Tag, Button, Notification, useToaster } from 'rsuite';
import { formatDateDDMMYYYY, formatTimeHHMM, formatCurrency } from '@/lib/utils';

interface TimelineItem {
  type: 'appointment' | 'invoice' | 'payment' | 'certificate';
  date: string;
  data: any;
}

export default function PatientTimeline() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toaster = useToaster();
  const [patientName, setPatientName] = useState('');
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get(`/patients/${id}`),
      apiClient.get(`/patients/${id}/timeline`),
    ]).then(([pRes, tRes]) => {
      const p = pRes.data;
      setPatientName(`${p.first_name} ${p.last_name}`);
      setTimeline(tRes.data.timeline);
    }).catch(() => {
      toaster.push(<Notification type="error" header="Error">Failed to load patient history</Notification>, { placement: 'topEnd' });
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">Patient History</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{patientName}</p>
        </div>
        <Button appearance="default" onClick={() => navigate(-1)}>Back</Button>
      </div>

      {timeline.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No records found for this patient</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-4">
            {timeline.map((item, idx) => (
              <div key={`${item.type}-${item.data.id}-${idx}`} className="relative pl-14">
                <div className={`absolute left-3 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
                  item.type === 'appointment' ? 'bg-blue-500' :
                  item.type === 'invoice' ? 'bg-amber-500' :
                  item.type === 'payment' ? 'bg-green-500' : 'bg-purple-500'
                }`} />
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Tag color={
                      item.type === 'appointment' ? 'blue' :
                      item.type === 'invoice' ? 'orange' :
                      item.type === 'payment' ? 'green' : 'violet'
                    }>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Tag>
                    <span className="text-xs text-gray-400">{formatDateDDMMYYYY(item.date)}</span>
                  </div>

                  {item.type === 'appointment' && (
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-50">{item.data.reason}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.data.doctor_name && `Dr. ${item.data.doctor_name} · `}
                        {item.data.time && formatTimeHHMM(item.data.time)} · {item.data.status}
                      </p>
                      {item.data.notes && <p className="text-xs text-gray-400 mt-1">{item.data.notes}</p>}
                    </div>
                  )}

                  {item.type === 'invoice' && (
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-50">{formatCurrency(item.data.total)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Balance: {formatCurrency(item.data.balance)} · {item.data.status}
                      </p>
                      {item.data.items?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {item.data.items.map((li: any, i: number) => (
                            <p key={i} className="text-xs text-gray-400">{li.description}: {formatCurrency(li.total)}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {item.type === 'payment' && (
                    <div>
                      <p className="font-medium text-green-600 dark:text-green-400">{formatCurrency(item.data.amount)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.data.payment_method}
                        {item.data.invoice_number && ` · Invoice #${item.data.invoice_number}`}
                      </p>
                    </div>
                  )}

                  {item.type === 'certificate' && (
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-50">{item.data.diagnosis}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.data.issued_by_name && `Issued by: ${item.data.issued_by_name}`}
                        {item.data.rest_from && ` · Rest: ${formatDateDDMMYYYY(item.data.rest_from)}`}
                        {item.data.rest_to && ` - ${formatDateDDMMYYYY(item.data.rest_to)}`}
                      </p>
                      {item.data.restrictions && <p className="text-xs text-gray-400 mt-1">{item.data.restrictions}</p>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
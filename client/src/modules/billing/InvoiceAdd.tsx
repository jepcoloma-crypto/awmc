import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Button, Input, SelectPicker, DatePicker, Table, Notification, useToaster } from 'rsuite';
import { formatCurrency } from '@/lib/utils';
import type { Patient, Service } from '@/types';

const { Column, Cell } = Table;

interface LineItem {
  service_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function InvoiceAdd() {
  const navigate = useNavigate();
  const toaster = useToaster();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get('/patients'),
      apiClient.get('/services'),
    ]).then(([pRes, sRes]) => {
      setPatients(pRes.data.data);
      setServices(sRes.data.data);
    });
  }, []);

  const addItem = (serviceId: number) => {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    if (items.some((i) => i.service_id === serviceId)) return;
    setItems([...items, { service_id: svc.id, description: svc.name, quantity: 1, unit_price: svc.price, total: svc.price }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, key: string, value: number) => {
    const newItems = [...items];
    (newItems[idx] as any)[key] = value;
    newItems[idx].total = newItems[idx].quantity * newItems[idx].unit_price;
    setItems(newItems);
  };

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientId || items.length === 0) {
      toaster.push(<Notification type="error" header="Error">Select patient and add at least one item</Notification>, { placement: 'topEnd' });
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/billing', {
        patient_id: patientId,
        due_date: dueDate,
        notes,
        items,
        subtotal,
        tax,
        total,
      });
      toaster.push(<Notification type="success" header="Success">Invoice created</Notification>, { placement: 'topEnd' });
      navigate('/billing');
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to create invoice</Notification>, { placement: 'topEnd' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">New Invoice</h2>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Patient" required>
            <SelectPicker
              data={patients.map((p) => ({ label: `${p.first_name} ${p.last_name} (${p.patient_id})`, value: p.id }))}
              value={patientId as any}
              onChange={(v) => setPatientId(v as any)}
              className="w-full"
              searchable
            />
          </FormField>
          <FormField label="Due Date">
            <DatePicker className="w-full" value={dueDate ? new Date(dueDate) : null} onChange={(v) => setDueDate(v ? v.toISOString().split('T')[0] : '')} oneTap />
          </FormField>
          <FormField label="Notes">
            <Input value={notes} onChange={setNotes} />
          </FormField>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Invoice Items</h4>
            <SelectPicker
              data={services.map((s) => ({ label: `${s.name} - ${formatCurrency(s.price)}`, value: s.id }))}
              placeholder="+ Add service"
              onChange={(v) => { if (v) addItem(v); }}
              className="w-64"
            />
          </div>
          <Table data={items} autoHeight rowHeight={48}>
            <Column width={200} flexGrow={1}>
              <Table.HeaderCell>Description</Table.HeaderCell>
              <Cell>{(rowData: LineItem) => rowData.description}</Cell>
            </Column>
            <Column width={100}>
              <Table.HeaderCell>Qty</Table.HeaderCell>
              <Cell>{(rowData: LineItem, _idx: number | undefined) => {
                const idx = _idx ?? 0;
                return <Input type="number" min={1} value={rowData.quantity} onChange={(v) => updateItem(idx, 'quantity', Number(v) || 1)} style={{ width: 60 }} />;
              }}</Cell>
            </Column>
            <Column width={120}>
              <Table.HeaderCell>Unit Price</Table.HeaderCell>
              <Cell>{(rowData: LineItem) => formatCurrency(rowData.unit_price)}</Cell>
            </Column>
            <Column width={120}>
              <Table.HeaderCell>Total</Table.HeaderCell>
              <Cell>{(rowData: LineItem) => formatCurrency(rowData.total)}</Cell>
            </Column>
            <Column width={60} align="center">
              <Table.HeaderCell>{''}</Table.HeaderCell>
              <Cell>{(rowData: LineItem, _idx: number | undefined) => {
                const idx = _idx ?? 0;
                return <Button size="sm" appearance="link" color="red" onClick={() => removeItem(idx)}>×</Button>;
              }}</Cell>
            </Column>
          </Table>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex flex-col items-end space-y-1 text-sm">
            <div className="flex justify-between w-64">
              <span className="text-gray-500 dark:text-gray-300">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between w-64">
              <span className="text-gray-500 dark:text-gray-300">Tax (10%):</span>
              <span className="font-medium">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between w-64 text-lg font-bold text-gray-800 dark:text-gray-100">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button appearance="primary" type="submit" loading={saving}>Create Invoice</Button>
          <Button appearance="default" onClick={() => navigate('/billing')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Button, Input, SelectPicker, DatePicker, Modal, Table, Notification, useToaster } from 'rsuite';
import { formatCurrency, toLocalDateString } from '@/lib/utils';
import type { Patient, Service, PatientProcedure, ProcedureType } from '@/types';

const { Column, Cell } = Table;

interface LineItem {
  service_id?: number;
  procedure_id?: number;
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
  const [inventory, setInventory] = useState<any[]>([]);
  const [procedureTypes, setProcedureTypes] = useState<ProcedureType[]>([]);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [patientProcedures, setPatientProcedures] = useState<PatientProcedure[]>([]);
  const [items, setItems] = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [showNewProc, setShowNewProc] = useState(false);
  const [procForm, setProcForm] = useState({ procedure_type_id: '' as string | number, procedure_date: '', notes: '' });
  const [addingProc, setAddingProc] = useState(false);
  const [patientDoctors, setPatientDoctors] = useState<{ id: number; first_name: string; last_name: string }[]>([]);
  const [showDocFee, setShowDocFee] = useState(false);
  const [docFeeForm, setDocFeeForm] = useState({ doctor_id: null as number | null, fee: 0 });
  const [showMedicine, setShowMedicine] = useState(false);
  const [medicineForm, setMedicineForm] = useState({ name: '', quantity: 1, price: 0 });

  useEffect(() => {
    Promise.all([
      apiClient.get('/patients'),
      apiClient.get('/services'),
      apiClient.get('/procedure-types'),
      apiClient.get('/inventory'),
    ]).then(([pRes, sRes, ptRes, iRes]) => {
      setPatients(pRes.data.data);
      setServices(sRes.data.data);
      setProcedureTypes(ptRes.data.data);
      setInventory(iRes.data.data);
    });
  }, []);

  const addProcedureToItems = (proc: PatientProcedure) => {
    if (items.some((i) => i.procedure_id === proc.id)) return;
    const name = proc.procedure_name || `Procedure #${proc.id}`;
    const fee = Number(proc.fee);
    setItems((prev) => [...prev, { procedure_id: proc.id, description: `${name} (${proc.procedure_date})`, quantity: 1, unit_price: fee, total: fee }]);
  };

  const handlePatientChange = async (v: number | null) => {
    setPatientId(v);
    setItems([]);
    if (v) {
      try {
        const res = await apiClient.get(`/patients/${v}`);
        const procs: PatientProcedure[] = res.data.procedures || [];
        setPatientProcedures(procs);
        setPatientDoctors(res.data.doctors || []);
        procs.forEach((p) => addProcedureToItems(p));
      } catch {
        setPatientProcedures([]);
        setPatientDoctors([]);
      }
    } else {
      setPatientProcedures([]);
      setPatientDoctors([]);
    }
  };

  const handleNewProcedure = async () => {
    if (!patientId || !procForm.procedure_type_id) return;
    setAddingProc(true);
    try {
      const pt = procedureTypes.find((p) => p.id === Number(procForm.procedure_type_id));
      const res = await apiClient.post(`/patients/${patientId}/procedures`, {
        procedure_type_id: Number(procForm.procedure_type_id),
        procedure_date: procForm.procedure_date,
        notes: procForm.notes,
        fee: pt?.price || 0,
      });
      const newProc: PatientProcedure = { ...res.data, procedure_name: pt?.name };
      setPatientProcedures((prev) => [...prev, newProc]);
      addProcedureToItems(newProc);
      toaster.push(<Notification type="success" header="Added">Procedure added to patient</Notification>, { placement: 'topEnd' });
      setShowNewProc(false);
      setProcForm({ procedure_type_id: '', procedure_date: '', notes: '' });
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to add procedure</Notification>, { placement: 'topEnd' });
    } finally {
      setAddingProc(false);
    }
  };

  const addItem = (serviceId: number) => {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    if (items.some((i) => i.service_id === serviceId)) return;
    const price = Number(svc.price);
    setItems([...items, { service_id: svc.id, description: svc.name, quantity: 1, unit_price: price, total: price }]);
  };

  const addInventoryItem = (invId: number) => {
    const inv = inventory.find((i: any) => i.id === invId);
    if (!inv) return;
    const price = Number(inv.unit_price);
    setItems((prev) => [...prev, { description: inv.item_name, quantity: 1, unit_price: price, total: price }]);
  };

  const addProcedure = (procId: number) => {
    const proc = patientProcedures.find((p) => p.id === procId);
    if (!proc) return;
    addProcedureToItems(proc);
  };

  const addMedicine = () => {
    const name = medicineForm.name.trim();
    if (!name) return;
    const qty = Number(medicineForm.quantity) || 1;
    const price = Number(medicineForm.price) || 0;
    setItems((prev) => [...prev, { description: name, quantity: qty, unit_price: price, total: qty * price }]);
    setShowMedicine(false);
    setMedicineForm({ name: '', quantity: 1, price: 0 });
  };

  const addDoctorFee = () => {
    const doc = patientDoctors.find((d) => d.id === docFeeForm.doctor_id);
    if (!doc) return;
    const fee = Number(docFeeForm.fee);
    setItems((prev) => [...prev, { description: `Professional Fee - Dr. ${doc.first_name} ${doc.last_name}`, quantity: 1, unit_price: fee, total: fee }]);
    setShowDocFee(false);
    setDocFeeForm({ doctor_id: null, fee: 0 });
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, key: string, value: number) => {
    const newItems = [...items];
    (newItems[idx] as any)[key] = Number(value);
    newItems[idx].total = Number(newItems[idx].quantity) * Number(newItems[idx].unit_price);
    setItems(newItems);
  };

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const total = subtotal;

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
                onChange={(v) => handlePatientChange(v as any)}
                className="w-full"
                searchable
              />
          </FormField>
          <FormField label="Due Date">
            <DatePicker className="w-full" value={dueDate ? new Date(dueDate) : null} onChange={(v) => setDueDate(v ? toLocalDateString(v) : '')} oneTap />
          </FormField>
          <FormField label="Notes">
            <Input value={notes} onChange={setNotes} />
          </FormField>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Invoice Items</h4>
            <div className="flex gap-2">
              <SelectPicker
                data={services.filter((s) => s.status === 'Active').map((s) => ({ label: `${s.name} - ${formatCurrency(s.price)}`, value: s.id }))}
                placeholder="+ Add service"
                onChange={(v) => { if (v) addItem(v); }}
                className="w-56"
              />
              <SelectPicker
                data={patientProcedures.map((p) => ({ label: `${p.procedure_name || 'Procedure'} - ${formatCurrency(p.fee)}`, value: p.id }))}
                placeholder="+ Add procedure"
                onChange={(v) => { if (v) addProcedure(v); }}
                className="w-44"
                disabled={!patientId}
              />
              <Button appearance="primary" size="sm" disabled={!patientId} onClick={() => setShowNewProc(true)}>New</Button>
              <Button appearance="ghost" size="sm" disabled={!patientId || patientDoctors.length === 0} onClick={() => setShowDocFee(true)}>Doc's Fee</Button>
              <Button appearance="ghost" size="sm" disabled={!patientId} onClick={() => setShowMedicine(true)}>Other Charges</Button>
            </div>
          </div>
          <div className="table-responsive"><Table data={items} autoHeight rowHeight={48}>
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
          </Table></div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex flex-col items-end space-y-1 text-sm">
            <div className="flex justify-between w-64">
              <span className="text-gray-500 dark:text-gray-300">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
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

      <Modal open={showDocFee} onClose={() => setShowDocFee(false)}>
        <Modal.Header><Modal.Title>Add Doctor's Professional Fee</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Doctor</label>
              <SelectPicker
                data={patientDoctors.map((d) => ({ label: `Dr. ${d.first_name} ${d.last_name}`, value: d.id }))}
                value={docFeeForm.doctor_id as any}
                onChange={(v) => setDocFeeForm({ ...docFeeForm, doctor_id: v as any })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fee Amount (₱)</label>
              <Input type="number" min={0} step={0.01} value={String(docFeeForm.fee)} onChange={(v) => setDocFeeForm({ ...docFeeForm, fee: Number(v) || 0 })} />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button appearance="primary" onClick={addDoctorFee}>Add Fee</Button>
          <Button appearance="default" onClick={() => setShowDocFee(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      <Modal open={showMedicine} onClose={() => setShowMedicine(false)}>
        <Modal.Header><Modal.Title>Add Other Charges</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select from Inventory</label>
              <SelectPicker
                data={inventory.filter((i: any) => i.quantity > 0).map((i: any) => ({ label: `${i.item_name} (${i.quantity} ${i.unit}) - ${formatCurrency(i.unit_price)}`, value: i.id }))}
                placeholder="Choose an inventory item..."
                onChange={(v) => {
                  if (!v) return;
                  const inv = inventory.find((i: any) => i.id === v);
                  if (inv) setMedicineForm({ name: inv.item_name, quantity: 1, price: Number(inv.unit_price) });
                }}
                className="w-full"
                searchable
              />
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <p className="text-xs text-gray-400 mb-3">Or enter manually:</p>
              <div>
                <label className="block text-sm font-medium mb-1">Item Name</label>
                <Input value={medicineForm.name} onChange={(v) => setMedicineForm({ ...medicineForm, name: v })} placeholder="e.g. Paracetamol 500mg" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <Input type="number" min={1} value={String(medicineForm.quantity)} onChange={(v) => setMedicineForm({ ...medicineForm, quantity: Number(v) || 1 })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price per unit (₱)</label>
                <Input type="number" min={0} step={0.01} value={String(medicineForm.price)} onChange={(v) => setMedicineForm({ ...medicineForm, price: Number(v) || 0 })} />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button appearance="primary" onClick={addMedicine}>Add to Invoice</Button>
          <Button appearance="default" onClick={() => setShowMedicine(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      <Modal open={showNewProc} onClose={() => setShowNewProc(false)}>
        <Modal.Header><Modal.Title>Add Procedure</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Procedure Type</label>
              <SelectPicker
                data={procedureTypes.map((pt) => ({ label: `${pt.name} (${formatCurrency(pt.price)})`, value: pt.id }))}
                value={procForm.procedure_type_id as any}
                onChange={(v) => setProcForm({ ...procForm, procedure_type_id: v as any })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <DatePicker className="w-full" value={procForm.procedure_date ? new Date(procForm.procedure_date) : null} onChange={(v) => setProcForm({ ...procForm, procedure_date: v ? toLocalDateString(v) : '' })} oneTap />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <Input as="textarea" rows={3} value={procForm.notes} onChange={(v) => setProcForm({ ...procForm, notes: v })} />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button appearance="primary" onClick={handleNewProcedure} loading={addingProc}>Add Procedure</Button>
          <Button appearance="default" onClick={() => setShowNewProc(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>
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

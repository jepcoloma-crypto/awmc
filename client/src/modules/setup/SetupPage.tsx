import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Input, SelectPicker, Notification, useToaster } from 'rsuite';
import apiClient from '@/api/client';
import { formatCurrency } from '@/lib/utils';
import type { Service, ProcedureType } from '@/types/models';

const { Column, Cell, HeaderCell } = Table;

const statusOptions = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];

const defaultService: Omit<Service, 'id'> = {
  name: '', description: '', price: 0, category: '', status: 'Active',
};

const defaultProcedure: Omit<ProcedureType, 'id'> = {
  name: '', description: '', price: 0,
};

export default function SetupPage() {
  const [activeTab, setActiveTab] = useState<'services' | 'procedures'>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [procedures, setProcedures] = useState<ProcedureType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const toaster = useToaster();

  const notify = (type: 'success' | 'error', message: string) => {
    toaster.push(<Notification type={type} header={type === 'success' ? 'Success' : 'Error'}>{message}</Notification>, { placement: 'topEnd' });
  };

  const fetchServices = useCallback(async () => {
    try {
      const res = await apiClient.get('/services');
      setServices(res.data.data);
    } catch { notify('error', 'Failed to load services'); }
  }, []);

  const fetchProcedures = useCallback(async () => {
    try {
      const res = await apiClient.get('/procedure-types');
      setProcedures(res.data.data);
    } catch { notify('error', 'Failed to load procedures'); }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchServices(), fetchProcedures()]).finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm(activeTab === 'services' ? { ...defaultService } : { ...defaultProcedure });
    setModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ ...item });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) { notify('error', 'Name is required'); return; }
    setSaving(true);
    try {
      const endpoint = activeTab === 'services' ? 'services' : 'procedure-types';
      if (editItem) {
        await apiClient.put(`/${endpoint}/${editItem.id}`, form);
        notify('success', 'Updated successfully');
      } else {
        await apiClient.post(`/${endpoint}`, form);
        notify('success', 'Created successfully');
      }
      setModalOpen(false);
      if (activeTab === 'services') await fetchServices(); else await fetchProcedures();
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await apiClient.delete(`/${activeTab === 'services' ? 'services' : 'procedure-types'}/${id}`);
      notify('success', 'Deleted successfully');
      if (activeTab === 'services') await fetchServices(); else await fetchProcedures();
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleToggleStatus = async (item: Service) => {
    const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await apiClient.put(`/services/${item.id}`, { ...item, status: newStatus });
      notify('success', `Service ${newStatus}`);
      await fetchServices();
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to update status');
    }
  };

  const TableActions = ({ rowData }: { rowData: any }) => (
    <div className="flex gap-1 justify-center">
      <button onClick={() => openEdit(rowData)} className="p-1.5 text-slate-400 hover:text-[#0b6e4f] transition-colors" title="Edit">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button onClick={() => handleDelete(rowData.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );

  const StatusCell = ({ rowData }: { rowData: Service }) => (
    <button
      onClick={() => handleToggleStatus(rowData)}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
        rowData.status === 'Active'
          ? 'text-[#0b6e4f] bg-[#e8f5e9] dark:text-[#2ec4b6] dark:bg-[#0b6e4f]/15'
          : 'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-white/5'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${rowData.status === 'Active' ? 'bg-[#0b6e4f]' : 'bg-slate-400'}`} />
      {rowData.status}
    </button>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Setup</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage services and procedure types with pricing</p>
        </div>
        <Button appearance="primary" className="!bg-[#0b6e4f] !border-[#0b6e4f] hover:!bg-[#085a3f]" onClick={openAdd}>
          Add {activeTab === 'services' ? 'Service' : 'Procedure'}
        </Button>
      </div>

      <div className="flex gap-2 mb-6 p-1 bg-white/50 dark:bg-white/5 rounded-xl w-fit border border-slate-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab('services')}
          className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'services'
              ? 'bg-[#0b6e4f] text-white shadow-lg shadow-[#0b6e4f]/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/10'
          }`}
        >
          Services
        </button>
        <button
          onClick={() => setActiveTab('procedures')}
          className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'procedures'
              ? 'bg-[#0b6e4f] text-white shadow-lg shadow-[#0b6e4f]/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/10'
          }`}
        >
          Procedure Types
        </button>
      </div>

      {activeTab === 'services' ? (
        <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm table-responsive">
          <Table data={services} loading={loading} rowHeight={52} headerHeight={44} autoHeight>
            <Column width={48} align="center">
              <HeaderCell><span className="block w-full text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">#</span></HeaderCell>
              <Cell>{(_, i) => <span className="block w-full text-xs text-slate-400 text-center">{(i as number) + 1}</span>}</Cell>
            </Column>
            <Column flexGrow={1} minWidth={180}>
              <HeaderCell><span className="block w-full text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</span></HeaderCell>
              <Cell>{(rowData: any) => <span className="block w-full text-sm text-slate-800 dark:text-slate-200">{rowData.name}</span>}</Cell>
            </Column>
            <Column width={200}>
              <HeaderCell><span className="block w-full text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</span></HeaderCell>
              <Cell>{(rowData: any) => <span className="block w-full text-sm text-slate-700 dark:text-slate-300">{rowData.category}</span>}</Cell>
            </Column>
            <Column width={300} align="right">
              <HeaderCell><span className="block w-full text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Price</span></HeaderCell>
              <Cell>{(rowData: any) => <span className="block w-full text-sm font-semibold text-slate-800 dark:text-slate-200 text-right">{formatCurrency(parseFloat(String(rowData.price)))}</span>}</Cell>
            </Column>
            <Column width={130} align="center">
              <HeaderCell><span className="block w-full text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</span></HeaderCell>
              <Cell>{(rowData: Service) => <StatusCell rowData={rowData} />}</Cell>
            </Column>
            <Column width={110} align="center" fixed="right">
              <HeaderCell><span className="block w-full text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Actions</span></HeaderCell>
              <Cell>{(rowData: any) => <TableActions rowData={rowData} />}</Cell>
            </Column>
          </Table>
        </div>
      ) : (
        <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm table-responsive">
          <Table data={procedures} loading={loading} rowHeight={52} headerHeight={44} autoHeight>
            <Column width={48} align="center">
              <HeaderCell><span className="block w-full text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">#</span></HeaderCell>
              <Cell>{(_, i) => <span className="block w-full text-xs text-slate-400 text-center">{(i as number) + 1}</span>}</Cell>
            </Column>
            <Column flexGrow={1} minWidth={180}>
              <HeaderCell><span className="block w-full text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</span></HeaderCell>
              <Cell>{(rowData: any) => <span className="block w-full text-sm text-slate-800 dark:text-slate-200">{rowData.name}</span>}</Cell>
            </Column>
            <Column width={320}>
              <HeaderCell><span className="block w-full text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</span></HeaderCell>
              <Cell>{(rowData: any) => <span className="block w-full text-sm text-slate-700 dark:text-slate-300">{rowData.description}</span>}</Cell>
            </Column>
            <Column width={300} align="right">
              <HeaderCell><span className="block w-full text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Price</span></HeaderCell>
              <Cell>{(rowData: any) => <span className="block w-full text-sm font-semibold text-slate-800 dark:text-slate-200 text-right">{formatCurrency(parseFloat(String(rowData.price)))}</span>}</Cell>
            </Column>
            <Column width={110} align="center" fixed="right">
              <HeaderCell><span className="block w-full text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Actions</span></HeaderCell>
              <Cell>{(rowData: any) => <TableActions rowData={rowData} />}</Cell>
            </Column>
          </Table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="sm">
        <Modal.Header>
          <Modal.Title>{editItem ? 'Edit' : 'Add'} {activeTab === 'services' ? 'Service' : 'Procedure'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
              <Input value={form.name || ''} onChange={(v) => setForm({ ...form, name: v })} placeholder="Name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <Input as="textarea" rows={3} value={form.description || ''} onChange={(v) => setForm({ ...form, description: v })} placeholder="Description" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price (PHP)</label>
              <Input type="number" min={0} step={0.01} value={form.price?.toString() || '0'} onChange={(v) => setForm({ ...form, price: parseFloat(v) || 0 })} />
            </div>
            {activeTab === 'services' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <Input value={form.category || ''} onChange={(v) => setForm({ ...form, category: v })} placeholder="e.g. Consultation, Diagnostic" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <SelectPicker data={statusOptions} value={form.status || 'Active'} onChange={(v) => setForm({ ...form, status: v })} cleanable={false} searchable={false} block />
                </div>
              </>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setModalOpen(false)} appearance="subtle">Cancel</Button>
          <Button onClick={handleSave} appearance="primary" className="!bg-[#0b6e4f] !border-[#0b6e4f]" loading={saving}>
            {editItem ? 'Update' : 'Create'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

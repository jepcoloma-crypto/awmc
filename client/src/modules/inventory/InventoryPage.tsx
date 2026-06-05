import { useEffect, useState } from 'react';
import apiClient from '@/api/client';
import { Table, Tag, Button, Modal, Input, Notification, useToaster, SelectPicker, IconButton, Tooltip, Whisper, NumberInput } from 'rsuite';
import { EditRound, Trash } from '@rsuite/icons';
import { formatCurrency, exportCSV } from '@/lib/utils';

const { Column, Cell } = Table;

const categoryOptions = [
  { label: 'Medicine', value: 'Medicine' },
  { label: 'Medical Supply', value: 'Medical Supply' },
  { label: 'Equipment', value: 'Equipment' },
  { label: 'Office Supply', value: 'Office Supply' },
  { label: 'Other', value: 'Other' },
];

export default function InventoryPage() {
  const toaster = useToaster();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const load = async () => {
    try {
      const res = await apiClient.get('/inventory');
      setItems(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveItem = async () => {
    try {
      if (editModal.id) {
        await apiClient.put(`/inventory/${editModal.id}`, editModal);
      } else {
        await apiClient.post('/inventory', editModal);
      }
      toaster.push(<Notification type="success" header="Saved">{editModal.id ? 'Item updated' : 'Item added'}</Notification>, { placement: 'topEnd' });
      setEditModal(null);
      load();
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to save</Notification>, { placement: 'topEnd' });
    }
  };

  const deleteItem = async () => {
    try {
      await apiClient.delete(`/inventory/${deleteTarget.id}`);
      toaster.push(<Notification type="success" header="Deleted">Item deleted</Notification>, { placement: 'topEnd' });
      setDeleteTarget(null);
      load();
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to delete</Notification>, { placement: 'topEnd' });
    }
  };

  const lowStock = items.filter((i) => i.quantity <= i.reorder_level);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Inventory</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">Track medicine and clinic supplies</p>
        </div>
        <div className="flex gap-2">
          <Button appearance="ghost" onClick={() => {
            exportCSV('inventory', ['Item', 'Category', 'Quantity', 'Unit', 'Reorder Level', 'Unit Price', 'Supplier'], items.map((r) => [r.item_name, r.category, r.quantity, r.unit, r.reorder_level, r.unit_price, r.supplier]));
          }}>Export CSV</Button>
          <Button appearance="primary" onClick={() => setEditModal({ item_name: '', category: 'Medicine', quantity: 0, unit: 'piece', reorder_level: 10, unit_price: 0, supplier: '', notes: '' })}>+ Add Item</Button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Low Stock Alert ({lowStock.length} item{lowStock.length > 1 ? 's' : ''})
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            {lowStock.map((item) => (
              <span key={item.id} className="text-xs bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-full">
                {item.item_name} ({item.quantity} {item.unit})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="wellness-card table-responsive">
        <Table data={items} loading={loading} autoHeight rowHeight={52}>
          <Column width={200}><Table.HeaderCell>Item Name</Table.HeaderCell><Cell>{(r: any) => <span className="font-medium">{r.item_name}</span>}</Cell></Column>
          <Column width={130}><Table.HeaderCell>Category</Table.HeaderCell><Cell>{(r: any) => <Tag color={r.category === 'Medicine' ? 'blue' : r.category === 'Medical Supply' ? 'cyan' : r.category === 'Equipment' ? 'violet' : 'green'}>{r.category}</Tag>}</Cell></Column>
          <Column width={90}><Table.HeaderCell>Quantity</Table.HeaderCell><Cell>{(r: any) => (
            <span className={r.quantity <= r.reorder_level ? 'text-red-600 font-bold' : ''}>{r.quantity}</span>
          )}</Cell></Column>
          <Column width={80}><Table.HeaderCell>Unit</Table.HeaderCell><Cell>{(r: any) => r.unit}</Cell></Column>
          <Column width={100}><Table.HeaderCell>Reorder At</Table.HeaderCell><Cell>{(r: any) => r.reorder_level}</Cell></Column>
          <Column width={110}><Table.HeaderCell>Unit Price</Table.HeaderCell><Cell>{(r: any) => formatCurrency(r.unit_price)}</Cell></Column>
          <Column width={150}><Table.HeaderCell>Supplier</Table.HeaderCell><Cell>{(r: any) => r.supplier}</Cell></Column>
          <Column width={200} flexGrow={1}><Table.HeaderCell>Notes</Table.HeaderCell><Cell>{(r: any) => r.notes}</Cell></Column>
          <Column width={80}><Table.HeaderCell>Actions</Table.HeaderCell>
            <Cell>{(r: any) => (
              <div className="flex gap-1">
                <Whisper speaker={<Tooltip>Edit</Tooltip>} placement="top" trigger="hover">
                  <IconButton size="sm" appearance="subtle" icon={<EditRound style={{ color: '#2563eb' }} />} onClick={() => setEditModal({ ...r })} />
                </Whisper>
                <Whisper speaker={<Tooltip>Delete</Tooltip>} placement="top" trigger="hover">
                  <IconButton size="sm" appearance="subtle" icon={<Trash style={{ color: '#e53e3e' }} />} onClick={() => setDeleteTarget(r)} />
                </Whisper>
              </div>
            )}</Cell>
          </Column>
        </Table>
      </div>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} size="sm">
        <Modal.Header><Modal.Title>{editModal?.id ? 'Edit Item' : 'Add Item'}</Modal.Title></Modal.Header>
        <Modal.Body>
          {editModal && (
            <div className="space-y-4">
              <FormField label="Item Name"><Input value={editModal.item_name} onChange={(v) => setEditModal({ ...editModal, item_name: v })} /></FormField>
              <FormField label="Category">
                <SelectPicker data={categoryOptions} value={editModal.category} onChange={(v) => setEditModal({ ...editModal, category: v })} className="w-full" searchable={false} />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Quantity">
                  <Input type="number" value={String(editModal.quantity)} onChange={(v) => setEditModal({ ...editModal, quantity: parseInt(v) || 0 })} />
                </FormField>
                <FormField label="Unit">
                  <Input value={editModal.unit} onChange={(v) => setEditModal({ ...editModal, unit: v })} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Reorder Level">
                  <Input type="number" value={String(editModal.reorder_level)} onChange={(v) => setEditModal({ ...editModal, reorder_level: parseInt(v) || 0 })} />
                </FormField>
                <FormField label="Unit Price">
                  <Input type="number" value={String(editModal.unit_price)} onChange={(v) => setEditModal({ ...editModal, unit_price: parseFloat(v) || 0 })} />
                </FormField>
              </div>
              <FormField label="Supplier"><Input value={editModal.supplier || ''} onChange={(v) => setEditModal({ ...editModal, supplier: v })} /></FormField>
              <FormField label="Notes"><Input as="textarea" rows={3} value={editModal.notes || ''} onChange={(v) => setEditModal({ ...editModal, notes: v })} /></FormField>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button appearance="primary" onClick={saveItem}>Save</Button>
          <Button appearance="default" onClick={() => setEditModal(null)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} size="xs">
        <Modal.Header><Modal.Title>Delete Item</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="text-sm text-gray-600">Delete <strong>{deleteTarget?.item_name}</strong> from inventory?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button appearance="primary" color="red" onClick={deleteItem}>Delete</Button>
          <Button appearance="default" onClick={() => setDeleteTarget(null)}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
    </div>
  );
}
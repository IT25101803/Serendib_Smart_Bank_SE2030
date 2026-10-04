import { useState } from 'react';
import { send } from '../api/client';
import { useApi, Heading, Panel, Field, ErrorMessage, Loading, Pagination, Empty } from '../components/ui';
import type { Beneficiary, Page } from '../types/api';

const BANK_OPTIONS = [
  'Serendib Bank',
  'Bank of Ceylon (BOC)',
  'Commercial Bank',
  'Hatton National Bank (HNB)',
  'Sampath Bank',
  'Seylan Bank',
  'Nations Trust Bank',
  'National Development Bank (NDB)',
  'People\'s Bank',
  'DFCC Bank',
  'Pan Asia Bank',
  'Union Bank'
];

export default function BeneficiariesPage() {
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [bankName, setBankName] = useState('Serendib Bank');
  const [relationship, setRelationship] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'SERENDIB' | 'CEFT'>('ALL');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const { data, error: loadError, loading } = useApi<Page<Beneficiary>>(`/api/beneficiaries?page=${page}`, revision);

  function reset() {
    setEditing(null);
    setName('');
    setNumber('');
    setBankName('Serendib Bank');
    setRelationship('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await send(`/api/beneficiaries${editing ? `/${editing}` : ''}`, { name, accountNumber: number, bankName, relationship }, editing ? 'PATCH' : 'POST');
      reset();
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function remove(b: Beneficiary) {
    if (!confirm(`Remove ${b.name} from your active beneficiaries?`)) return;
    setBusy(true);
    try {
      await send(`/api/beneficiaries/${b.beneficiaryId}`, undefined, 'DELETE');
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  const copyAcc = (id: number, accNum: string) => {
    navigator.clipboard.writeText(accNum);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredBeneficiaries = data?.content.filter(b => {
    if (activeTab === 'SERENDIB') return b.bankName === 'Serendib Bank';
    if (activeTab === 'CEFT') return b.bankName !== 'Serendib Bank';
    return true;
  });

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 mb-6 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#ecc246]"></span>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#ddc582]">
              CEFT Network &amp; Saved Payees Registry
            </span>
          </div>
          <Heading title="Saved Beneficiaries" subtitle="Manage trusted payee accounts, instant CEFT transfer shortcuts, and favorite financial contacts." />
        </div>

        {/* Bank Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#1a1b21] rounded-full border border-white/10">
          <button
            type="button"
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'ALL' ? 'bg-[#c9a227] text-black shadow-md' : 'text-[#d1c5af] hover:text-[#e3e1e9]'
            }`}
            onClick={() => setActiveTab('ALL')}
          >
            All Payees
          </button>
          <button
            type="button"
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'SERENDIB' ? 'bg-[#c9a227] text-black shadow-md' : 'text-[#d1c5af] hover:text-[#e3e1e9]'
            }`}
            onClick={() => setActiveTab('SERENDIB')}
          >
            Serendib Internal
          </button>
          <button
            type="button"
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'CEFT' ? 'bg-[#c9a227] text-black shadow-md' : 'text-[#d1c5af] hover:text-[#e3e1e9]'
            }`}
            onClick={() => setActiveTab('CEFT')}
          >
            Other CEFT Banks
          </button>
        </div>
      </div>

      <ErrorMessage error={error || loadError} />

      <div className="two-column">
        <Panel title={editing ? '✏️ Edit Beneficiary Details' : '➕ Add New Beneficiary'}>
          <form onSubmit={submit}>
            <Field label="Beneficiary Full Name *">
              <input
                required
                maxLength={100}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Kasun Chamara Perera"
                className="italic"
              />
            </Field>
            <Field label="Receiving Financial Institution *">
              <select value={bankName} onChange={e => setBankName(e.target.value)}>
                {BANK_OPTIONS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="Account Number *">
              <input
                required
                inputMode="numeric"
                pattern="[0-9]{6,30}"
                value={number}
                onChange={e => setNumber(e.target.value)}
                placeholder="e.g. 009288124192"
                className="italic"
              />
            </Field>
            <Field label="Relationship / Category Tag">
              <input
                maxLength={100}
                value={relationship}
                onChange={e => setRelationship(e.target.value)}
                placeholder="e.g. Family, Utility Vendor, Landlord"
                className="italic"
              />
            </Field>
            <p className="fine-print">Save recipient details for 1-click CEFT transfers without re-entering account numbers.</p>
            <div className="actions">
              <button disabled={busy} className="button">
                {busy ? 'Saving…' : editing ? 'Save Changes' : 'Save Beneficiary'}
              </button>
              {editing && <button type="button" className="secondary" onClick={reset}>Cancel Edit</button>}
            </div>
          </form>
        </Panel>

        <Panel title="Saved Recipients">
          {loading ? <Loading /> : data && (
            <>
              {filteredBeneficiaries && filteredBeneficiaries.map(b => (
                <article key={b.beneficiaryId} className="list-item p-4 bg-[#1a1b21] rounded-2xl border border-white/10 mb-3 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#e3e1e9] text-base">{b.name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#584711] text-[#ddc582] text-[10px] font-semibold uppercase">
                        {b.bankName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#99907b]">
                      <span className="font-mono text-[#d1c5af]">{b.accountNumber}</span>
                      <button
                        type="button"
                        className="text-[10px] text-[#ecc246] hover:underline"
                        onClick={() => copyAcc(b.beneficiaryId, b.accountNumber)}
                      >
                        {copiedId === b.beneficiaryId ? '✓ Copied' : '📋 Copy'}
                      </button>
                      {b.relationship && (
                        <>
                          <span>•</span>
                          <span className="italic text-[#ecc246]">{b.relationship}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="actions flex items-center gap-2">
                    <button
                      className="secondary text-xs px-3 py-1.5 rounded-full"
                      disabled={busy}
                      onClick={() => {
                        setEditing(b.beneficiaryId);
                        setName(b.name);
                        setNumber(b.accountNumber);
                        setBankName(b.bankName || 'Serendib Bank');
                        setRelationship(b.relationship || '');
                      }}
                    >
                      Edit
                    </button>
                    <button className="link-button danger text-xs" disabled={busy} onClick={() => remove(b)}>Remove</button>
                  </div>
                </article>
              ))}
              {!filteredBeneficiaries?.length && <Empty>No saved beneficiaries matching selected category filter.</Empty>}
              <Pagination data={data} onPage={setPage} />
            </>
          )}
        </Panel>
      </div>
    </>
  );
}



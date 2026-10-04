import { Text } from '../i18n';
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { send, money, date, query } from '../api/client';
import { useApi, Heading, Panel, Field, ErrorMessage, Loading, Pagination, StatusBadge, Detail, Empty } from '../components/ui';
import type { Loan, Page, Account, Deposit } from '../types/api';
import { TermsModal } from '../components/TermsModal';
import { ApplicationPdfModal } from '../components/ApplicationPdfModal';
import { LOANS_CATALOG } from '../data/productCatalog';
import { useAuth } from '../auth/AuthProvider';

export function LoansPage() {
  const { role } = useAuth();
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loanType, setLoanType] = useState(LOANS_CATALOG[0].name);
  const [amount, setAmount] = useState('500000');
  const [tenureMonths, setTenureMonths] = useState('60');
  const [info, setInfo] = useState('');
  
  // Account & FD Collateral State
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedFdId, setSelectedFdId] = useState<number | null>(null);

  // Loan Repayment Modal State
  const [payingLoan, setPayingLoan] = useState<Loan | null>(null);
  const [payAccountId, setPayAccountId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payingBusy, setPayingBusy] = useState(false);
  const [paymentError, setPaymentError] = useState<unknown>(null);

  // Scrutiny Fields
  const [basicSalary, setBasicSalary] = useState('150000');
  const [fixedAllowances, setFixedAllowances] = useState('25000');
  const [cribDeductions, setCribDeductions] = useState('15000');
  const [employmentStatus, setEmploymentStatus] = useState('Permanent');
  const [serviceYears, setServiceYears] = useState('3');

  // Leasing Vehicle Details
  const [vehicleCondition, setVehicleCondition] = useState('Brand New');
  const [manufactureYear, setManufactureYear] = useState('2024');
  const [valuationAmount, setValuationAmount] = useState('8500000');
  const [chassisNumber, setChassisNumber] = useState('');
  const [engineNumber, setEngineNumber] = useState('');

  // Documents
  const [salarySlips, setSalarySlips] = useState('salary_slips_3_months.pdf');
  const [bankStatements, setBankStatements] = useState('bank_statements_6_months.pdf');
  const [employmentLetter, setEmploymentLetter] = useState('letter_of_employment.pdf');

  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const result = useApi<Page<Loan>>(`/api/loans?page=${page}`, revision);
  const userAccounts = useApi<Page<Account>>('/api/accounts', revision);
  const userDeposits = useApi<Page<Deposit>>('/api/deposits', revision);

  // Auto-select first active account if not selected
  useEffect(() => {
    if (!selectedAccountId && userAccounts.data?.content.length) {
      const active = userAccounts.data.content.find(a => a.status === 'ACTIVE');
      if (active) setSelectedAccountId(active.accountId);
    }
  }, [userAccounts.data, selectedAccountId]);

  const isLeasing = loanType.includes('Leasing') || loanType.includes('GreenDrive');
  const isFdSecured = loanType.includes('FD Backed') || loanType.includes('FD_SECURED');

  const eligibleDeposits = userDeposits.data?.content.filter(
    d => d.status === 'ACTIVE' && Number(d.principalAmount) >= 1000000
  ) || [];

  const activeLoans = result.data?.content.filter(l => l.status === 'APPROVED');

  function openTerms(e: React.FormEvent) {
    e.preventDefault();
    setShowTerms(true);
  }

  function resetFormFields() {
    setLoanType(LOANS_CATALOG[0].name);
    setAmount('500000');
    setTenureMonths('60');
    setInfo('');
    setSelectedFdId(null);
    setBasicSalary('150000');
    setFixedAllowances('25000');
    setCribDeductions('15000');
    setEmploymentStatus('Permanent');
    setServiceYears('3');
    setVehicleCondition('Brand New');
    setManufactureYear('2024');
    setValuationAmount('8500000');
    setChassisNumber('');
    setEngineNumber('');
    setSalarySlips('salary_slips_3_months.pdf');
    setBankStatements('bank_statements_6_months.pdf');
    setEmploymentLetter('letter_of_employment.pdf');
  }

  async function submitApplication() {
    setBusy(true);
    setError(null);
    try {
      await send('/api/loans', {
        loanType,
        amount: Number(amount),
        preferredTenureMonths: Number(tenureMonths),
        information: info,
        accountId: selectedAccountId || undefined,
        fixedDepositId: isFdSecured ? (selectedFdId || undefined) : undefined,
        basicMonthlySalary: Number(basicSalary),
        fixedAllowances: Number(fixedAllowances),
        existingMonthlyLoanDeductionsCrib: Number(cribDeductions),
        employmentStatus,
        servicePeriodYears: Number(serviceYears),
        vehicleCondition: isLeasing ? vehicleCondition : undefined,
        yearOfManufacture: isLeasing ? Number(manufactureYear) : undefined,
        vehicleValuationAmount: isLeasing ? Number(valuationAmount) : undefined,
        chassisNumber: isLeasing ? chassisNumber : undefined,
        engineNumber: isLeasing ? engineNumber : undefined,
        salarySlipsUpload: salarySlips,
        bankStatementsUpload: bankStatements,
        employmentLetterUpload: employmentLetter
      });

      resetFormFields();
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function submitLoanPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payingLoan || !payAccountId || !payAmount) return;
    setPayingBusy(true);
    setPaymentError(null);
    try {
      await send(`/api/loans/${payingLoan.loanId}/pay`, {
        accountId: payAccountId,
        amount: Number(payAmount)
      });
      setPayingLoan(null);
      setPayAmount('');
      setRevision(r => r + 1);
    } catch (e) {
      setPaymentError(e);
    } finally {
      setPayingBusy(false);
    }
  }

  return (
    <>
      <Heading
        title="Loans & Leasing Facilities"
        subtitle="Apply for home loans, education financing, credit lines, FD-backed loans, and EV leasing."
      />

      <div 
        className="glass-card"
        style={{
          background: `linear-gradient(135deg, rgba(10, 11, 16, 0.86) 0%, rgba(18, 19, 26, 0.92) 100%), url('/images/loan_businessman_banner.jpeg') center/cover no-repeat`,
          borderRadius: '24px',
          padding: '2rem 2.25rem',
          border: '1px solid var(--gold-border)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '2rem'
        }}
      >
        <span className="eyebrow">PRESTIGE CREDIT FACILITIES</span>
        <h2 style={{ fontSize: '1.75rem', fontFamily: 'Playfair Display', margin: '0.35rem 0 0.5rem 0' }}>
          Flexible Lending &amp; Asset Leasing
        </h2>
        <p style={{ margin: 0, maxWidth: '620px', opacity: 0.9, fontSize: '0.95rem' }}>
          Access personal credit, FD-collateralized instant loans, commercial equipment leasing, and vehicle facilities with competitive rates and transparent approval workflows.
        </p>
      </div>

      <ErrorMessage error={error || result.error || paymentError} />

      {/* ONGOING LOAN SECTION - DISPLAYED ONLY WHEN CUSTOMER HAS ACTIVE/APPROVED LOAN */}
      {activeLoans && activeLoans.length > 0 && (
        <section className="ongoing-loans-section" style={{ marginBottom: '2rem' }}>
          <Panel title="🟢 Active Ongoing Loans & Leasing">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {activeLoans.map(l => (
                <div
                  key={l.loanId}
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.1) 100%)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: '12px',
                    padding: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <strong style={{ fontSize: '1.1rem', color: '#34d399' }}>{l.loanType}</strong>
                    <StatusBadge status={l.status} />
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>
                    {money(l.amount)}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#a7f3d0', marginBottom: '0.5rem' }}>
                    Remaining: <strong>{money(l.remainingAmount || l.amount)}</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', opacity: 0.9 }}>
                    <div>Facility No: <strong>{l.loanNumber || `700000${l.loanId}`}</strong></div>
                    <div>Account: <strong>{l.targetAccountNumber || 'Disbursed'}</strong></div>
                    <div>Rate: <strong>{l.interestRate}% p.a.</strong></div>
                    <div>Applied: <strong>{date(l.applyDate)}</strong></div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      className="button primary"
                      style={{ flex: 1, padding: '0.5rem' }}
                      onClick={() => {
                        setPayingLoan(l);
                        setPayAmount(l.remainingAmount || l.amount);
                        if (userAccounts.data?.content.length) {
                          setPayAccountId(userAccounts.data.content[0].accountId);
                        }
                      }}
                    >
                      💳 Pay Installment
                    </button>
                    <Link className="button light" style={{ flex: 1, textAlign: 'center', padding: '0.5rem' }} to={`/app/loans/${l.loanId}`}>
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </section>
      )}

      <div className="two-column">
        {/* NEW APPLICATION FORM */}
        <Panel title="New Financing Application">
          <form onSubmit={openTerms}>
            <Field label="Loan / Leasing Product">
              <select value={loanType} onChange={e => setLoanType(e.target.value)}>
                {LOANS_CATALOG.map(p => (
                  <option key={p.id} value={p.name}>{p.name} ({p.rateOrYield})</option>
                ))}
              </select>
            </Field>

            <Field label="Disbursement Destination Account *">
              <select
                required
                value={selectedAccountId ?? ''}
                onChange={e => setSelectedAccountId(Number(e.target.value))}
              >
                <option value="">-- Select Account to Receive Loan Funds --</option>
                {userAccounts.data?.content.map(a => (
                  <option key={a.accountId} value={a.accountId}>
                    {a.accountNumber} ({a.accountType}) - Balance: LKR {money(a.balance)}
                  </option>
                ))}
              </select>
            </Field>

            {/* FD BACKED LOAN COLLATERAL BLOCK */}
            {isFdSecured && (
              <div style={{ background: 'rgba(59,130,246,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.25)', margin: '1rem 0' }}>
                <h4 style={{ color: '#60a5fa', marginBottom: '0.5rem' }}>🔒 Fixed Deposit Collateral Selection</h4>
                <Field label="Select Qualifying Fixed Deposit (Principal ≥ LKR 1,000,000) *">
                  <select
                    required
                    value={selectedFdId ?? ''}
                    onChange={e => {
                      const id = Number(e.target.value);
                      setSelectedFdId(id);
                      const dep = eligibleDeposits.find(d => d.fixedDepositId === id);
                      if (dep) {
                        const maxVal = (Number(dep.principalAmount) / 2).toFixed(2);
                        setAmount(maxVal);
                      }
                    }}
                  >
                    <option value="">-- Select Active Fixed Deposit --</option>
                    {eligibleDeposits.map(d => (
                      <option key={d.fixedDepositId} value={d.fixedDepositId}>
                        FD #{d.fixedDepositId} - LKR {money(d.principalAmount)} ({d.termMonths} Months)
                      </option>
                    ))}
                  </select>
                </Field>
                {eligibleDeposits.length === 0 ? (
                  <p className="fine-print" style={{ color: '#f87171', marginTop: 4 }}>
                    ⚠️ You do not currently have an active Fixed Deposit worth over LKR 1,000,000 to use as collateral.
                  </p>
                ) : (
                  <p className="fine-print" style={{ color: '#93c5fd', marginTop: 4 }}>
                    ℹ️ You can borrow up to 50% of your Fixed Deposit principal. Your FD will be safely frozen as collateral until the loan is fully paid off with interest.
                  </p>
                )}
              </div>
            )}

            <div className="two-column">
              <Field label="Requested amount (LKR)">
                <input
                  required
                  type="number"
                  min="1000"
                  step="0.01"
                  max="9999999999.99"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </Field>

              <Field label="Preferred tenure (Months)">
                <select value={tenureMonths} onChange={e => setTenureMonths(e.target.value)}>
                  <option value="12">12 Months (1 Year)</option>
                  <option value="24">24 Months (2 Years)</option>
                  <option value="36">36 Months (3 Years)</option>
                  <option value="60">60 Months (5 Years)</option>
                  <option value="120">120 Months (10 Years)</option>
                  <option value="240">240 Months (20 Years)</option>
                  <option value="300">300 Months (25 Years)</option>
                </select>
              </Field>
            </div>

            <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem', margin: '1.25rem 0 0.75rem', color: '#10b981' }}>
              Financial Scrutiny &amp; CRIB Data
            </h4>

            <div className="two-column">
              <Field label="Basic monthly salary (LKR)">
                <input required type="number" value={basicSalary} onChange={e => setBasicSalary(e.target.value)} />
              </Field>
              <Field label="Fixed allowances (LKR)">
                <input type="number" value={fixedAllowances} onChange={e => setFixedAllowances(e.target.value)} />
              </Field>
            </div>

            <div className="two-column">
              <Field label="Existing CRIB monthly loan deductions (LKR)">
                <input type="number" value={cribDeductions} onChange={e => setCribDeductions(e.target.value)} />
              </Field>
              <Field label="Employment status">
                <select value={employmentStatus} onChange={e => setEmploymentStatus(e.target.value)}>
                  <option value="Permanent">Permanent</option>
                  <option value="Contractual">Contractual</option>
                  <option value="Probationary">Probationary</option>
                </select>
              </Field>
            </div>

            <Field label="Service period (Years)">
              <input type="number" min="0" value={serviceYears} onChange={e => setServiceYears(e.target.value)} />
            </Field>

            {/* VEHICLE LEASING DETAILS BLOCK */}
            {isLeasing && (
              <div style={{ background: 'rgba(16,185,129,0.08)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', margin: '1.25rem 0' }}>
                <h4 style={{ color: '#34d399', marginBottom: '0.75rem' }}>🚗 GreenDrive Vehicle Leasing Details</h4>
                <div className="two-column">
                  <Field label="Vehicle condition">
                    <select value={vehicleCondition} onChange={e => setVehicleCondition(e.target.value)}>
                      <option value="Brand New">Brand New</option>
                      <option value="Unregistered">Unregistered</option>
                      <option value="Reconditioned">Reconditioned</option>
                      <option value="Registered">Registered</option>
                    </select>
                  </Field>
                  <Field label="Year of manufacture">
                    <input type="number" min="2000" max="2026" value={manufactureYear} onChange={e => setManufactureYear(e.target.value)} />
                  </Field>
                </div>
                <Field label="Valuation amount (LKR)">
                  <input type="number" value={valuationAmount} onChange={e => setValuationAmount(e.target.value)} />
                </Field>
                <div className="two-column">
                  <Field label="Chassis number">
                    <input type="text" value={chassisNumber} onChange={e => setChassisNumber(e.target.value)} placeholder="e.g. ZVW50-123456" />
                  </Field>
                  <Field label="Engine number">
                    <input type="text" value={engineNumber} onChange={e => setEngineNumber(e.target.value)} placeholder="e.g. 2ZR-FXE98765" />
                  </Field>
                </div>
              </div>
            )}

            <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem', margin: '1.25rem 0 0.75rem', color: '#10b981' }}>
              Credit Documents Upload
            </h4>

            <div className="two-column">
              <Field label="Last 3 months salary slips">
                <input type="file" onChange={e => setSalarySlips(e.target.files?.[0]?.name || 'salary_slips.pdf')} />
              </Field>
              <Field label="Last 6 months bank statements">
                <input type="file" onChange={e => setBankStatements(e.target.files?.[0]?.name || 'bank_statements.pdf')} />
              </Field>
            </div>
            <Field label="Letter of employment">
              <input type="file" onChange={e => setEmploymentLetter(e.target.files?.[0]?.name || 'employment_letter.pdf')} />
            </Field>

            <Field label="Purpose and supporting information">
              <textarea required maxLength={2000} value={info} onChange={e => setInfo(e.target.value)} placeholder="Describe the purpose of your loan..." />
            </Field>

            <div className="callout" style={{ background: 'rgba(245,158,11,0.15)', borderLeft: '4px solid #f59e0b', margin: '1rem 0' }}>
              <strong>Branch Manager Decision:</strong> All loan submissions are reviewed by bank staff and require final approval decision from the Branch Manager.
            </div>

            <button disabled={busy}>{busy ? 'Submitting…' : 'Review CRIB Terms & Submit Application'}</button>
          </form>
        </Panel>

        {/* YOUR APPLICATIONS LIST */}
        <Panel title="Your Applications History">
          {result.loading ? (
            <Loading />
          ) : (
            result.data && (
              <>
                {result.data.content.map(l => (
                  <Link className="list-item linked" to={`/app/loans/${l.loanId}`} key={l.loanId}>
                    <div>
                      <h3>{l.loanType} · {l.loanNumber || `#${l.loanId}`}</h3>
                      <p>{money(l.amount)}{role !== 'CUSTOMER' ? ` (CIF: ${l.cifNumber || '0000000'})` : ''}</p>
                      <small>{date(l.applyDate)}</small>
                    </div>
                    <StatusBadge status={l.status} />
                  </Link>
                ))}
                {!result.data.content.length && <Empty>No loan applications submitted yet.</Empty>}
                <Pagination data={result.data} onPage={setPage} />
              </>
            )
          )}
        </Panel>
      </div>

      <TermsModal
        type="LOANS"
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={submitApplication}
      />

      {/* LOAN INSTALLMENT PAYMENT MODAL */}
      {payingLoan && (
        <div className="modal-backdrop" onClick={() => setPayingLoan(null)}>
          <div className="glass-card-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <button className="close" onClick={() => setPayingLoan(null)} aria-label="Close">×</button>
            <div className="glass-modal-header">
              <div className="glass-modal-icon debit">💳</div>
              <div>
                <h2>Pay Loan Installment</h2>
                <p>{payingLoan.loanType} · Facility: {payingLoan.loanNumber || `#${payingLoan.loanId}`}</p>
              </div>
            </div>

            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '0.85rem', borderRadius: '8px', margin: '1rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Facility Amount:</span> <strong>{money(payingLoan.amount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Paid Amount:</span> <strong style={{ color: '#10b981' }}>{money(payingLoan.paidAmount || '0')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Remaining Balance:</span> <strong style={{ color: '#f59e0b' }}>{money(payingLoan.remainingAmount || payingLoan.amount)}</strong>
              </div>
            </div>

            <form onSubmit={submitLoanPayment} className="glass-modal-form">
              <Field label="Pay From Account *">
                <select
                  required
                  value={payAccountId ?? ''}
                  onChange={e => setPayAccountId(Number(e.target.value))}
                >
                  <option value="">-- Select Source Account --</option>
                  {userAccounts.data?.content.map(a => (
                    <option key={a.accountId} value={a.accountId}>
                      {a.accountNumber} ({a.accountType}) - Balance: LKR {money(a.balance)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Installment Payment Amount (LKR) *">
                <input
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder="Enter repayment amount..."
                />
              </Field>

              <div className="actions" style={{ marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                <button type="button" className="secondary" onClick={() => setPayingLoan(null)}>Cancel</button>
                <button type="submit" disabled={payingBusy || !payAmount || !payAccountId}>
                  {payingBusy ? 'Processing Payment…' : 'Confirm Loan Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function LoanDetailsPage() {
  const { id } = useParams();
  const [revision, setRevision] = useState(0);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const result = useApi<Loan>(`/api/loans/${id}`, revision);

  async function action(kind: string) {
    if (kind === 'cancel' && !confirm('Cancel this loan application?')) return;
    setBusy(true);
    setError(null);
    try {
      await send(`/api/loans/${id}/${kind}`, kind === 'information' ? { reason } : undefined, kind === 'cancel' ? 'PUT' : 'POST');
      setReason('');
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading title={`Loan application ${result.data?.loanNumber || `#${id}`}`} actions={<Link className="button secondary" to="/app/loans">All applications</Link>} />
      <ErrorMessage error={error || result.error} />
      {result.loading ? (
        <Loading />
      ) : (
        result.data && (
          <>
            <LoanDetails loan={result.data} />
            {result.data.status === 'MORE_INFORMATION_REQUIRED' && (
              <Panel title="Provide more information">
                <form onSubmit={e => { e.preventDefault(); action('information'); }}>
                  <Field label="Additional information">
                    <textarea required maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} />
                  </Field>
                  <button disabled={busy}>Send information</button>
                </form>
              </Panel>
            )}
            {['SUBMITTED', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED', 'PENDING_MANAGER_REVIEW'].includes(result.data.status) && (
              <button className="secondary danger" disabled={busy} onClick={() => action('cancel')}>
                Cancel application
              </button>
            )}
          </>
        )
      )}
    </>
  );
}

export function LoanDetails({ loan: l }: { loan: Loan }) {
  const { role } = useAuth();
  const [showPdfModal, setShowPdfModal] = useState(false);
  const userAccounts = useApi<Page<Account>>('/api/accounts');

  // Repayment state inside LoanDetails
  const [paying, setPaying] = useState(false);
  const [payAccountId, setPayAccountId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState(l.remainingAmount || l.amount);
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState<unknown>(null);

  useEffect(() => {
    if (!payAccountId && userAccounts.data?.content.length) {
      setPayAccountId(userAccounts.data.content[0].accountId);
    }
  }, [userAccounts.data, payAccountId]);

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payAccountId || !payAmount) return;
    setPayBusy(true);
    setPayError(null);
    try {
      await send(`/api/loans/${l.loanId}/pay`, {
        accountId: payAccountId,
        amount: Number(payAmount)
      });
      setPaying(false);
      window.location.reload();
    } catch (err) {
      setPayError(err);
    } finally {
      setPayBusy(false);
    }
  }

  return (
    <Panel title={`Facility ${l.loanNumber || `#${l.loanId}`}`}>
      <ErrorMessage error={payError} />
      <div className="details-grid">
        {role !== 'CUSTOMER' && <Detail label="CIF Number">{l.cifNumber || '0000000'}</Detail>}
        <Detail label="Facility Number">{l.loanNumber || `700000${l.loanId}`}</Detail>
        <Detail label="Customer">{l.customer}</Detail>
        <Detail label="Disbursement Account">{l.targetAccountNumber || 'Bank Account'}</Detail>
        <Detail label="Facility Amount">{money(l.amount)}</Detail>
        <Detail label="Paid Amount">{money(l.paidAmount || '0')}</Detail>
        <Detail label="Remaining Balance">{money(l.remainingAmount || l.amount)}</Detail>
        <Detail label="Type">{l.loanType}</Detail>
        <Detail label="Annual rate">{l.interestRate}%</Detail>
        <Detail label="Approved Officer ID">{l.approvedByOfficerId || 'EMP-001 (Bank Officer)'}</Detail>
        {l.approvedByManagerId && <Detail label="Approved Manager ID">{l.approvedByManagerId}</Detail>}
        <Detail label="Status"><StatusBadge status={l.status} /></Detail>
      </div>

      <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="button secondary" onClick={() => setShowPdfModal(true)}>
          🖨️ View &amp; Print Application (.PDF)
        </button>

        {l.status === 'APPROVED' && role === 'CUSTOMER' && (
          <button className="button primary" onClick={() => setPaying(true)}>
            💳 Pay Installment / Repay Loan
          </button>
        )}
      </div>

      {paying && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#34d399', marginTop: 0 }}>💳 Pay Loan Installment</h3>
          <form onSubmit={submitPayment}>
            <div className="two-column">
              <Field label="Source Payment Account *">
                <select
                  required
                  value={payAccountId ?? ''}
                  onChange={e => setPayAccountId(Number(e.target.value))}
                >
                  <option value="">-- Select Source Account --</option>
                  {userAccounts.data?.content.map(a => (
                    <option key={a.accountId} value={a.accountId}>
                      {a.accountNumber} ({a.accountType}) - Balance: LKR {money(a.balance)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Payment Amount (LKR) *">
                <input
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                />
              </Field>
            </div>

            <div className="actions" style={{ marginTop: '1rem' }}>
              <button disabled={payBusy}>{payBusy ? 'Processing…' : 'Submit Installment Payment'}</button>
              <button type="button" className="secondary" onClick={() => setPaying(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <h3>Application Information &amp; Purpose</h3>
      <p className="preserve-lines">{l.information}</p>

      {l.scrutinyData && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <h3>Scrutiny &amp; Vehicle Details</h3>
          <pre style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
            {l.scrutinyData}
          </pre>
        </div>
      )}

      <h3>Decision History &amp; Governance</h3>
      <div className="timeline">
        {l.decisions.map((d, i) => (
          <article key={i}>
            <strong>{d.action.replaceAll('_', ' ')}</strong>
            <small>{d.actor} · {date(d.createdAt)}</small>
            <p>{d.reason}</p>
          </article>
        ))}
      </div>

      {showPdfModal && (
        <ApplicationPdfModal
          loan={l}
          onClose={() => setShowPdfModal(false)}
        />
      )}
    </Panel>
  );
}

function loanActions(l: Loan | null, manager: boolean): string[] {
  if (!l) return [];
  if (manager) return l.status === 'PENDING_MANAGER_REVIEW' ? ['approve', 'reject'] : [];
  if (l.status === 'SUBMITTED') return ['review'];
  if (l.status === 'UNDER_REVIEW') return ['request-information', 'recommend', 'reject'];
  return [];
}

export function StaffLoansPage({ manager = false }: { manager?: boolean }) {
  const base = manager ? '/api/manager/loans' : '/api/employee/loans';
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState(manager ? 'PENDING_MANAGER_REVIEW' : 'SUBMITTED');
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<Loan | null>(null);
  const [action, setAction] = useState(manager ? 'approve' : 'review');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const result = useApi<Page<Loan>>(`${base}?${query({ page, status })}`, revision);
  const allowed = loanActions(selected, manager);

  async function decide(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (!confirm(`Record this ${action.replaceAll('-', ' ')} decision?`)) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await send<Loan>(`${base}/${selected.loanId}/${action}`, { reason });
      setSelected(updated);
      setAction(loanActions(updated, manager)[0] || '');
      setReason('');
      setRevision(r => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading
        title={manager ? 'Loan decisions' : 'Loan review'}
        subtitle={manager ? 'Final decisions on staff-recommended applications.' : 'Review submissions, request information, and make recommendations.'}
      />
      <Field label="Queue">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(0); setSelected(null); }}>
          {['SUBMITTED', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED', 'PENDING_MANAGER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <ErrorMessage error={error || result.error} />
      {result.loading ? (
        <Loading />
      ) : (
        result.data && (
          <Panel>
            {result.data.content.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Application</th>
                      <th>CIF No</th>
                      <th><Text value={"Customer"} /></th>
                      <th><Text value={"Amount"} /></th>
                      <th><Text value={"Status"} /></th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.content.map(l => (
                      <tr key={l.loanId}>
                        <td>{l.loanNumber || `#${l.loanId}`} · {l.loanType}</td>
                        <td><strong>{l.cifNumber || '0000000'}</strong></td>
                        <td>{l.customer}</td>
                        <td>{money(l.amount)}</td>
                        <td><StatusBadge status={l.status} /></td>
                        <td>
                          <button className="secondary" onClick={() => { setSelected(l); setReason(''); setAction(loanActions(l, manager)[0] || ''); }}>
                            <Text value={"Open"} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>No applications in this queue.</Empty>
            )}
            <Pagination data={result.data} onPage={setPage} />
          </Panel>
        )
      )}
      {selected && (
        <>
          <LoanDetails loan={selected} />
          <Panel title="Record a decision">
            <form onSubmit={decide}>
              <Field label="Action">
                <select value={action} onChange={e => setAction(e.target.value)}>
                  {allowed.map(a => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </Field>
              <Field label="Reason / message to customer">
                <textarea required maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} />
              </Field>
              <button disabled={busy}>{busy ? 'Recording…' : 'Record decision'}</button>
            </form>
            <p className="fine-print">
              Only valid workflow transitions are allowed. A staff reviewer cannot make the manager’s final decision on the same application.
            </p>
          </Panel>
        </>
      )}
    </>
  );
}

import ExchangeRates from '../components/ExchangeRates';
import { Text } from '../i18n';
import { BankStaffDashboard, BranchManagerDashboard, SystemAdministratorDashboard } from './StaffDashboards';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useApi, Heading, Panel, ErrorMessage, Loading, StatusBadge, Empty } from '../components/ui';
import { money, date } from '../api/client';
import type { Page, Account, Transaction } from '../types/api';

export default function DashboardPage() {
  const { role } = useAuth();
  if (role === 'EMPLOYEE') return <BankStaffDashboard />;
  if (role === 'MANAGER') return <BranchManagerDashboard />;
  if (role === 'ADMIN') return <SystemAdministratorDashboard />;
  return (
    <>
      <Heading title="Customer dashboard" subtitle="A clear view of what matters today." />
      <CustomerOverview />
    </>
  );
}

function Quick({ to, title, text }: { to: string; title: string; text: string }) {
  return (
    <Link className="quick-card" to={`/app/${to}`}>
      <h3><Text value={title} /></h3>
      <p><Text value={text} /></p>
    </Link>
  );
}

function CustomerOverview() {
  const accounts = useApi<Page<Account>>('/api/accounts?size=3');
  const transactions = useApi<Page<Transaction>>('/api/transactions?size=5');

  return (
    <>
      <div 
        className="welcome-banner glass-card"
        style={{
          background: `linear-gradient(135deg, rgba(10, 11, 16, 0.88) 0%, rgba(18, 19, 26, 0.92) 100%), url('/images/financial_chart_banner.jpeg') center/cover no-repeat`,
          borderRadius: '24px',
          padding: '2rem 2.25rem',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid var(--gold-border)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '2rem'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px' }}>
          <span className="eyebrow">YOUR NEXT CHAPTER</span>
          <h2 style={{ fontSize: '1.8rem', margin: '0.4rem 0 0.6rem 0', fontFamily: 'Playfair Display' }}>
            <Text value={"Make room for tomorrow."} />
          </h2>
          <p style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: '1.25rem' }}>
            <Text value={"Explore fixed deposits with clear terms, high yields and simulated returns."} />
          </p>
          <Link className="button" to="/app/fixed-deposits/new">
            Explore fixed deposits ↗
          </Link>
        </div>
        <span className="banner-symbol" style={{ opacity: 0.15, fontSize: '6rem', position: 'absolute', right: '1.5rem', bottom: '-1rem' }}>◇</span>
      </div>

      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.4rem', margin: 0, fontFamily: 'Playfair Display' }}><Text value={"Your accounts"} /></h2>
        <Link to="/app/accounts" style={{ fontSize: '0.9rem', fontWeight: 600 }}><Text value={"View all"} /> →</Link>
      </div>

      <ErrorMessage error={accounts.error} />
      {accounts.loading ? (
        <Loading />
      ) : (
        <div className="account-grid">
          {accounts.data?.content.map(a => (
            <Link className="account-card glass-card" key={a.accountId} to={`/app/accounts/${a.accountId}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{a.accountType}</span>
                <StatusBadge status={a.status} />
              </div>
              <strong style={{ fontSize: '1.75rem', fontFamily: 'Playfair Display', margin: '0.75rem 0 0.25rem 0', display: 'block' }}>{money(a.balance)}</strong>
              <small className="mono">{a.accountNumber}</small>
            </Link>
          ))}
          {accounts.data?.totalElements === 0 && <Empty>No accounts have been provisioned yet.</Empty>}
        </div>
      )}

      <div className="quick-grid" style={{ margin: '2rem 0' }}>
        <Quick to="transfers" title="Send money" text="Transfer to a saved beneficiary with instant verification" />
        <Quick to="bill-payments" title="Pay a bill" text="Take care of utility and everyday provider payments" />
        <Quick to="beneficiaries" title="Your people" text="Manage saved recipients and fast-transfer contacts" />
      </div>

      <ExchangeRates />

      <Panel title="Recent activity">
        <ErrorMessage error={transactions.error} />
        {transactions.loading ? (
          <Loading />
        ) : transactions.data?.content.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th><Text value={"Transaction"} /></th>
                  <th><Text value={"Date"} /></th>
                  <th><Text value={"Amount"} /></th>
                  <th><Text value={"Status"} /></th>
                </tr>
              </thead>
              <tbody>
                {transactions.data.content.map(t => (
                  <tr key={t.transactionId}>
                    <td>
                      <Link to={`/app/transactions/${t.transactionId}`}>{t.description}</Link>
                      <small className="mono">#{t.transactionId} · {t.transactionType}</small>
                    </td>
                    <td>{date(t.createdAt)}</td>
                    <td style={{ fontWeight: 600, fontFamily: 'JetBrains Mono' }}>{money(t.amount)}</td>
                    <td><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>Your transaction activity will appear here.</Empty>
        )}
      </Panel>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { GlassSelect } from '../../../components/common/GlassSelect';
import { 
    DollarSign, 
    TrendingUp, 
    ArrowUpRight, 
    ArrowDownRight, 
    Activity, 
    History,
    CreditCard,
    Wallet,
    PieChart,
    Calendar,
    Search,
    Filter,
    CheckCircle,
    Clock,
    User,
    ChevronDown,
    RefreshCw
} from 'lucide-react';
import api from '../../../services/api';

export const FinancialDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' or 'payouts'

    const fetchData = async () => {
        setLoading(true);
        try {
            const [summaryRes, transRes, payoutsRes] = await Promise.all([
                api.get('financials/admin/summary/'),
                api.get('financials/admin/transactions/'),
                api.get('financials/admin/payouts/')
            ]);
            setSummary(summaryRes.data);
            setTransactions(transRes.data);
            setPayouts(payoutsRes.data);
        } catch (error) {
            console.error("Error fetching financials:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleProcessPayout = async (payoutId) => {
        if (window.confirm("Mark this payout as processed?")) {
            try {
                await api.post(`financials/admin/${payoutId}/process_payout/`);
                fetchData();
            } catch (error) {
                console.error("Error processing payout:", error);
            }
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', color: 'white' }}>Financial Oversight</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>Track platform revenue, platform fees, and instructor payouts.</p>
                </div>
                <GlassButton onClick={fetchData} style={{ borderRadius: '14px', padding: '12px 20px', display: 'flex', gap: '8px' }}>
                    <RefreshCw size={18} /> Update Data
                </GlassButton>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                {[
                    { label: 'Total Revenue', value: summary?.total_revenue, icon: DollarSign, color: '#10b981', trend: '+12.5%' },
                    { label: 'Platform Fees', value: summary?.platform_fees, icon: Activity, color: '#0A84FF', trend: '+8.2%' },
                    { label: 'Paid Payouts', value: summary?.total_payouts, icon: CreditCard, color: '#BF5AF2', trend: null },
                    { label: 'Pending Payouts', value: summary?.pending_payouts, icon: Wallet, color: '#f59e0b', trend: null },
                ].map((metric, i) => (
                    <GlassCard key={i} heavy style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${metric.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: metric.color }}>
                                <metric.icon size={24} />
                            </div>
                            {metric.trend && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>
                                    <TrendingUp size={14} /> {metric.trend}
                                </span>
                            )}
                        </div>
                        <h4 style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '4px' }}>{metric.label}</h4>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white' }}>${parseFloat(metric.value || 0).toLocaleString()}</div>
                    </GlassCard>
                ))}
            </div>

            {/* Main Tabs Container */}
            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                         <button 
                            onClick={() => setActiveTab('transactions')}
                            style={{ 
                                padding: '12px 24px', 
                                borderRadius: '14px', 
                                border: 'none', 
                                background: activeTab === 'transactions' ? 'rgba(10, 132, 255, 0.15)' : 'transparent',
                                color: activeTab === 'transactions' ? '#0A84FF' : 'rgba(255,255,255,0.4)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.95rem',
                                border: activeTab === 'transactions' ? '1px solid rgba(10, 132, 255, 0.2)' : '1px solid transparent'
                            }}
                        >
                            Recent Transactions
                        </button>
                        <button 
                            onClick={() => setActiveTab('payouts')}
                            style={{ 
                                padding: '12px 24px', 
                                borderRadius: '14px', 
                                border: 'none', 
                                background: activeTab === 'payouts' ? 'rgba(191, 90, 242, 0.15)' : 'transparent',
                                color: activeTab === 'payouts' ? '#BF5AF2' : 'rgba(255,255,255,0.4)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.95rem',
                                border: activeTab === 'payouts' ? '1px solid rgba(191, 90, 242, 0.2)' : '1px solid transparent'
                            }}
                        >
                            Payout Management
                        </button>
                    </div>

                    <GlassCard heavy style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{activeTab === 'transactions' ? 'Entity / Detail' : 'Instructor'}</th>
                                        <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Amount</th>
                                        <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Date</th>
                                        <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '80px', textAlign: 'center' }}>
                                                <div className="spinner" style={{ margin: '0 auto' }}></div>
                                            </td>
                                        </tr>
                                    ) : (activeTab === 'transactions' ? transactions : payouts).length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '80px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>No records found.</td>
                                        </tr>
                                    ) : (
                                        (activeTab === 'transactions' ? transactions : payouts).map((item) => (
                                            <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: activeTab === 'transactions' ? 'rgba(0,132,255,0.1)' : 'rgba(191,90,242,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeTab === 'transactions' ? '#0A84FF' : '#BF5AF2' }}>
                                                            {activeTab === 'transactions' ? <DollarSign size={18} /> : <User size={18} />}
                                                        </div>
                                                        <div>
                                                            <p style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>{activeTab === 'transactions' ? item.course_title : item.instructor_name}</p>
                                                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{activeTab === 'transactions' ? `@${item.student_name}` : `via ${item.method}`}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ fontWeight: 700, color: 'white' }}>${parseFloat(item.amount).toLocaleString()}</div>
                                                    {activeTab === 'transactions' && <div style={{ fontSize: '0.7rem', color: '#10b981' }}>Fee: -${item.platform_fee}</div>}
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <span style={{ 
                                                        fontSize: '0.75rem', 
                                                        fontWeight: 700, 
                                                        padding: '4px 10px', 
                                                        borderRadius: '8px', 
                                                        background: item.status === 'completed' || item.status === 'processed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                        color: item.status === 'completed' || item.status === 'processed' ? '#10b981' : '#f59e0b',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{new Date(item.created_at).toLocaleDateString()}</div>
                                                    <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    {activeTab === 'payouts' && item.status === 'pending' ? (
                                                        <GlassButton 
                                                            onClick={() => handleProcessPayout(item.id)}
                                                            style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'rgba(191,90,242,0.1)', color: '#BF5AF2' }}
                                                        >
                                                            Process Payout
                                                        </GlassButton>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>No Action</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </div>

                <div style={{ width: '380px' }}>
                    <GlassCard heavy style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <TrendingUp size={22} color="var(--accent-blue)" /> Revenue Trends
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {summary?.trends?.map((trend, i) => (
                                <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{new Date(trend.month).toLocaleDateString([], { month: 'long', year: 'numeric' })}</span>
                                        <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 700 }}>${trend.revenue.toLocaleString()}</span>
                                    </div>
                                    <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: '3px', background: 'linear-gradient(to right, #0A84FF, #BF5AF2)', width: `${(trend.revenue / summary.total_revenue) * 100}%` }}></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>
                                        <span>{trend.orders} Orders</span>
                                        <span>Platform Share: ${(trend.revenue * 0.2).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};

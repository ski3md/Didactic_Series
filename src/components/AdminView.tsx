import React, { useState, useEffect } from 'react';
import Card from './ui/Card.tsx';
import SectionHeader from './ui/SectionHeader.tsx';
import { getAllUserData } from '../utils/tracking.ts';
import { UserActivity, QuizAnswer, SignOutLog, StoredUser, LoginHistory } from '../types.ts';
import { CheckCircleIcon, XCircleIcon, UserCircleIcon, ClockIcon } from './icons.tsx';
import { apiGetAllUsers, apiGetLoginHistory } from '../api/mockApi.ts';
import abpathMaterialAdminSummary from '../content/materials/abpathMaterialAdminSummary.json';

interface AdminUserData {
    activity: UserActivity;
    logins: LoginHistory[];
    details: StoredUser;
}

const parseUserAgent = (ua: string) => {
    let browser = 'Unknown';
    let os = 'Unknown';

    if (!ua) return { browser, os };
    
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('like Mac OS X')) os = 'iOS';

    return { browser, os };
};

const AdminView: React.FC = () => {
    const [allData, setAllData] = useState<Record<string, AdminUserData>>({});
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setIsLoadingData(true);
            try {
                const [activityData, usersData, loginsData] = await Promise.all([
                    getAllUserData(),
                    apiGetAllUsers(),
                    apiGetLoginHistory()
                ]);

                const combinedData: Record<string, AdminUserData> = {};
                
                const userList = (Object.values(usersData) as StoredUser[]).filter(
                    (u: StoredUser) => u.username.toLowerCase() !== 'admin'
                );

                for (const user of userList) {
                    const username = user.username;
                    combinedData[username] = {
                        details: user,
                        activity: activityData[username] || {},
                        logins: loginsData[username] || [],
                    };
                }
                
                setAllData(combinedData);
            } catch (e) {
                console.error("Failed to load user data", e);
            } finally {
                setIsLoadingData(false);
            }
        };
        loadData();
    }, []);
    
    const toggleUser = (username: string) => {
        setSelectedUser(selectedUser === username ? null : username);
    };

    const users = Object.entries(allData).sort(([a], [b]) => a.localeCompare(b));

    return (
        <div className="animate-fade-in">
            <SectionHeader
                title="Admin Dashboard"
                subtitle="Manage module data and user activity."
            />

            <AbpathMaterialExpansionQueueCard />

            <Card>
                 <h2 className="text-xl font-semibold font-serif text-slate-900 mb-4">User Activity & Analytics</h2>
                {isLoadingData ? (
                     <p className="text-slate-600 text-center py-4">Loading user data...</p>
                ) : (
                    <>
                        <p className="text-slate-700 text-sm mb-4">
                            Found {users.length} registered user(s). Click on a user to expand their activity log.
                        </p>
                        {users.length === 0 ? (
                            <p className="text-slate-600 text-center py-4">No user data has been recorded yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {users.map(([username, userData]) => {
                                    const typedUserData = userData as AdminUserData;
                                    return (
                                    <div key={username} className="border border-slate-200 rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => toggleUser(username)}
                                            className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 transition-colors flex justify-between items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                                            aria-expanded={selectedUser === username}
                                            aria-controls={`user-data-${username}`}
                                        >
                                           <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-8 text-sm w-full">
                                                <div className="font-semibold text-slate-900 flex-1 min-w-0">
                                                    <p className="truncate">{username}</p>
                                                </div>
                                                <div className="text-slate-600 flex-1 min-w-0">
                                                    <p className="truncate">{typedUserData.details.email}</p>
                                                </div>
                                                <div className="text-slate-600 flex-1">
                                                    {typedUserData.logins[0] ? new Date(typedUserData.logins[0].timestamp).toLocaleString() : 'Never'}
                                                </div>
                                            </div>
                                            <span className={`transform transition-transform duration-200 ml-4 ${selectedUser === username ? 'rotate-180' : ''}`}>
                                                <svg className="h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </span>
                                        </button>
                                        {selectedUser === username && (
                                            <div id={`user-data-${username}`} className="p-4 sm:p-6 bg-white space-y-6">
                                                {Object.keys(typedUserData.activity).length === 0 && typedUserData.logins.length === 0 && <p>No activity recorded for this user.</p>}
                                                <UserDetails data={typedUserData} />
                                                {Object.keys(typedUserData.activity).length > 0 && <ActivityLogs activity={typedUserData.activity} />}
                                            </div>
                                        )}
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
};

const AbpathMaterialExpansionQueueCard: React.FC = () => (
    <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-5">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Admin-only material governance</p>
                <h2 className="text-xl font-semibold font-serif text-slate-900">ABPath Material Expansion Queue</h2>
                <p className="text-sm text-slate-600 mt-1">
                    Read-only summary of unreviewed AP/CP generation-queue material. No promotion controls are exposed here.
                </p>
            </div>
            <span className="self-start rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                Review required
            </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <QueueMetric label="Queue total" value={abpathMaterialAdminSummary.totals.queueEntries} />
            <QueueMetric label="AP queue items" value={abpathMaterialAdminSummary.totals.apQueueItems} />
            <QueueMetric label="CP queue items" value={abpathMaterialAdminSummary.totals.cpQueueItems} />
            <QueueMetric label="Required material-set items" value={abpathMaterialAdminSummary.totals.requiredMaterialSetItems} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Review / Promotion Status</h3>
                <dl className="space-y-2 text-sm">
                    {abpathMaterialAdminSummary.statusLabels.review.map(({ status, label, count }) => (
                        <div key={status} className="flex justify-between gap-4">
                            <dt className="text-slate-600">{label}</dt>
                            <dd className="font-semibold text-slate-900">{count.toLocaleString()}</dd>
                        </div>
                    ))}
                    {abpathMaterialAdminSummary.statusLabels.promotion.map(({ status, label, count }) => (
                        <div key={status} className="flex justify-between gap-4">
                            <dt className="text-slate-600">{label}</dt>
                            <dd className="font-semibold text-slate-900">{count.toLocaleString()}</dd>
                        </div>
                    ))}
                </dl>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Material Kinds</h3>
                <dl className="space-y-2 text-sm">
                    {abpathMaterialAdminSummary.materialKindPreview.map(({ status, label, count }) => (
                        <div key={status} className="flex justify-between gap-4">
                            <dt className="text-slate-600">{label}</dt>
                            <dd className="font-semibold text-slate-900">{count.toLocaleString()}</dd>
                        </div>
                    ))}
                </dl>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Batch 001 Review Rows</h3>
                <dl className="space-y-2 text-sm">
                    {abpathMaterialAdminSummary.batches.map((batch) => (
                        <div key={batch.batchId} className="flex justify-between gap-4">
                            <dt className="text-slate-600">{batch.domain} batch 001</dt>
                            <dd className="font-semibold text-slate-900">{batch.rowCount.toLocaleString()}</dd>
                        </div>
                    ))}
                </dl>
                <p className="text-xs text-slate-500 mt-3">
                    Both batches remain review-queue materialization candidates, not learner-facing promoted curriculum.
                </p>
            </div>
        </div>

        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/80 p-4">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">Guardrails</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-amber-950">
                {abpathMaterialAdminSummary.guardrails.visible.map((guardrail) => (
                    <li key={guardrail}>{guardrail}</li>
                ))}
            </ul>
        </div>
    </Card>
);

const QueueMetric: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{value.toLocaleString()}</p>
    </div>
);

const UserDetails: React.FC<{ data: AdminUserData }> = ({ data }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="!shadow-md !mb-0 border border-slate-200 bg-slate-50/50">
                <h3 className="text-lg font-semibold font-serif text-slate-900 mb-4 flex items-center"><UserCircleIcon className="h-5 w-5 mr-2 text-sky-700"/> User Information</h3>
                <div className="text-sm space-y-2">
                    <p><strong className="font-semibold text-slate-700">Username:</strong> {data.details.username}</p>
                    <p><strong className="font-semibold text-slate-700">Email:</strong> {data.details.email}</p>
                    <p><strong className="font-semibold text-slate-700">Visited Sections:</strong></p>
                    <div className="flex flex-wrap gap-2 pt-1">
                        {data.activity.visitedSections && data.activity.visitedSections.length > 0
                            ? data.activity.visitedSections.map(section => <span key={section} className="text-xs bg-sky-100 text-sky-800 font-medium px-2 py-1 rounded-md">{section}</span>)
                            : <span className="text-xs text-slate-600">None</span>
                        }
                    </div>
                </div>
            </Card>
             <Card className="!shadow-md !mb-0 border border-slate-200 bg-slate-50/50">
                <h3 className="text-lg font-semibold font-serif text-slate-900 mb-4 flex items-center"><ClockIcon className="h-5 w-5 mr-2 text-sky-700"/> Login History</h3>
                {data.logins.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto pr-2">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-slate-600 uppercase">
                                    <th className="pb-2">Date & Time</th>
                                    <th className="pb-2">Device</th>
                                    <th className="pb-2">Simulated IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.logins.map((login, i) => {
                                    const { os, browser } = parseUserAgent(login.userAgent);
                                    return (
                                        <tr key={i} className="border-b border-slate-200 last:border-0">
                                            <td className="py-2">{new Date(login.timestamp).toLocaleString()}</td>
                                            <td className="py-2">{os} / {browser}</td>
                                            <td className="py-2">{login.ip}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="text-sm text-slate-600">No login history found.</p>}
            </Card>
        </div>
    );
};

const ActivityLogs: React.FC<{ activity: UserActivity }> = ({ activity }) => (
    <div className="space-y-4">
        {activity.Analysis && <QuizDataDisplay title="Analysis Phase Quiz" data={Object.values(activity.Analysis)} />}
        {activity.Evaluation && <QuizDataDisplay title="Evaluation Phase Quiz" data={activity.Evaluation} />}
        {activity.VisualChallenge && <QuizDataDisplay title="Visual Challenge" data={Object.values(activity.VisualChallenge)} />}
        {activity.SignOutSimulator && <SignOutDataDisplay title="Sign-Out Simulator" data={activity.SignOutSimulator} />}
    </div>
);

const QuizDataDisplay: React.FC<{ title: string; data: QuizAnswer[] }> = ({ title, data }) => (
    <Card className="!shadow-md !mb-0 border border-slate-200 bg-slate-50/50">
        <h3 className="text-lg font-semibold font-serif text-slate-900 mb-4">{title}</h3>
        <ul className="space-y-4">
            {data.map((answer, index) => (
                <li key={index} className="p-3 bg-white rounded-md border border-slate-200">
                    <p className="font-semibold text-sm text-slate-800">{answer.question}</p>
                    <div className="flex items-center mt-2">
                        {answer.isCorrect
                            ? <CheckCircleIcon className="h-5 w-5 text-teal-500 mr-2 flex-shrink-0" />
                            : <XCircleIcon className="h-5 w-5 text-rose-500 mr-2 flex-shrink-0" />
                        }
                        <p className="text-sm text-slate-700">Answered: <span className="font-medium">{answer.selectedAnswer}</span></p>
                    </div>
                </li>
            ))}
        </ul>
    </Card>
);

const SignOutDataDisplay: React.FC<{ title: string; data: SignOutLog[] }> = ({ title, data }) => (
    <Card className="!shadow-md !mb-0 border border-slate-200 bg-slate-50/50">
        <h3 className="text-lg font-semibold font-serif text-slate-900 mb-4">{title}</h3>
        <ul className="space-y-4">
            {data.map((log, index) => (
                <li key={index} className="p-3 bg-white rounded-md border border-slate-200">
                    <p className="font-semibold text-sm text-slate-800">Case: {log.caseTopic}</p>
                    <div className="mt-2 text-sm text-slate-700">
                        <p><strong>User Report:</strong></p>
                        <pre className="whitespace-pre-wrap font-sans bg-slate-100 p-2 rounded-md mt-1">{log.userReport}</pre>
                    </div>
                </li>
            ))}
        </ul>
    </Card>
);


export default AdminView;

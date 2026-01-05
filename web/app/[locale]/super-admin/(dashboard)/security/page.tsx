"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "@/i18n/routing";
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    Eye,
    Fingerprint,
    Globe,
    Lock,
    Settings,
    Shield,
    ShieldAlert,
    ShieldCheck
} from "lucide-react";

export default function SecurityHubPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <div className="flex items-center gap-2 text-indigo-600 mb-1">
                        <Link href="/super-admin" className="hover:underline flex items-center gap-1 text-xs font-bold uppercase tracking-widest">
                            <ArrowLeft size={12} /> Dashboard
                        </Link>
                   </div>
                   <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                       <ShieldAlert className="text-rose-500 h-10 w-10" />
                       Security Hub
                   </h1>
                   <p className="text-muted-foreground mt-2 font-medium">Platform-wide threat monitoring and security stance.</p>
                </div>
                
                <div className="flex items-center gap-3 bg-slate-900 text-white p-4 rounded-3xl shadow-xl border border-indigo-500/20">
                     <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                         <ShieldCheck className="text-indigo-400" />
                     </div>
                     <div>
                         <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Overall Status</p>
                         <p className="text-lg font-black">Grade A+</p>
                     </div>
                </div>
            </div>

            {/* Security Overview Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-3xl border-foreground/5 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Fingerprint className="h-4 w-4 text-indigo-500" />
                            Auth Attempts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">24.5k</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-emerald-500 font-bold">Stable</span> last 24h
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-foreground/5 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Shield className="h-4 w-4 text-emerald-500" />
                            Blocked IPS
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">128</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-rose-500 font-bold">+12</span> new detections
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-foreground/5 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Activity className="h-4 w-4 text-amber-500" />
                            DDoS Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">Idle</div>
                        <p className="text-xs text-emerald-500 font-bold mt-1">
                            Protection Active
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-foreground/5 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Globe className="h-4 w-4 text-blue-500" />
                            Global Nodes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">Active</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            All regions synced
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 {/* Real-time Threat Map Placeholder */}
                 <Card className="lg:col-span-2 rounded-3xl border-foreground/5 shadow-sm bg-slate-950 text-white overflow-hidden relative min-h-[400px]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(79,70,229,0.1),transparent)]" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-indigo-400" />
                            Global Threat Intelligence
                        </CardTitle>
                        <CardDescription className="text-slate-400">Live visualization of cross-tenant traffic anomalies.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-64">
                         <div className="relative">
                            <div className="h-32 w-32 rounded-full border border-indigo-500/30 animate-ping absolute inset-0 m-auto" />
                            <div className="h-32 w-32 rounded-full border border-indigo-500/20 animate-ping absolute inset-0 m-auto delay-75" />
                            <Globe className="h-20 w-20 text-indigo-500 opacity-20 relative z-10" />
                         </div>
                         <p className="mt-8 text-slate-500 font-medium text-sm italic">Scanning high-risk traffic vectors...</p>
                         
                         <div className="grid grid-cols-3 gap-8 mt-8 w-full">
                            <div className="text-center">
                                <p className="text-2xl font-black text-rose-500">03</p>
                                <p className="text-[10px] font-bold uppercase tracking-tight text-slate-500">Critical Alerts</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-amber-500">14</p>
                                <p className="text-[10px] font-bold uppercase tracking-tight text-slate-500">Warning High</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-emerald-500">99%</p>
                                <p className="text-[10px] font-bold uppercase tracking-tight text-slate-500">Filtered</p>
                            </div>
                         </div>
                    </CardContent>
                 </Card>

                 {/* Security Controls */}
                 <Card className="rounded-3xl border-foreground/5 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-amber-500" />
                            Active Protocols
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                             <div className="flex items-center justify-between text-sm mb-1">
                                <span className="font-bold">MFA Enforcement</span>
                                <Badge className="bg-emerald-500">Active</Badge>
                             </div>
                             <Progress value={85} className="h-1.5" />
                             <p className="text-[10px] text-muted-foreground italic">85% of admin accounts have MFA active.</p>
                        </div>
                        
                        <div className="space-y-2">
                             <div className="flex items-center justify-between text-sm mb-1">
                                <span className="font-bold">Encryption (AES-256)</span>
                                <Badge className="bg-emerald-500">Optimal</Badge>
                             </div>
                             <Progress value={100} className="h-1.5" />
                        </div>

                        <div className="pt-4 border-t space-y-3">
                             <Button className="w-full justify-between rounded-xl bg-slate-900 border-none hover:bg-slate-800 h-12">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-indigo-400" />
                                    <span>Access Report</span>
                                </div>
                                <ArrowLeft className="rotate-180 h-4 w-4" />
                             </Button>
                             <Button variant="outline" className="w-full justify-between rounded-xl h-12 text-rose-500 border-rose-100 hover:bg-rose-50">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>System Lockdown</span>
                                </div>
                             </Button>
                        </div>
                     </CardContent>
                 </Card>

                 {/* Local Development / Multi-tenant Testing Guide */}
                 <Card className="rounded-3xl border-foreground/5 shadow-sm border-indigo-100 bg-indigo-50/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-indigo-900">
                            <Settings className="h-5 w-5 text-indigo-500" />
                            Developer Toolkit
                        </CardTitle>
                        <CardDescription className="text-indigo-700/70 font-medium">Local Multi-tenant Testing Workflow.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-[11px] text-indigo-900/80 leading-relaxed font-medium">
                            To simulate multiple projects on your machine, map tenant domains in your <code className="bg-indigo-100 px-1 rounded text-indigo-600 font-bold">hosts</code> file:
                        </p>
                        
                        <div className="bg-slate-900 rounded-2xl p-4 font-mono text-[10px] text-white/70 overflow-x-auto shadow-inner">
                            <p className="text-emerald-400"># Windows: System32\drivers\etc\hosts</p>
                            <p className="mt-2 text-indigo-300">127.0.0.1  platform.localhost</p>
                            <p className="text-indigo-300">127.0.0.1  customer1.localhost</p>
                            <p className="text-indigo-300">127.0.0.1  luxury-store.localhost</p>
                        </div>

                        <div className="pt-2">
                             <p className="text-[10px] font-bold text-indigo-900/60 uppercase tracking-widest mb-2">Testing Flow</p>
                             <ul className="text-xs space-y-2 text-indigo-900/80 font-medium">
                                <li className="flex items-start gap-2">
                                    <div className="h-4 w-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] mt-0.5 shrink-0 font-bold">1</div>
                                    <span>Set Tenant domain as <code className="text-indigo-600">t1.localhost</code></span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="h-4 w-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] mt-0.5 shrink-0 font-bold">2</div>
                                    <span>Use "Enter Portal" to jump to domain.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="h-4 w-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] mt-0.5 shrink-0 font-bold">3</div>
                                    <span>Verify data isolation across domains.</span>
                                </li>
                             </ul>
                        </div>
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}

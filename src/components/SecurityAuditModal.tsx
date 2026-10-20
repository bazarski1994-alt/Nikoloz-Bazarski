import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  X,
  ExternalLink,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  Download,
  BookOpen,
  Lock,
  Layers,
  Sliders,
  Cpu,
  Globe,
  Camera,
  Server,
  ArrowRight,
  Shield,
  FileText
} from 'lucide-react';
import type { DiscoveredDevice, SecurityIssue, EducationalRemediationOption } from '../types.ts';
import { useTranslation } from '../utils/i18n.tsx';
import { getBrowserUrl, isBrowserAccessiblePort } from '../utils/securityAudit.ts';

interface SecurityAuditModalProps {
  device: DiscoveredDevice | null;
  onClose: () => void;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({ device, onClose }) => {
  const { t, lang } = useTranslation();
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [appliedOptions, setAppliedOptions] = useState<Record<string, boolean>>({});

  if (!device) return null;

  const issues = device.securityIssues || [];
  const activeIssue = issues.find((i) => i.id === selectedIssueId) || issues[0] || null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const toggleOption = (optId: string) => {
    setAppliedOptions((prev) => ({
      ...prev,
      [optId]: !prev[optId],
    }));
  };

  const exportReport = () => {
    const lines = [
      `=============================================================`,
      `NETCAM SECURITY AUDIT & HARDENING REPORT (${lang.toUpperCase()})`,
      `Target IP: ${device.ip}`,
      `Device: ${device.vendor || 'Unknown'} - ${device.model || device.hostname || 'Device'}`,
      `MAC: ${device.mac || 'N/A'}`,
      `Overall Risk Level: ${device.riskLevel.toUpperCase()}`,
      `Total Issues Discovered: ${issues.length}`,
      `Date: ${new Date().toLocaleString()}`,
      `=============================================================`,
      ``,
    ];

    issues.forEach((iss, index) => {
      lines.push(`[${index + 1}] ${iss.title} (${iss.severity.toUpperCase()})`);
      if (iss.port) lines.push(`Affected Port: ${iss.port}`);
      if (iss.cveOrRef) lines.push(`Reference / CVE: ${iss.cveOrRef}`);
      lines.push(`Description: ${iss.description}`);
      if (iss.technicalDetails) {
        lines.push(`Root Cause & Mechanism: ${iss.technicalDetails}`);
      }
      if (iss.threatModel) {
        lines.push(`Threat Model & Impact: ${iss.threatModel}`);
      }
      if (iss.safeAuditCommand) {
        lines.push(`Safe Verification Command: ${iss.safeAuditCommand}`);
      }
      if (iss.remediationOptions && iss.remediationOptions.length > 0) {
        lines.push(`Remediation Options:`);
        iss.remediationOptions.forEach((opt) => {
          const status = appliedOptions[opt.id] ? '[DONE]' : '[PENDING]';
          lines.push(`  ${status} ${opt.title} - ${opt.description}`);
          opt.actionSteps.forEach((s) => lines.push(`     * ${s}`));
        });
      } else {
        lines.push(`Remediation: ${iss.remediation}`);
      }
      lines.push(``);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-${device.ip}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
              device.riskLevel === 'critical'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : device.riskLevel === 'high'
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {t.securityLabTitle}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700">
                  {device.ip}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  device.riskLevel === 'critical'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                    : device.riskLevel === 'high'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                    : device.riskLevel === 'medium'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                }`}>
                  {device.riskLevel.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {device.vendor || 'Unknown'} {device.model || device.hostname || ''} • {issues.length} {t.vulnerabilitiesFound.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportReport}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-medium transition-colors"
              title={t.exportReportBtn}
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.exportReportBtn}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label={t.closeBtn}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-zinc-800/80">
          {/* Left Column: List of Detected Issues */}
          <div className="md:col-span-4 p-4 space-y-2 bg-zinc-950/50 overflow-y-auto max-h-[75vh]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
              <span>{t.vulnerabilitiesFound}</span>
              <span className="font-mono text-zinc-500">{issues.length}</span>
            </div>

            {issues.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 text-xs">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <span>{t.safeStatus}</span>
              </div>
            ) : (
              issues.map((iss) => {
                const isSelected = (activeIssue && activeIssue.id === iss.id) || issues[0]?.id === iss.id;
                let badgeStyle = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
                if (iss.severity === 'critical') badgeStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/50';
                else if (iss.severity === 'high') badgeStyle = 'bg-orange-500/20 text-orange-300 border-orange-500/50';
                else if (iss.severity === 'medium') badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/50';

                return (
                  <button
                    key={iss.id}
                    type="button"
                    onClick={() => setSelectedIssueId(iss.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 border-cyan-500/60 ring-1 ring-cyan-500/40 shadow-lg'
                        : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${badgeStyle}`}>
                        {iss.severity}
                      </span>
                      {iss.port && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          Port {iss.port}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-xs text-zinc-200 line-clamp-2">
                      {iss.title}
                    </div>
                  </button>
                );
              })
            )}

            {/* Device Quick Web Link if any */}
            {device.openPorts.some((p) => isBrowserAccessiblePort(p.port).isWeb) && (
              <div className="pt-3 border-t border-zinc-800/80 mt-4">
                <div className="text-[11px] font-semibold text-zinc-400 mb-1.5">
                  {t.openInBrowser}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {device.openPorts
                    .filter((p) => isBrowserAccessiblePort(p.port).isWeb)
                    .map((p) => {
                      const url = getBrowserUrl(device.ip, p.port);
                      return (
                        <a
                          key={p.port}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800/60 px-2.5 py-1 rounded-lg text-xs font-mono transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 text-emerald-400" />
                          <span>{p.port} ({isBrowserAccessiblePort(p.port).label})</span>
                        </a>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: In-depth Educational Breakdown & All Options */}
          <div className="md:col-span-8 p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[75vh]">
            {activeIssue ? (
              <>
                {/* Issue Title & Summary */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border uppercase ${
                      activeIssue.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                        : activeIssue.severity === 'high'
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    }`}>
                      {activeIssue.severity}
                    </span>
                    {activeIssue.port && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        Port {activeIssue.port}
                      </span>
                    )}
                    {activeIssue.cveOrRef && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                        {activeIssue.cveOrRef}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {activeIssue.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    {activeIssue.description}
                  </p>
                </div>

                {/* 1. Technical Explanation: "Объяснить что к чему" */}
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                    <BookOpen className="w-4 h-4" />
                    <span>{t.explanationTitle}</span>
                  </div>
                  {activeIssue.technicalDetails ? (
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                      {activeIssue.technicalDetails}
                    </p>
                  ) : null}

                  {activeIssue.threatModel && (
                    <div className="mt-2 p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs text-rose-200 space-y-1">
                      <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>{t.threatModelTitle}</span>
                      </div>
                      <p className="leading-relaxed">{activeIssue.threatModel}</p>
                    </div>
                  )}
                </div>

                {/* 2. Safe Testing & Verification (For Learning & Safety) */}
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <Terminal className="w-4 h-4" />
                    <span>{t.testingSafetyTitle}</span>
                  </div>

                  {activeIssue.safeAuditCommand && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-zinc-400 font-medium">
                        {t.safeAuditCommandLabel}
                      </div>
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-emerald-300">
                        <span className="truncate">{activeIssue.safeAuditCommand}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(activeIssue.safeAuditCommand || '', 'audit-cmd')}
                          className="text-zinc-400 hover:text-white p-1 rounded transition-colors shrink-0"
                          title={t.copyLabel}
                        >
                          {copiedCmd === 'audit-cmd' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeIssue.testVerificationSteps && activeIssue.testVerificationSteps.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] text-zinc-400 font-medium">
                        {t.verificationStepsTitle}
                      </div>
                      <ul className="space-y-1.5 text-xs text-zinc-300">
                        {activeIssue.testVerificationSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2 bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 3. All Defensive Options & Remediation ("Предложить все варианты") */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-zinc-200 text-xs font-bold uppercase tracking-wider">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>{t.allRemediationOptionsTitle}</span>
                  </div>

                  {activeIssue.remediationOptions && activeIssue.remediationOptions.length > 0 ? (
                    <div className="space-y-3">
                      {activeIssue.remediationOptions.map((opt) => {
                        const isDone = appliedOptions[opt.id] || false;
                        return (
                          <div
                            key={opt.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isDone
                                ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/30'
                                : 'bg-zinc-900/90 border-zinc-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                    opt.priority === 'immediate'
                                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                                      : opt.priority === 'high'
                                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                                  }`}>
                                    {opt.priority}
                                  </span>
                                  <span className="font-semibold text-xs sm:text-sm text-zinc-100">
                                    {opt.title}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                  {opt.description}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleOption(opt.id)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors shrink-0 cursor-pointer ${
                                  isDone
                                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700'
                                }`}
                              >
                                <CheckCircle2 className={`w-3.5 h-3.5 ${isDone ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                <span className="hidden sm:inline">{t.appliedOptionCheck}</span>
                              </button>
                            </div>

                            {/* Action Steps */}
                            <div className="mt-2.5 pt-2 border-t border-zinc-800/60 space-y-1">
                              {opt.actionSteps.map((step, sIdx) => (
                                <div key={sIdx} className="text-xs text-zinc-300 flex items-start gap-1.5 font-sans">
                                  <ArrowRight className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>

                            {/* Optional Command Example */}
                            {opt.commandExample && (
                              <div className="mt-2 p-2 rounded bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 flex items-center justify-between">
                                <code className="truncate">{opt.commandExample}</code>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(opt.commandExample || '', opt.id)}
                                  className="text-zinc-400 hover:text-white p-0.5 shrink-0"
                                >
                                  {copiedCmd === opt.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                      <span className="font-semibold text-emerald-400">{t.howToRemediate} </span>
                      {activeIssue.remediation}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-zinc-500">
                <span>{t.noDevicesFound}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between gap-4">
          <div className="text-xs text-zinc-400 hidden sm:block">
            {issues.length} {t.vulnerabilitiesFound.toLowerCase()} • {Object.values(appliedOptions).filter(Boolean).length} отмечено как выполнено
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={exportReport}
              className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-zinc-200 border border-zinc-700 text-xs"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.exportReportBtn}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {t.closeBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

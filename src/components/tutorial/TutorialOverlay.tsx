import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, BookOpen, CheckCircle2, Loader2, HardHat } from 'lucide-react';
import { useTutorial, TUTORIAL_STEPS } from '../../contexts/TutorialContext';

interface SpotlightRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

const PADDING = 12;

export const TutorialOverlay: React.FC = () => {
    const { isActive, currentStep, stepConfig, stepIndex, skipTutorial, nextStep, prevStep } = useTutorial();
    const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const tooltipRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);

    const isCompleteStep = currentStep === 'completed';
    const isWaitingBuild = currentStep === 'waiting-build';

    const updatePosition = useCallback(() => {
        if (!stepConfig.targetSelector || !isActive) {
            setSpotlightRect(null);
            return;
        }

        const el = document.querySelector(stepConfig.targetSelector) as HTMLElement | null;
        if (!el) {
            setSpotlightRect(null);
            return;
        }

        const rect = el.getBoundingClientRect();
        const spotlight: SpotlightRect = {
            top: rect.top - PADDING,
            left: rect.left - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
        };
        setSpotlightRect(spotlight);

        const pos = stepConfig.position ?? 'bottom';
        const tooltipWidth = 380;
        const tooltipHeight = 220;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let style: React.CSSProperties = { position: 'fixed', width: tooltipWidth, zIndex: 2147483647 };

        const clampTop = (t: number) => Math.min(Math.max(t, 8), vh - tooltipHeight - 8);
        const clampLeft = (l: number) => Math.min(Math.max(l, 8), vw - tooltipWidth - 8);

        if (pos === 'bottom') {
            const proposedTop = spotlight.top + spotlight.height + 16;
            style.top = (proposedTop + tooltipHeight > vh - 8)
                ? Math.max(spotlight.top - tooltipHeight - 16, 8)
                : proposedTop;
            style.left = clampLeft(spotlight.left);
        } else if (pos === 'top') {
            const proposedTop = spotlight.top - tooltipHeight - 16;
            style.top = proposedTop < 8 ? spotlight.top + spotlight.height + 16 : proposedTop;
            style.left = clampLeft(spotlight.left);
        } else if (pos === 'right') {
            const proposedLeft = spotlight.left + spotlight.width + 16;
            if (proposedLeft + tooltipWidth > vw - 8) {
                style.top = Math.max(spotlight.top - tooltipHeight - 16, 8);
                style.left = clampLeft(spotlight.left + spotlight.width / 2 - tooltipWidth / 2);
            } else {
                // スポットライト上端より少し上に表示してスッキリ見せる
                style.top = clampTop(spotlight.top - 24);
                style.left = proposedLeft;
            }
        } else if (pos === 'left') {
            const proposedLeft = spotlight.left - tooltipWidth - 16;
            if (proposedLeft < 8) {
                const altLeft = spotlight.left + spotlight.width + 16;
                if (altLeft + tooltipWidth < vw - 8) {
                    style.top = clampTop(spotlight.top);
                    style.left = altLeft;
                } else {
                    style.top = Math.max(spotlight.top - tooltipHeight - 16, 8);
                    style.left = clampLeft(spotlight.left + spotlight.width / 2 - tooltipWidth / 2);
                }
            } else {
                style.top = clampTop(spotlight.top);
                style.left = proposedLeft;
            }
        } else {
            style.top = '50%';
            style.left = '50%';
            style.transform = 'translate(-50%, -50%)';
        }

        setTooltipStyle(style);
    }, [stepConfig, isActive]);

    useEffect(() => {
        if (!isActive) return;

        const observe = () => {
            updatePosition();
            rafRef.current = requestAnimationFrame(observe);
        };
        rafRef.current = requestAnimationFrame(observe);

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isActive, updatePosition]);

    if (!isActive) return null;

    const isCenter = stepConfig.position === 'center' || !stepConfig.targetSelector;

    return (
        <>
            {/* Overlay — pointer-events-none so users can always click through to the highlighted element */}
            {spotlightRect ? (
                <svg
                    className="fixed inset-0 pointer-events-none"
                    style={{ zIndex: 2147483645, width: '100vw', height: '100vh' }}
                >
                    <defs>
                        <mask id="tutorial-mask">
                            <rect width="100%" height="100%" fill="white" />
                            <rect
                                x={spotlightRect.left}
                                y={spotlightRect.top}
                                width={spotlightRect.width}
                                height={spotlightRect.height}
                                rx={10}
                                fill="black"
                            />
                        </mask>
                    </defs>
                    <rect
                        width="100%"
                        height="100%"
                        fill="rgba(0,0,0,0.55)"
                        mask="url(#tutorial-mask)"
                    />
                    <rect
                        x={spotlightRect.left}
                        y={spotlightRect.top}
                        width={spotlightRect.width}
                        height={spotlightRect.height}
                        rx={10}
                        fill="none"
                        stroke="#1a73e8"
                        strokeWidth={2.5}
                        opacity={0.8}
                    />
                </svg>
            ) : (
                <div
                    className="fixed inset-0 pointer-events-none"
                    style={{ zIndex: 2147483645, background: 'rgba(0,0,0,0.45)' }}
                />
            )}

            {/* Tooltip / Modal */}
            {isCenter ? (
                <div
                    className="fixed inset-0 flex items-center justify-center"
                    style={{ zIndex: 2147483647 }}
                >
                    <CompletionCard onClose={skipTutorial} />
                </div>
            ) : isWaitingBuild ? (
                <WaitingBuildCard
                    style={tooltipStyle}
                    onSkip={skipTutorial}
                    onPrev={prevStep}
                />
            ) : (
                <div
                    ref={tooltipRef}
                    style={tooltipStyle}
                    className="bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden"
                >
                    <TutorialTooltip
                        stepIndex={stepIndex}
                        onSkip={skipTutorial}
                        onNext={nextStep}
                        onPrev={prevStep}
                        isCompleteStep={isCompleteStep}
                    />
                </div>
            )}
        </>
    );
};

interface TooltipProps {
    stepIndex: number;
    onSkip: () => void;
    onNext: () => void;
    onPrev: () => void;
    isCompleteStep: boolean;
}

// アクション待ちのステップ（ユーザー操作でのみ進むべきステップ）— 次へボタンを出さない
const ACTION_STEPS = new Set([
    'create-project',       // ボタンクリックで自動遷移
    'project-form-open',    // フォーム送信で自動遷移
    'create-container',     // ボタンクリックで自動遷移
    'container-form-open',  // フォーム送信で自動遷移
    'waiting-build',        // ビルド完了で自動遷移（専用カード）
    'enable-ingress',       // ボタンクリックで自動遷移
    'open-delete',          // コンテナ削除で自動遷移
]);

const TutorialTooltip: React.FC<TooltipProps> = ({ stepIndex, onSkip, onNext, onPrev, isCompleteStep }) => {
    const { stepConfig, currentStep } = useTutorial();
    const isFirst = stepIndex === 0;
    // アクション待ちステップは「次へ」を出さない（ユーザー操作で自動遷移する）
    const isActionStep = ACTION_STEPS.has(currentStep);

    return (
        <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                        <BookOpen size={14} className="text-white" />
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">チュートリアル</span>
                </div>
                <button
                    onClick={onSkip}
                    className="text-gray-300 hover:text-gray-500 transition-colors"
                    title="スキップ"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-gray-900 leading-tight">{stepConfig.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{stepConfig.description}</p>
            </div>

            {/* Action hint */}
            {stepConfig.action && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                    <ChevronRight size={12} className="text-blue-400 shrink-0" />
                    <span className="text-[11px] text-blue-600 font-medium">{stepConfig.action}</span>
                </div>
            )}

            {/* Progress dots + nav */}
            <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                    {TUTORIAL_STEPS.map((s, i) => (
                        <div
                            key={s.step}
                            className={`rounded-full transition-all ${
                                i === stepIndex
                                    ? 'w-3 h-2 bg-blue-500'
                                    : i < stepIndex
                                        ? 'w-2 h-2 bg-blue-200'
                                        : 'w-2 h-2 bg-gray-200'
                            }`}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-1.5">
                    {/* 戻るボタン：最初以外で常に表示 */}
                    {!isFirst && (
                        <button
                            onClick={onPrev}
                            className="flex items-center gap-0.5 px-2.5 py-1.5 border border-gray-200 text-gray-500 text-[11px] font-bold rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <ChevronLeft size={11} />
                            戻る
                        </button>
                    )}

                    {/* スキップ */}
                    <button
                        onClick={onSkip}
                        className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors px-1"
                    >
                        終了
                    </button>

                    {/* 完了ステップは「完了」ボタン、アクション待ちでない通常ステップは「次へ」ボタン */}
                    {isCompleteStep ? (
                        <button
                            onClick={onNext}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-[11px] font-bold rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            完了
                            <CheckCircle2 size={12} />
                        </button>
                    ) : !isActionStep && (
                        <button
                            onClick={onNext}
                            className="flex items-center gap-0.5 px-2.5 py-1.5 bg-blue-500 text-white text-[11px] font-bold rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            次へ
                            <ChevronRight size={11} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const WaitingBuildCard: React.FC<{ style: React.CSSProperties; onSkip: () => void; onPrev: () => void }> = ({ style, onSkip, onPrev }) => (
    <div style={style} className="bg-white rounded-2xl shadow-2xl border border-amber-100 overflow-hidden">
        <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                        <HardHat size={14} className="text-white" />
                    </div>
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">ビルド中</span>
                </div>
                <button onClick={onSkip} className="text-gray-300 hover:text-gray-500 transition-colors" title="終了">
                    <X size={16} />
                </button>
            </div>

            {/* Animated waiting indicator */}
            <div className="flex items-center gap-3 px-3 py-3 bg-amber-50 rounded-xl border border-amber-100">
                <Loader2 size={18} className="text-amber-500 animate-spin shrink-0" />
                <div>
                    <p className="text-xs font-bold text-amber-700">ビルド完了まで待機中...</p>
                    <p className="text-[10px] text-amber-500 mt-0.5">初回は 3〜5 分ほどかかる場合があります</p>
                </div>
            </div>

            <div className="space-y-1.5">
                <p className="text-xs text-gray-500 leading-relaxed">
                    ビルドログで進捗をリアルタイムで確認できます。ビルドが完了すると自動的に次のステップへ進みます。
                </p>
            </div>

            {/* Progress dots + back */}
            <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                    {TUTORIAL_STEPS.map((s, i) => {
                        const idx = TUTORIAL_STEPS.findIndex(t => t.step === 'waiting-build');
                        return (
                            <div key={s.step} className={`rounded-full transition-all ${
                                i === idx ? 'w-3 h-2 bg-amber-400' : i < idx ? 'w-2 h-2 bg-blue-200' : 'w-2 h-2 bg-gray-200'
                            }`} />
                        );
                    })}
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={onPrev} className="flex items-center gap-0.5 px-2.5 py-1.5 border border-gray-200 text-gray-500 text-[11px] font-bold rounded-lg hover:bg-gray-50 transition-colors">
                        <ChevronLeft size={11} />戻る
                    </button>
                    <button onClick={onSkip} className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors px-1">終了</button>
                </div>
            </div>
        </div>
    </div>
);

const CompletionCard: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 max-w-sm w-full mx-4 text-center space-y-5">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} className="text-green-500" />
        </div>
        <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">チュートリアル完了！</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
                お疲れ様でした！プロジェクト作成・コンテナ起動・外部公開・削除の一連の流れを習得しました。<br />
                これで Launchs を自由に使いこなせます。
            </p>
        </div>
        <button
            onClick={onClose}
            className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors"
        >
            はじめる
        </button>
    </div>
);

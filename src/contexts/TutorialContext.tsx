import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type TutorialStep =
    | 'create-project'
    | 'project-form-open'
    | 'project-created'
    | 'create-container'
    | 'container-form-open'
    | 'container-created'
    | 'view-build-status'
    | 'open-builds'
    | 'waiting-build'
    | 'open-exec-logs'
    | 'open-networking'
    | 'enable-ingress'
    | 'ingress-enabled'
    | 'open-delete'
    | 'delete-container'
    | 'delete-project'
    | 'completed';

export interface TutorialStepConfig {
    step: TutorialStep;
    title: string;
    description: string;
    targetSelector?: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    action?: string;
    highlight?: boolean;
}

export const TUTORIAL_STEPS: TutorialStepConfig[] = [
    {
        step: 'create-project',
        title: 'ステップ 1 — プロジェクトを作成する',
        description: 'まず最初に、コンテナをまとめるための「プロジェクト」を作成します。「新規プロジェクト」ボタンをクリックしてください。',
        targetSelector: '[data-tutorial="create-project-btn"]',
        position: 'bottom',
        action: '「新規プロジェクト」ボタンをクリック',
        highlight: true,
    },
    {
        step: 'project-form-open',
        title: 'ステップ 1 — プロジェクト名を確認して作成',
        description: 'サンプル名が入力済みです。そのまま「プロジェクトを作成」ボタンをクリックしてください。',
        targetSelector: '[data-tutorial="create-project-form"]',
        position: 'right',
        action: '「プロジェクトを作成」ボタンをクリック',
        highlight: true,
    },
    {
        step: 'project-created',
        title: 'ステップ 2 — プロジェクトを開く',
        description: 'プロジェクトが作成されました！カードをクリックしてプロジェクトの詳細画面へ移動しましょう。',
        targetSelector: '[data-tutorial="project-card"]',
        position: 'bottom',
        action: 'プロジェクトカードをクリック',
        highlight: true,
    },
    {
        step: 'create-container',
        title: 'ステップ 3 — コンテナを起動する',
        description: 'プロジェクト内にコンテナを追加します。「コンテナを追加」ボタンをクリックして、サンプルのコンテナを起動してみましょう。',
        targetSelector: '[data-tutorial="add-container-btn"]',
        position: 'bottom',
        action: '「コンテナを追加」ボタンをクリック',
        highlight: true,
    },
    {
        step: 'container-form-open',
        title: 'ステップ 3 — サンプルコンテナをデプロイ',
        description: 'サンプルアプリ（Go 製 Web サーバー）の情報が入力済みです。「デプロイを開始する」ボタンをクリックしてください。',
        targetSelector: '[data-tutorial="deploy-form"]',
        position: 'left',
        action: '「デプロイを開始する」ボタンをクリック',
        highlight: true,
    },
    {
        step: 'container-created',
        title: 'ステップ 4 — コンテナカードを確認する',
        description: 'デプロイが開始されました！フロー図にコンテナカードが表示されています。カード右上のバッジ（Building / Deploying など）が現在のビルドステータスを示しています。カードをクリックして詳細パネルを開いてください。',
        targetSelector: '[data-tutorial="container-node"]',
        position: 'right',
        action: 'コンテナカードをクリック',
        highlight: true,
    },
    {
        step: 'view-build-status',
        title: 'ステップ 4 — 概要タブを確認する',
        description: '「概要」タブではリポジトリ URL・ブランチ・パスなどの設定と、Pod のスケーリング（台数変更）ができます。ビルド完了後は起動した Pod がここに一覧表示されます。',
        targetSelector: '[data-tutorial="overview-tab"]',
        position: 'left',
        action: '「概要」タブの内容を確認',
        highlight: true,
    },
    {
        step: 'open-builds',
        title: 'ステップ 4 — ビルド履歴を確認する',
        description: '「履歴」タブではビルドジョブの一覧と成否を確認できます。ジョブをクリックするとビルドログを表示できます。「ビルド」タブをクリックしてください。',
        targetSelector: '[data-tutorial="builds-tab"]',
        position: 'left',
        action: '「履歴」タブをクリック',
        highlight: true,
    },
    {
        step: 'waiting-build',
        title: 'ビルド完了を待っています...',
        description: 'ビルドが完了するまでお待ちください。初回は 3〜5 分ほどかかる場合があります。ビルドログで進捗をリアルタイムで確認できます。ビルドが完了すると自動で次のステップへ進みます。',
        targetSelector: '[data-tutorial="build-logs-tab"]',
        position: 'left',
        action: '「ビルド」タブでログを確認',
        highlight: true,
    },
    {
        step: 'open-exec-logs',
        title: 'ステップ 5 — 実行ログを確認する',
        description: 'ビルドが完了しました！「実行」タブではコンテナが出力するリアルタイムのログを確認できます。アプリのエラーや起動メッセージはここで確認します。「実行」タブをクリックしてください。',
        targetSelector: '[data-tutorial="exec-logs-tab"]',
        position: 'left',
        action: '「実行」タブをクリック',
        highlight: true,
    },
    {
        step: 'open-networking',
        title: 'ステップ 6 — 外部公開を設定する',
        description: '「ネット」タブでコンテナをインターネットに公開できます。まず内部ポート設定を有効にしてポート番号を設定し、次に Ingress（外部公開）を作成します。「ネット」タブをクリックしてください。',
        targetSelector: '[data-tutorial="networking-tab"]',
        position: 'left',
        action: '「ネット」タブをクリック',
        highlight: true,
    },
    {
        step: 'enable-ingress',
        title: 'ステップ 6 — 外部公開を有効化する',
        description: 'サンプルアプリはポート 1323 で動作しています。内部ポート設定が有効になったら「外部公開を有効化」ボタンをクリックして Ingress を作成してください。',
        targetSelector: '[data-tutorial="enable-ingress-btn"]',
        position: 'left',
        action: '「外部公開を有効化」ボタンをクリック',
        highlight: true,
    },
    {
        step: 'ingress-enabled',
        title: 'ステップ 6 完了 — 外部公開 URL が発行されました',
        description: '外部公開 URL が発行されました！リンクをクリックしてアクセスできます。次はコンテナとプロジェクトの削除方法を学びましょう。「削除」タブを開いてください。',
        targetSelector: '[data-tutorial="delete-tab"]',
        position: 'left',
        action: '「削除」タブをクリック',
        highlight: true,
    },
    {
        step: 'open-delete',
        title: 'ステップ 7 — コンテナを削除する',
        description: 'コンテナを削除するには、入力欄にコンテナ名を正確に入力する必要があります。これは誤削除を防ぐための確認です。入力後「コンテナを完全に削除する」ボタンが有効になります。',
        targetSelector: '[data-tutorial="delete-container-btn"]',
        position: 'left',
        action: 'コンテナ名を入力してから削除ボタンをクリック',
        highlight: true,
    },
    {
        step: 'delete-container',
        title: 'ステップ 8 — プロジェクトを削除する',
        description: 'コンテナを削除しました！次はプロジェクトを削除します。プロジェクト一覧に戻り、作成したプロジェクトの「…」メニューから「プロジェクトを削除」を選択してください。',
        targetSelector: '[data-tutorial="back-to-projects"]',
        position: 'bottom',
        action: '「プロジェクト一覧」へ戻る',
        highlight: true,
    },
    {
        step: 'delete-project',
        title: 'ステップ 8 — プロジェクトを削除する',
        description: 'プロジェクトカードにカーソルを合わせると「…」メニューが表示されます。クリックして「プロジェクトを削除」を選択してください。',
        targetSelector: '[data-tutorial="project-card"]',
        position: 'bottom',
        action: '「…」メニュー → 「プロジェクトを削除」',
        highlight: true,
    },
    {
        step: 'completed',
        title: 'チュートリアル完了！',
        description: 'お疲れ様でした！プロジェクト作成・コンテナ起動・外部公開・コンテナ削除・プロジェクト削除の一連の流れを習得しました。これで Launchs を自由に使いこなせます。',
        position: 'center',
        highlight: false,
    },
];

const STORAGE_KEY = 'launchs_tutorial_completed';
const STEP_KEY = 'launchs_tutorial_step';
const PROJECT_ID_KEY = 'launchs_tutorial_project_id';
const CONTAINER_ID_KEY = 'launchs_tutorial_container_id';
const CONTAINER_NAME_KEY = 'launchs_tutorial_container_name';

interface TutorialContextValue {
    isActive: boolean;
    currentStep: TutorialStep;
    stepConfig: TutorialStepConfig;
    stepIndex: number;
    totalSteps: number;
    startTutorial: () => void;
    nextStep: () => void;
    prevStep: () => void;
    skipTutorial: () => void;
    goToStep: (step: TutorialStep) => void;
    isCompleted: boolean;
    tutorialProjectId: string | null;
    setTutorialProjectId: (id: string | null) => void;
    tutorialContainerId: string | null;
    setTutorialContainerId: (id: string | null) => void;
    tutorialContainerName: string | null;
    setTutorialContainerName: (name: string | null) => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export const useTutorial = () => {
    const ctx = useContext(TutorialContext);
    if (!ctx) throw new Error('useTutorial must be used within TutorialProvider');
    return ctx;
};

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const isCompleted = localStorage.getItem(STORAGE_KEY) === 'true';

    const savedStep = (localStorage.getItem(STEP_KEY) as TutorialStep) || 'create-project';
    const [currentStep, setCurrentStep] = useState<TutorialStep>(savedStep);
    const [isActive, setIsActive] = useState(!isCompleted);
    const [tutorialProjectId, setTutorialProjectIdState] = useState<string | null>(
        localStorage.getItem(PROJECT_ID_KEY)
    );
    const [tutorialContainerId, setTutorialContainerIdState] = useState<string | null>(
        localStorage.getItem(CONTAINER_ID_KEY)
    );
    const [tutorialContainerName, setTutorialContainerNameState] = useState<string | null>(
        localStorage.getItem(CONTAINER_NAME_KEY)
    );

    const setTutorialProjectId = useCallback((id: string | null) => {
        if (id) localStorage.setItem(PROJECT_ID_KEY, id); else localStorage.removeItem(PROJECT_ID_KEY);
        setTutorialProjectIdState(id);
    }, []);
    const setTutorialContainerId = useCallback((id: string | null) => {
        if (id) localStorage.setItem(CONTAINER_ID_KEY, id); else localStorage.removeItem(CONTAINER_ID_KEY);
        setTutorialContainerIdState(id);
    }, []);
    const setTutorialContainerName = useCallback((name: string | null) => {
        if (name) localStorage.setItem(CONTAINER_NAME_KEY, name); else localStorage.removeItem(CONTAINER_NAME_KEY);
        setTutorialContainerNameState(name);
    }, []);

    const stepIndex = TUTORIAL_STEPS.findIndex(s => s.step === currentStep);
    const stepConfig = TUTORIAL_STEPS[stepIndex] ?? TUTORIAL_STEPS[0];

    const persistStep = useCallback((step: TutorialStep) => {
        localStorage.setItem(STEP_KEY, step);
        setCurrentStep(step);
    }, []);

    const nextStep = useCallback(() => {
        const next = TUTORIAL_STEPS[stepIndex + 1];
        if (next) {
            persistStep(next.step);
        } else {
            persistStep('completed');
            setIsActive(false);
            localStorage.setItem(STORAGE_KEY, 'true');
        }
    }, [stepIndex, persistStep]);

    const prevStep = useCallback(() => {
        const prev = TUTORIAL_STEPS[stepIndex - 1];
        if (prev) persistStep(prev.step);
    }, [stepIndex, persistStep]);

    const goToStep = useCallback((step: TutorialStep) => {
        persistStep(step);
        setIsActive(true);
    }, [persistStep]);

    const skipTutorial = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, 'true');
        localStorage.removeItem(STEP_KEY);
        setIsActive(false);
    }, []);

    const startTutorial = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(PROJECT_ID_KEY);
        localStorage.removeItem(CONTAINER_ID_KEY);
        localStorage.removeItem(CONTAINER_NAME_KEY);
        setTutorialProjectIdState(null);
        setTutorialContainerIdState(null);
        setTutorialContainerNameState(null);
        persistStep('create-project');
        setIsActive(true);
    }, [persistStep]);

    useEffect(() => {
        if (currentStep === 'completed') {
            localStorage.setItem(STORAGE_KEY, 'true');
            setIsActive(false);
        }
    }, [currentStep]);

    return (
        <TutorialContext.Provider value={{
            isActive,
            currentStep,
            stepConfig,
            stepIndex,
            totalSteps: TUTORIAL_STEPS.length,
            startTutorial,
            nextStep,
            prevStep,
            skipTutorial,
            goToStep,
            isCompleted: localStorage.getItem(STORAGE_KEY) === 'true',
            tutorialProjectId,
            setTutorialProjectId,
            tutorialContainerId,
            setTutorialContainerId,
            tutorialContainerName,
            setTutorialContainerName,
        }}>
            {children}
        </TutorialContext.Provider>
    );
};

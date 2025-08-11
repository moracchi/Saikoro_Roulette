// =================================
// 音声安定化システム（完全版）
// =================================
const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|OPiOS|mercury/.test(navigator.userAgent);
const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

console.log('デバイス検出 - iOS Safari:', isIOSSafari, 'モバイル:', isMobileDevice);

// =================================
// グローバル変数とDOM要素
// =================================
let isSpinning = false;
let spinHistory = JSON.parse(localStorage.getItem('spinHistory')) || [];
let isMuted = localStorage.getItem('isMuted') === 'true';
let volume = parseFloat(localStorage.getItem('volume')) || 0.7;
let audioInitialized = false;
let gameInitialized = false;

// スピン制御用の変数
let spinAnimationInterval = null;
let finalResult = null;
let spinTimeouts = [];

// 音声システム（安定化強化版）
let audioElements = {};
let audioContext = null;
let audioLoadPromises = [];
let audioQueue = [];
let isAudioQueueProcessing = false;
let audioFailureCount = 0;
let audioRetryLimit = 3;

// DOM要素を取得
const elements = {
    // メイン要素
    spinBtn: null,
    diceContainer: null,
    diceFace: null,
    diceNumber: null,
    resultGlow: null,
    resultMessage: null,
    payoutDisplay: null,
    spinProgress: null,
    
    // 設定要素
    settingsBtn: null,
    settingsContent: null,
    muteBtn: null,
    volumeSlider: null,
    resetBtn: null,
    audioTestBtn: null,
    
    // 統計要素
    statsGrid: null,
    totalSpins: null,
    jackpotCount: null,
    
    // エフェクト要素
    particlesContainer: null,
    flashEffect: null,
    jackpotPopup: null,
    floatingParticles: null,
    
    // 音声専用要素
    audioInitNotice: null,
    audioInitBtn: null,
    loadingIndicator: null,
    audioStatus: null,
    audioHealth: null
};

// =================================
// 初期化（音声安定化対応版）
// =================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM読み込み完了');
    
    // デバイス対応初期化
    initializeForMobileDevices();
    
    initializeElements();
    setupEventListeners();
    updateStatistics();
    startBackgroundAnimation();
    
    // 音声システムの段階的初期化開始
    initializeAudioLoadingProcess();
});

// モバイルデバイス用の初期化
function initializeForMobileDevices() {
    if (isMobileDevice) {
        // スクロール防止
        document.addEventListener('touchmove', function(e) {
            if (e.target.tagName !== 'INPUT') {
                e.preventDefault();
            }
        }, { passive: false });
        
        if (isIOSSafari) {
            // iOS Safari特有の処理
            let lastTouchEnd = 0;
            document.addEventListener('touchend', function(e) {
                const now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            }, false);
        }
        
        console.log('モバイルデバイス用初期化完了');
    }
}

function initializeElements() {
    // 全てのDOM要素を取得
    elements.spinBtn = document.getElementById('spinBtn');
    elements.diceContainer = document.getElementById('diceContainer');
    elements.diceFace = document.getElementById('diceFace');
    elements.diceNumber = document.getElementById('diceNumber');
    elements.resultGlow = document.getElementById('resultGlow');
    elements.resultMessage = document.getElementById('resultMessage');
    elements.payoutDisplay = document.getElementById('payoutDisplay');
    elements.spinProgress = document.getElementById('spinProgress');
    elements.settingsBtn = document.getElementById('settingsBtn');
    elements.settingsContent = document.getElementById('settingsContent');
    elements.muteBtn = document.getElementById('muteBtn');
    elements.volumeSlider = document.getElementById('volumeSlider');
    elements.resetBtn = document.getElementById('resetBtn');
    elements.audioTestBtn = document.getElementById('audioTestBtn');
    elements.statsGrid = document.getElementById('statsGrid');
    elements.totalSpins = document.getElementById('totalSpins');
    elements.jackpotCount = document.getElementById('jackpotCount');
    elements.particlesContainer = document.getElementById('particlesContainer');
    elements.flashEffect = document.getElementById('flashEffect');
    elements.jackpotPopup = document.getElementById('jackpotPopup');
    elements.floatingParticles = document.querySelector('.floating-particles');
    elements.audioInitNotice = document.getElementById('audioInitNotice');
    elements.audioInitBtn = document.getElementById('audioInitBtn');
    elements.loadingIndicator = document.getElementById('loadingIndicator');
    elements.audioStatus = document.getElementById('audioStatus');
    elements.audioHealth = document.getElementById('audioHealth');

    console.log('DOM要素取得完了');
}

// =================================
// 音声システム（完全安定化版）
// =================================
async function initializeAudioLoadingProcess() {
    console.log('音声読み込みプロセス開始');
    
    updateAudioStatus('音声ファイルを検索中...');
    
    try {
        // 段階1: 音声要素の発見と準備
        await discoverAudioElements();
        updateAudioStatus('音声要素を発見しました');
        
        // 段階2: 音声ファイルの事前読み込み
        await preloadAudioFiles();
        updateAudioStatus('音声ファイル読み込み完了');
        
        // 段階3: 初期化ボタンを表示
        showAudioInitButton();
        
    } catch (error) {
        console.error('音声読み込みエラー:', error);
        updateAudioStatus('音声読み込みエラー - 手動初期化が必要です');
        showAudioInitButton();
    }
}

async function discoverAudioElements() {
    const audioTypes = ['jackpot', 'click', 'result-big', 'result-normal', 'spin-start', 'spinning'];
    
    for (const type of audioTypes) {
        // 複数のインスタンスを作成して安定性向上
        const audio1 = document.getElementById(`audio-${type}-1`);
        const audio2 = document.getElementById(`audio-${type}-2`);
        
        if (audio1 && audio2) {
            audioElements[type] = [audio1, audio2];
            
            // 両方の音声要素に設定を適用
            [audio1, audio2].forEach(audio => {
                audio.volume = volume;
                audio.preload = 'auto';
                
                // エラーハンドリング
                audio.addEventListener('error', (e) => {
                    console.warn(`音声エラー: ${type}`, e);
                    audioFailureCount++;
                });
                
                // 読み込み完了イベント
                audio.addEventListener('canplaythrough', () => {
                    console.log(`音声読み込み完了: ${type}`);
                });
            });
            
            console.log(`音声要素準備完了: ${type}`);
        } else {
            throw new Error(`音声要素が見つかりません: ${type}`);
        }
    }
}

async function preloadAudioFiles() {
    const preloadPromises = [];
    
    Object.keys(audioElements).forEach(type => {
        const audioInstances = audioElements[type];
        
        audioInstances.forEach((audio, index) => {
            const promise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`音声読み込みタイムアウト: ${type}-${index}`));
                }, 10000); // 10秒タイムアウト
                
                if (audio.readyState >= 3) {
                    clearTimeout(timeout);
                    resolve();
                } else {
                    audio.addEventListener('canplaythrough', () => {
                        clearTimeout(timeout);
                        resolve();
                    }, { once: true });
                    
                    audio.addEventListener('error', (e) => {
                        clearTimeout(timeout);
                        reject(e);
                    }, { once: true });
                    
                    // 読み込みを強制実行
                    audio.load();
                }
            });
            
            preloadPromises.push(promise);
        });
    });
    
    // すべての音声ファイルの読み込み完了を待機
    await Promise.allSettled(preloadPromises);
    console.log('音声ファイル事前読み込み完了');
}

function showAudioInitButton() {
    if (elements.loadingIndicator) {
        elements.loadingIndicator.style.display = 'none';
    }
    if (elements.audioInitBtn) {
        elements.audioInitBtn.style.display = 'block';
    }
    updateAudioStatus('準備完了 - ボタンをタップしてください');
}

function updateAudioStatus(status) {
    if (elements.audioStatus) {
        elements.audioStatus.textContent = status;
    }
    console.log('音声状態:', status);
}

// =================================
// イベントリスナー設定（安定化対応版）
// =================================
function setupEventListeners() {
    console.log('イベントリスナー設定開始');
    
    // 音声初期化ボタン
    if (elements.audioInitBtn) {
        elements.audioInitBtn.addEventListener('touchstart', handleAudioInit, { passive: false });
        elements.audioInitBtn.addEventListener('click', handleAudioInit);
        console.log('音声初期化ボタン設定完了');
    }

    // スピンボタン
    if (elements.spinBtn) {
        if (isMobileDevice) {
            elements.spinBtn.addEventListener('touchstart', handleSpinTouch, { passive: false });
            elements.spinBtn.addEventListener('touchend', handleSpinTouchEnd, { passive: false });
        } else {
            elements.spinBtn.addEventListener('click', handleSpin);
        }
        console.log('スピンボタン設定完了');
    }

    // 音声テストボタン
    if (elements.audioTestBtn) {
        elements.audioTestBtn.addEventListener('click', handleAudioTest);
        console.log('音声テストボタン設定完了');
    }

    // その他のボタン
    setupOtherEventListeners();
    
    console.log('全イベントリスナー設定完了');
}

// 音声初期化処理（安定化版）
async function handleAudioInit(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('音声初期化開始');
    updateAudioStatus('音声システムを初期化中...');
    
    try {
        // AudioContextの初期化
        await initializeAudioContext();
        updateAudioStatus('AudioContext初期化完了');
        
        // 音声要素の初期化
        await initializeAllAudioElements();
        updateAudioStatus('音声要素初期化完了');
        
        // システム初期化
        await initializeGameSystem();
        updateAudioStatus('ゲームシステム初期化完了');
        
        // 初期化成功
        audioInitialized = true;
        gameInitialized = true;
        
        // 通知を非表示
        hideAudioInitNotice();
        
        // 音声状態表示を更新
        updateAudioHealthDisplay('ready', '音声: 準備完了');
        
        // 成功メッセージ
        if (elements.resultMessage) {
            elements.resultMessage.textContent = 'SPINボタンをタップ！';
        }
        
        // SPINボタンを有効化
        if (elements.spinBtn) {
            elements.spinBtn.disabled = false;
        }
        
        console.log('音声初期化完了');
        
    } catch (error) {
        console.error('音声初期化エラー:', error);
        updateAudioStatus('初期化エラー: ' + error.message);
        updateAudioHealthDisplay('error', '音声: エラー');
        
        // エラーでも基本機能は使えるようにする
        gameInitialized = true;
        if (elements.spinBtn) {
            elements.spinBtn.disabled = false;
        }
        if (elements.resultMessage) {
            elements.resultMessage.textContent = '音声なしでプレイ可能';
        }
    }
}

async function initializeAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('AudioContext作成:', audioContext.state);
    }
    
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('AudioContext再開:', audioContext.state);
    }
    
    return audioContext;
}

async function initializeAllAudioElements() {
    const initPromises = [];
    
    Object.keys(audioElements).forEach(type => {
        const audioInstances = audioElements[type];
        
        audioInstances.forEach((audio, index) => {
            const promise = initializeSingleAudioElement(audio, `${type}-${index}`);
            initPromises.push(promise);
        });
    });
    
    const results = await Promise.allSettled(initPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;
    
    console.log(`音声初期化結果: 成功 ${successCount}, 失敗 ${failureCount}`);
    
    if (successCount === 0) {
        throw new Error('全ての音声初期化に失敗しました');
    }
}

async function initializeSingleAudioElement(audio, name) {
    try {
        // 一瞬だけ無音で再生して初期化
        const originalVolume = audio.volume;
        audio.volume = 0;
        audio.currentTime = 0;
        
        await audio.play();
        audio.pause();
        audio.currentTime = 0;
        audio.volume = originalVolume;
        
        console.log(`音声初期化成功: ${name}`);
        return true;
        
    } catch (error) {
        console.warn(`音声初期化警告: ${name}`, error);
        throw error;
    }
}

async function initializeGameSystem() {
    // 音量設定を適用
    if (elements.volumeSlider) {
        elements.volumeSlider.value = volume * 100;
    }
    
    // 全音声要素の音量を設定
    Object.values(audioElements).forEach(audioInstances => {
        audioInstances.forEach(audio => {
            audio.volume = volume;
        });
    });
    
    // ミュート状態を反映
    updateMuteButton();
    
    console.log('ゲームシステム初期化完了');
}

function hideAudioInitNotice() {
    if (elements.audioInitNotice) {
        elements.audioInitNotice.classList.add('hide');
    }
}

function updateAudioHealthDisplay(status, text) {
    if (elements.audioHealth) {
        elements.audioHealth.className = `audio-health ${status}`;
        elements.audioHealth.querySelector('.health-text').textContent = text;
    }
}

// =================================
// 音声再生システム（安定化完全版）
// =================================
async function playAudio(audioName, delay = 0, options = {}) {
    if (isMuted && !options.force) {
        console.log('音声ミュート中:', audioName);
        return Promise.resolve();
    }
    
    if (!audioInitialized && !options.force) {
        console.log('音声未初期化:', audioName);
        return Promise.resolve();
    }
    
    // 音声キューに追加
    const audioRequest = {
        name: audioName,
        delay: delay,
        options: options,
        timestamp: Date.now()
    };
    
    audioQueue.push(audioRequest);
    
    // キュー処理開始
    if (!isAudioQueueProcessing) {
        processAudioQueue();
    }
    
    return Promise.resolve();
}

async function processAudioQueue() {
    if (isAudioQueueProcessing || audioQueue.length === 0) {
        return;
    }
    
    isAudioQueueProcessing = true;
    
    while (audioQueue.length > 0) {
        const request = audioQueue.shift();
        
        try {
            if (request.delay > 0) {
                await new Promise(resolve => setTimeout(resolve, request.delay));
            }
            
            await playAudioInternal(request.name, request.options);
            
        } catch (error) {
            console.error('音声再生キューエラー:', error);
        }
        
        // 次の音声再生まで少し待機（安定性向上）
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    isAudioQueueProcessing = false;
}

async function playAudioInternal(audioName, options = {}) {
    const audioInstances = audioElements[audioName];
    if (!audioInstances || audioInstances.length === 0) {
        console.warn('音声要素が見つかりません:', audioName);
        return;
    }
    
    // 利用可能な音声インスタンスを選択
    let selectedAudio = null;
    
    for (const audio of audioInstances) {
        if (audio.paused || audio.ended) {
            selectedAudio = audio;
            break;
        }
    }
    
    // 全て再生中の場合は最初のインスタンスを使用
    if (!selectedAudio) {
        selectedAudio = audioInstances[0];
    }
    
    try {
        // 再生準備
        if (!selectedAudio.paused) {
            selectedAudio.pause();
        }
        
        selectedAudio.currentTime = 0;
        selectedAudio.volume = volume;
        
        // 再生実行（リトライ機能付き）
        await playWithRetry(selectedAudio, audioName);
        
        console.log('音声再生成功:', audioName);
        
    } catch (error) {
        console.error('音声再生エラー:', audioName, error);
        
        // フォールバック音声
        if (audioName === 'click' || options.fallback) {
            await playFallbackSound();
        }
    }
}

async function playWithRetry(audio, audioName, maxRetries = 3) {
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
        try {
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                await playPromise;
            }
            
            return; // 成功
            
        } catch (error) {
            retryCount++;
            console.warn(`音声再生リトライ ${retryCount}/${maxRetries}:`, audioName, error);
            
            if (retryCount < maxRetries) {
                // リトライ前に少し待機
                await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
                
                // 音声を再初期化
                try {
                    audio.load();
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (loadError) {
                    console.warn('音声再読み込みエラー:', loadError);
                }
            } else {
                throw error; // 最大リトライ数に達した
            }
        }
    }
}

async function playFallbackSound() {
    if (!audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.1, audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        
        console.log('フォールバック音声再生成功');
        
    } catch (error) {
        console.error('フォールバック音声エラー:', error);
    }
}

// 音声テスト機能
async function handleAudioTest() {
    console.log('音声テスト開始');
    updateAudioHealthDisplay('testing', '音声: テスト中');
    
    try {
        await playAudio('click', 0, { force: true });
        await new Promise(resolve => setTimeout(resolve, 300));
        await playAudio('result-normal', 0, { force: true });
        await new Promise(resolve => setTimeout(resolve, 500));
        await playAudio('result-big', 0, { force: true });
        
        updateAudioHealthDisplay('ready', '音声: テスト完了');
        
        if (elements.resultMessage) {
            elements.resultMessage.textContent = '音声テスト完了！';
            setTimeout(() => {
                if (gameInitialized) {
                    elements.resultMessage.textContent = 'SPINボタンをタップ！';
                }
            }, 2000);
        }
        
    } catch (error) {
        console.error('音声テストエラー:', error);
        updateAudioHealthDisplay('error', '音声: テスト失敗');
    }
}

// =================================
// スピン機能（安定化対応版）
// =================================
function handleSpinTouch(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!gameInitialized || isSpinning) {
        console.log('スピン不可:', { initialized: gameInitialized, spinning: isSpinning });
        return;
    }
    
    // タッチフィードバック
    if (elements.spinBtn) {
        elements.spinBtn.style.transform = 'scale(0.95)';
    }
    
    // バイブレーション
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    console.log('タッチ開始');
}

function handleSpinTouchEnd(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!gameInitialized || isSpinning) {
        console.log('スピン終了不可');
        return;
    }
    
    // タッチフィードバック解除
    if (elements.spinBtn) {
        elements.spinBtn.style.transform = '';
    }
    
    // スピン実行
    setTimeout(() => {
        handleSpin();
    }, 50);
    
    console.log('タッチ終了、スピン実行');
}

function handleSpin() {
    if (isSpinning) {
        console.log('既にスピン中');
        return;
    }
    
    if (!gameInitialized) {
        console.log('ゲーム未初期化');
        return;
    }
    
    console.log('=== スピン開始 ===');
    
    clearAllSpinProcesses();
    
    isSpinning = true;
    finalResult = Math.floor(Math.random() * 6) + 1;
    
    console.log('確定結果:', finalResult);
    
    setSpinningState(true);
    
    // 音声再生（安定化版）
    playAudio('click');
    playAudio('spin-start', 200);
    
    startSpinAnimation();
    
    const spinDuration = 3000;
    showProgress(spinDuration);
    
    // スピン中音声
    playAudio('spinning', 500);
    
    const stopTimeout = setTimeout(() => {
        console.log('=== スピン停止処理開始 ===');
        stopSpinningSound();
        stopSpinAnimation();
        finalizeSpin(finalResult);
    }, spinDuration);
    
    spinTimeouts.push(stopTimeout);
}

function clearAllSpinProcesses() {
    if (spinAnimationInterval) {
        clearInterval(spinAnimationInterval);
        spinAnimationInterval = null;
    }
    
    spinTimeouts.forEach(timeout => clearTimeout(timeout));
    spinTimeouts = [];
    
    stopSpinningSound();
    
    console.log('既存処理クリア完了');
}

function startSpinAnimation() {
    if (!elements.diceFace || !elements.diceNumber) return;
    
    console.log('スピンアニメーション開始');
    
    elements.diceFace.classList.add('spinning');
    
    spinAnimationInterval = setInterval(() => {
        if (!isSpinning) {
            clearInterval(spinAnimationInterval);
            return;
        }
        
        const displayNum = Math.floor(Math.random() * 6) + 1;
        if (elements.diceNumber) {
            elements.diceNumber.textContent = displayNum;
        }
    }, 100);
}

function stopSpinAnimation() {
    console.log('スピンアニメーション停止');
    
    if (spinAnimationInterval) {
        clearInterval(spinAnimationInterval);
        spinAnimationInterval = null;
    }
    
    if (elements.diceFace) {
        elements.diceFace.classList.remove('spinning');
    }
}

function stopSpinningSound() {
    // 全てのスピン中音声を停止
    if (audioElements['spinning']) {
        audioElements['spinning'].forEach(audio => {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    }
}

function finalizeSpin(result) {
    console.log('=== 結果確定処理開始 ===', result);
    
    displayFinalResult(result);
    addToHistory(result);
    
    setTimeout(() => {
        showResultEffects(result);
    }, 100);
    
    setTimeout(() => {
        setSpinningState(false);
        isSpinning = false;
        finalResult = null;
        console.log('=== スピン完全終了 ===');
    }, 2000);
}

function displayFinalResult(result) {
    console.log('最終結果表示:', result);
    
    if (elements.diceFace) {
        elements.diceFace.className = 'dice-face';
        elements.diceFace.classList.add(`result-${result}`);
    }
    
    if (elements.diceNumber) {
        elements.diceNumber.textContent = result;
        console.log('数字表示更新完了:', elements.diceNumber.textContent);
    }
    
    // レンダリングを強制
    if (elements.diceFace && elements.diceNumber) {
        elements.diceFace.offsetHeight;
    }
}

// =================================
// 演出・エフェクト（完全版）
// =================================
function showResultEffects(result) {
    console.log('演出開始 - 結果:', result);
    
    const messages = {
        1: "🎯 1が出た！スタート！",
        2: "⭐ 2が出た！ナイス！", 
        3: "🌟 3が出た！順調！",
        4: "✨ 4が出た！グッド！",
        5: "🎉 5が出た！すごい！",
        6: "🎊 JACKPOT！最高！"
    };
    
    const payouts = {
        1: "SMALL WIN",
        2: "NICE HIT",
        3: "GOOD WIN", 
        4: "GREAT WIN",
        5: "BIG WIN",
        6: "MEGA JACKPOT!"
    };
    
    const currentNumber = elements.diceNumber ? elements.diceNumber.textContent : result;
    const displayResult = parseInt(currentNumber) || result;
    
    console.log('メッセージ表示用結果:', displayResult);
    
    // メッセージ表示
    if (elements.resultMessage) {
        const message = messages[displayResult];
        elements.resultMessage.textContent = message;
        elements.resultMessage.classList.remove('hide');
        console.log('メッセージ表示:', message);
    }
    
    // ペイアウト表示
    setTimeout(() => {
        if (elements.payoutDisplay) {
            const payout = payouts[displayResult];
            elements.payoutDisplay.textContent = payout;
            elements.payoutDisplay.classList.add('show');
            console.log('ペイアウト表示:', payout);
        }
    }, 300);
    
    // 音声再生（安定化版）
    if (displayResult === 6) {
        playAudio('jackpot');
    } else if (displayResult >= 4) {
        playAudio('result-big');
    } else {
        playAudio('result-normal');
    }
    
    // エフェクト
    if (elements.resultGlow) {
        elements.resultGlow.classList.add('active');
    }
    
    createParticleEffect(displayResult);
    
    if (displayResult >= 4) {
        createFlashEffect();
    }
    
    if (displayResult === 6) {
        setTimeout(() => {
            showJackpotPopup();
        }, 1000);
    }
    
    updateStatistics();
    
    // クリーンアップ
    setTimeout(() => {
        if (elements.payoutDisplay) {
            elements.payoutDisplay.classList.remove('show');
        }
        if (elements.resultGlow) {
            elements.resultGlow.classList.remove('active');
        }
    }, 3000);
}

function createParticleEffect(result) {
    if (!elements.particlesContainer) return;
    
    const colors = {
        1: '#ff6b6b',
        2: '#4ecdc4', 
        3: '#45b7d1',
        4: '#96ceb4',
        5: '#feca57',
        6: '#ffd700'
    };
    
    const particleCount = result === 6 ? 30 : result * 3;
    const color = colors[result];
    
    console.log(`パーティクル生成: ${particleCount}個, 色: ${color}`);
    
    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
            createSingleParticle(color);
        }, Math.random() * 500);
    }
}

function createSingleParticle(color) {
    if (!elements.particlesContainer) return;
    
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.background = color;
    particle.style.boxShadow = `0 0 8px ${color}`;
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 150 + 100;
    const targetX = centerX + Math.cos(angle) * distance;
    const targetY = centerY + Math.sin(angle) * distance;
    
    particle.style.left = centerX + 'px';
    particle.style.top = centerY + 'px';
    
    elements.particlesContainer.appendChild(particle);
    
    let progress = 0;
    const animate = () => {
        progress += 0.02;
        
        if (progress >= 1) {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
            return;
        }
        
        const currentX = centerX + (targetX - centerX) * progress;
        const currentY = centerY + (targetY - centerY) * progress + Math.sin(progress * Math.PI) * 20;
        const opacity = 1 - progress;
        
        particle.style.left = currentX + 'px';
        particle.style.top = currentY + 'px';
        particle.style.opacity = opacity;
        
        requestAnimationFrame(animate);
    };
    
    animate();
}

function createFlashEffect() {
    if (!elements.flashEffect) return;
    
    elements.flashEffect.classList.add('active');
    setTimeout(() => {
        elements.flashEffect.classList.remove('active');
    }, 200);
}

function showJackpotPopup() {
    if (!elements.jackpotPopup) return;
    
    elements.jackpotPopup.classList.add('show');
    
    setTimeout(() => {
        hideJackpotPopup();
    }, 5000);
}

function hideJackpotPopup() {
    if (elements.jackpotPopup) {
        elements.jackpotPopup.classList.remove('show');
    }
}

// =================================
// その他の必要な関数（完全版）
// =================================
function setupOtherEventListeners() {
    // 設定ボタン
    if (elements.settingsBtn) {
        if (isMobileDevice) {
            elements.settingsBtn.addEventListener('touchstart', toggleSettings, { passive: true });
        } else {
            elements.settingsBtn.addEventListener('click', toggleSettings);
        }
    }

    // ミュートボタン
    if (elements.muteBtn) {
        if (isMobileDevice) {
            elements.muteBtn.addEventListener('touchstart', toggleMute, { passive: true });
        } else {
            elements.muteBtn.addEventListener('click', toggleMute);
        }
    }

    // 音量スライダー
    if (elements.volumeSlider) {
        elements.volumeSlider.addEventListener('input', updateVolume);
    }

    // リセットボタン
    if (elements.resetBtn) {
        if (isMobileDevice) {
            elements.resetBtn.addEventListener('touchstart', resetStatistics, { passive: true });
        } else {
            elements.resetBtn.addEventListener('click', resetStatistics);
        }
    }

    // ジャックポットポップアップ
    if (elements.jackpotPopup) {
        if (isMobileDevice) {
            elements.jackpotPopup.addEventListener('touchstart', hideJackpotPopup, { passive: true });
        } else {
            elements.jackpotPopup.addEventListener('click', hideJackpotPopup);
        }
    }

    // 設定パネル外をタップしたら閉じる
    document.addEventListener(isMobileDevice ? 'touchstart' : 'click', function(e) {
        if (elements.settingsContent && 
            !elements.settingsBtn.contains(e.target) && 
            !elements.settingsContent.contains(e.target)) {
            hideSettings();
        }
    }, { passive: true });
}

function setSpinningState(spinning) {
    if (elements.spinBtn) {
        elements.spinBtn.disabled = spinning;
    }
    
    if (elements.resultMessage) {
        if (spinning) {
            elements.resultMessage.classList.add('hide');
        }
    }
}

function showProgress(duration) {
    if (!elements.spinProgress) return;
    
    elements.spinProgress.classList.add('active');
    
    setTimeout(() => {
        elements.spinProgress.classList.remove('active');
    }, duration);
}

function toggleSettings() {
    if (!elements.settingsContent) return;
    
    const isVisible = elements.settingsContent.classList.contains('show');
    if (isVisible) {
        hideSettings();
    } else {
        showSettings();
    }
}

function showSettings() {
    if (elements.settingsContent) {
        elements.settingsContent.classList.add('show');
    }
}

function hideSettings() {
    if (elements.settingsContent) {
        elements.settingsContent.classList.remove('show');
    }
}

function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('isMuted', isMuted.toString());
    updateMuteButton();
    
    if (!isMuted && audioInitialized) {
        playAudio('click', 0, { force: true });
    }
}

function updateMuteButton() {
    if (!elements.muteBtn) return;
    
    if (isMuted) {
        elements.muteBtn.textContent = '🔇 OFF';
        elements.muteBtn.classList.add('muted');
    } else {
        elements.muteBtn.textContent = '🔊 ON';
        elements.muteBtn.classList.remove('muted');
    }
}

function updateVolume() {
    if (!elements.volumeSlider) return;
    
    volume = elements.volumeSlider.value / 100;
    localStorage.setItem('volume', volume.toString());
    
    // 全ての音声要素の音量を更新
    Object.values(audioElements).forEach(audioInstances => {
        audioInstances.forEach(audio => {
            audio.volume = volume;
        });
    });
    
    if (!isMuted && audioInitialized) {
        playAudio('click', 0, { force: true });
    }
}

function addToHistory(result) {
    const entry = {
        result: result,
        timestamp: Date.now()
    };
    
    spinHistory.push(entry);
    console.log('履歴追加:', entry);
    
    if (spinHistory.length > 100) {
        spinHistory = spinHistory.slice(-100);
    }
    
    localStorage.setItem('spinHistory', JSON.stringify(spinHistory));
}

function updateStatistics() {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    let jackpots = 0;
    
    spinHistory.forEach(entry => {
        counts[entry.result]++;
        if (entry.result === 6) {
            jackpots++;
        }
    });
    
    const total = spinHistory.length;
    if (elements.totalSpins) {
        elements.totalSpins.textContent = total;
    }
    
    if (elements.jackpotCount) {
        elements.jackpotCount.textContent = jackpots;
    }
    
    if (elements.statsGrid) {
        elements.statsGrid.innerHTML = '';
        
        for (let i = 1; i <= 6; i++) {
            const statBox = document.createElement('div');
            statBox.className = 'stat-box';
            
            const percentage = total > 0 ? ((counts[i] / total) * 100).toFixed(1) : 0;
            
            statBox.innerHTML = `
                <div class="stat-number">${i}</div>
                <div class="stat-count">${counts[i]}回</div>
                <div style="font-size: 0.8em; color: var(--text-silver);">(${percentage}%)</div>
            `;
            
            elements.statsGrid.appendChild(statBox);
        }
    }
    
    console.log('統計更新完了:', counts);
}

function resetStatistics() {
    if (confirm('統計をリセットしますか？')) {
        spinHistory = [];
        localStorage.removeItem('spinHistory');
        updateStatistics();
        
        if (elements.resultMessage) {
            elements.resultMessage.textContent = 'リセット完了！';
            setTimeout(() => {
                if (gameInitialized) {
                    elements.resultMessage.textContent = 'SPINボタンをタップ！';
                } else {
                    elements.resultMessage.textContent = '音声を初期化してください';
                }
            }, 2000);
        }
        
        if (audioInitialized) {
            playAudio('click');
        }
    }
}

function startBackgroundAnimation() {
    if (!elements.floatingParticles) return;
    
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            createBackgroundParticle();
        }, Math.random() * 3000);
    }
    
    setInterval(() => {
        createBackgroundParticle();
    }, 2000);
}

function createBackgroundParticle() {
    if (!elements.floatingParticles) return;
    
    const particle = document.createElement('div');
    particle.className = 'floating-particle';
    
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (Math.random() * 5 + 8) + 's';
    particle.style.animationDelay = Math.random() * 2 + 's';
    
    elements.floatingParticles.appendChild(particle);
    
    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, 15000);
}

// バイブレーション機能
function vibrate(pattern = [50, 50, 50]) {
    if ('vibrate' in navigator && !isMuted) {
        navigator.vibrate(pattern);
    }
}

// エラーハンドリング・デバッグ
window.addEventListener('error', function(e) {
    console.error('JavaScript エラー:', e.error);
    updateAudioHealthDisplay('error', '音声: システムエラー');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('未処理のPromise拒否:', e.reason);
});

console.log('音声安定化スクリプト読み込み完了');

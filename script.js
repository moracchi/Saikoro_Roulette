// =================================
// iOS Safari対応の設定
// =================================
const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|OPiOS|mercury/.test(navigator.userAgent);
const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

console.log('iOS Safari検出:', isIOSSafari);
console.log('モバイルデバイス:', isMobileDevice);

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

// 音声オブジェクト
let audioElements = {};
let audioContext = null;

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
    
    // 統計要素
    statsGrid: null,
    totalSpins: null,
    jackpotCount: null,
    
    // エフェクト要素
    particlesContainer: null,
    flashEffect: null,
    jackpotPopup: null,
    floatingParticles: null,
    
    // iOS専用要素
    iosInitNotice: null,
    iosInitBtn: null
};

// =================================
// 初期化（iOS Safari対応版）
// =================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM読み込み完了');
    
    // iOS Safari対応の初期化
    initializeForIOSSafari();
    
    initializeElements();
    setupEventListeners();
    updateStatistics();
    startBackgroundAnimation();
    
    // iOS Safariの場合は初期化通知を表示
    if (isIOSSafari) {
        showIOSInitNotice();
    } else {
        initializeGame();
    }
});

// iOS Safari用の初期化
function initializeForIOSSafari() {
    if (isIOSSafari) {
        // iOS Safariでのスクロール防止
        document.addEventListener('touchmove', function(e) {
            if (e.target.tagName !== 'INPUT') {
                e.preventDefault();
            }
        }, { passive: false });
        
        // ダブルタップズーム無効化
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(e) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        console.log('iOS Safari用の初期化完了');
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
    elements.statsGrid = document.getElementById('statsGrid');
    elements.totalSpins = document.getElementById('totalSpins');
    elements.jackpotCount = document.getElementById('jackpotCount');
    elements.particlesContainer = document.getElementById('particlesContainer');
    elements.flashEffect = document.getElementById('flashEffect');
    elements.jackpotPopup = document.getElementById('jackpotPopup');
    elements.floatingParticles = document.querySelector('.floating-particles');
    elements.iosInitNotice = document.getElementById('iosInitNotice');
    elements.iosInitBtn = document.getElementById('iosInitBtn');

    console.log('DOM要素取得完了');
}

// iOS初期化通知の表示
function showIOSInitNotice() {
    if (elements.iosInitNotice) {
        elements.iosInitNotice.classList.add('show');
    }
}

function hideIOSInitNotice() {
    if (elements.iosInitNotice) {
        elements.iosInitNotice.classList.remove('show');
    }
}

// =================================
// イベントリスナー設定（iOS Safari対応版）
// =================================
function setupEventListeners() {
    console.log('イベントリスナー設定開始');
    
    // iOS初期化ボタン
    if (elements.iosInitBtn) {
        // iOS Safariの場合、touchstartとclickの両方を監視
        elements.iosInitBtn.addEventListener('touchstart', handleIOSInit, { passive: false });
        elements.iosInitBtn.addEventListener('click', handleIOSInit);
        console.log('iOS初期化ボタン設定完了');
    }

    // スピンボタン（iOS対応強化版）
    if (elements.spinBtn) {
        // iOS Safariではtouchstartを優先
        if (isIOSSafari) {
            elements.spinBtn.addEventListener('touchstart', handleSpinTouch, { passive: false });
            elements.spinBtn.addEventListener('touchend', handleSpinTouchEnd, { passive: false });
        } else {
            elements.spinBtn.addEventListener('click', handleSpin);
        }
        console.log('スピンボタン設定完了');
    }

    // その他のボタン
    setupOtherEventListeners();
    
    console.log('全イベントリスナー設定完了');
}

// iOS初期化処理
async function handleIOSInit(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('iOS初期化開始');
    
    try {
        // 音声システムの初期化
        await initializeAudioSystem();
        
        // ゲームの初期化
        await initializeGame();
        
        // 初期化完了
        gameInitialized = true;
        audioInitialized = true;
        
        // 通知を非表示
        hideIOSInitNotice();
        
        // 成功メッセージ
        if (elements.resultMessage) {
            elements.resultMessage.textContent = 'ゲーム開始準備完了！';
        }
        
        console.log('iOS初期化完了');
        
    } catch (error) {
        console.error('iOS初期化エラー:', error);
        if (elements.resultMessage) {
            elements.resultMessage.textContent = '初期化エラーが発生しました';
        }
    }
}

// iOS Safari用のタッチ処理
function handleSpinTouch(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!gameInitialized) {
        console.log('ゲーム未初期化');
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
    
    if (!gameInitialized) {
        console.log('ゲーム未初期化');
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

function setupOtherEventListeners() {
    // 設定ボタン
    if (elements.settingsBtn) {
        if (isIOSSafari) {
            elements.settingsBtn.addEventListener('touchstart', toggleSettings, { passive: true });
        } else {
            elements.settingsBtn.addEventListener('click', toggleSettings);
        }
    }

    // ミュートボタン
    if (elements.muteBtn) {
        if (isIOSSafari) {
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
        if (isIOSSafari) {
            elements.resetBtn.addEventListener('touchstart', resetStatistics, { passive: true });
        } else {
            elements.resetBtn.addEventListener('click', resetStatistics);
        }
    }

    // ジャックポットポップアップ
    if (elements.jackpotPopup) {
        if (isIOSSafari) {
            elements.jackpotPopup.addEventListener('touchstart', hideJackpotPopup, { passive: true });
        } else {
            elements.jackpotPopup.addEventListener('click', hideJackpotPopup);
        }
    }

    // 設定パネル外をタップしたら閉じる
    document.addEventListener(isIOSSafari ? 'touchstart' : 'click', function(e) {
        if (elements.settingsContent && 
            !elements.settingsBtn.contains(e.target) && 
            !elements.settingsContent.contains(e.target)) {
            hideSettings();
        }
    }, { passive: true });
}

// =================================
// 音声システム（iOS Safari対応版）
// =================================
async function initializeAudioSystem() {
    console.log('音声システム初期化開始');
    
    try {
        // AudioContextの作成
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('AudioContext作成:', audioContext.state);
        }
        
        // iOS SafariではユーザーインタラクションでAudioContextを再開
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('AudioContext再開:', audioContext.state);
        }
        
        // 音声要素の初期化
        await initializeAudioElements();
        
        console.log('音声システム初期化完了');
        return true;
        
    } catch (error) {
        console.error('音声システム初期化エラー:', error);
        return false;
    }
}

async function initializeAudioElements() {
    const audioIds = ['jackpot', 'click', 'result-big', 'result-normal', 'spin-start', 'spinning'];
    
    for (const id of audioIds) {
        const element = document.getElementById(`audio-${id}`);
        if (element) {
            audioElements[id] = element;
            element.volume = volume;
            
            // iOS Safari用の音声準備
            try {
                element.load(); // 音声ファイルを再読み込み
                
                // 一瞬だけ無音で再生（初期化）
                const originalVolume = element.volume;
                element.volume = 0;
                element.currentTime = 0;
                
                await element.play();
                element.pause();
                element.currentTime = 0;
                element.volume = originalVolume;
                
                console.log(`音声初期化成功: ${id}`);
            } catch (error) {
                console.warn(`音声初期化警告: ${id}`, error);
            }
        }
    }
}

// 音声再生（iOS Safari対応版）
async function playAudio(audioName, delay = 0) {
    if (isMuted || !audioInitialized) {
        console.log('音声スキップ:', audioName, { muted: isMuted, initialized: audioInitialized });
        return;
    }
    
    const audio = audioElements[audioName];
    if (!audio) {
        console.warn('音声要素なし:', audioName);
        return;
    }
    
    try {
        const playFunction = async () => {
            // iOS Safari対応の再生処理
            if (!audio.paused) {
                audio.pause();
            }
            
            audio.currentTime = 0;
            audio.volume = volume;
            
            // iOS Safariでは Promise を明示的に処理
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                await playPromise;
            }
            
            console.log('音声再生成功:', audioName);
        };
        
        if (delay > 0) {
            setTimeout(playFunction, delay);
        } else {
            await playFunction();
        }
        
    } catch (error) {
        console.error('音声再生エラー:', audioName, error);
        
        // フォールバック: Web Audio API
        if (audioName === 'click') {
            playBeepSound();
        }
    }
}

// Web Audio API フォールバック
function playBeepSound() {
    if (isMuted || !audioContext) return;
    
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
        
        console.log('ビープ音再生成功');
        
    } catch (error) {
        console.error('ビープ音エラー:', error);
    }
}

function initializeGame() {
    if (elements.volumeSlider) {
        elements.volumeSlider.value = volume * 100;
    }
    
    Object.values(audioElements).forEach(audio => {
        if (audio) {
            audio.volume = volume;
        }
    });
    
    updateMuteButton();
    
    if (elements.resultMessage && gameInitialized) {
        elements.resultMessage.textContent = 'SPINボタンをタップ！';
    }
    
    console.log('ゲーム初期化完了');
}

// =================================
// メインスピン機能（iOS Safari対応版）
// =================================
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
    
    // 音声再生
    playAudio('click');
    playAudio('spin-start', 200);
    
    startSpinAnimation();
    
    const spinDuration = 3000;
    showProgress(spinDuration);
    
    // スピン中音声
    setTimeout(() => {
        playAudio('spinning');
    }, 500);
    
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
    const spinningAudio = audioElements['spinning'];
    if (spinningAudio && !spinningAudio.paused) {
        spinningAudio.pause();
        spinningAudio.currentTime = 0;
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
    
    // iOS Safariでレンダリングを強制
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
    
    // 音声再生
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
    
    // 画面中央から開始
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // ランダムな方向に飛散
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 150 + 100;
    const targetX = centerX + Math.cos(angle) * distance;
    const targetY = centerY + Math.sin(angle) * distance;
    
    particle.style.left = centerX + 'px';
    particle.style.top = centerY + 'px';
    
    elements.particlesContainer.appendChild(particle);
    
    // アニメーション
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
    
    // 5秒後に自動で閉じる
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
// UI制御（完全版）
// =================================
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

// =================================
// 音声・設定制御（完全版）
// =================================
function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('isMuted', isMuted.toString());
    updateMuteButton();
    
    if (!isMuted && audioInitialized) {
        playAudio('click');
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
    Object.values(audioElements).forEach(audio => {
        if (audio) {
            audio.volume = volume;
        }
    });
    
    if (!isMuted && audioInitialized) {
        playAudio('click');
    }
}

// =================================
// 統計・履歴管理（完全版）
// =================================
function addToHistory(result) {
    const entry = {
        result: result,
        timestamp: Date.now()
    };
    
    spinHistory.push(entry);
    console.log('履歴追加:', entry);
    
    // 履歴は最新100件まで保持
    if (spinHistory.length > 100) {
        spinHistory = spinHistory.slice(-100);
    }
    
    localStorage.setItem('spinHistory', JSON.stringify(spinHistory));
}

function updateStatistics() {
    // 各数字の出現回数をカウント
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    let jackpots = 0;
    
    spinHistory.forEach(entry => {
        counts[entry.result]++;
        if (entry.result === 6) {
            jackpots++;
        }
    });
    
    // 合計回数
    const total = spinHistory.length;
    if (elements.totalSpins) {
        elements.totalSpins.textContent = total;
    }
    
    // ジャックポット回数
    if (elements.jackpotCount) {
        elements.jackpotCount.textContent = jackpots;
    }
    
    // 統計グリッド更新
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
                    elements.resultMessage.textContent = 'タップして開始してください';
                }
            }, 2000);
        }
        
        if (audioInitialized) {
            playAudio('click');
        }
    }
}

// =================================
// 背景アニメーション（完全版）
// =================================
function startBackgroundAnimation() {
    if (!elements.floatingParticles) return;
    
    // 初期パーティクルを生成
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            createBackgroundParticle();
        }, Math.random() * 3000);
    }
    
    // 定期的に新しいパーティクルを追加
    setInterval(() => {
        createBackgroundParticle();
    }, 2000);
}

function createBackgroundParticle() {
    if (!elements.floatingParticles) return;
    
    const particle = document.createElement('div');
    particle.className = 'floating-particle';
    
    // ランダムな位置と速度
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (Math.random() * 5 + 8) + 's';
    particle.style.animationDelay = Math.random() * 2 + 's';
    
    elements.floatingParticles.appendChild(particle);
    
    // アニメーション終了後に削除
    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, 15000);
}

// =================================
// バイブレーション機能（完全版）
// =================================
function vibrate(pattern = [50, 50, 50]) {
    if ('vibrate' in navigator && !isMuted) {
        navigator.vibrate(pattern);
    }
}

// スピンボタンにバイブレーション追加
if (elements.spinBtn) {
    elements.spinBtn.addEventListener('click', () => {
        vibrate([30, 20, 30]);
    });
}

// =================================
// エラーハンドリング・デバッグ（完全版）
// =================================
window.addEventListener('error', function(e) {
    console.error('JavaScript エラー:', e.error);
    console.error('ファイル:', e.filename);
    console.error('行:', e.lineno);
    console.error('列:', e.colno);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('未処理のPromise拒否:', e.reason);
});

// パフォーマンス監視
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('ページ読み込み時間:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
        }, 1000);
    });
}

// メモリ使用量監視（Chrome/Edge）
if ('memory' in performance) {
    setInterval(() => {
        const memory = performance.memory;
        console.log('メモリ使用量:', {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
            limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
        });
    }, 30000); // 30秒ごと
}

console.log('iOS Safari対応スクリプト読み込み完了');

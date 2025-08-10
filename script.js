// =================================
// グローバル変数とDOM要素
// =================================
let isSpinning = false;
let spinHistory = JSON.parse(localStorage.getItem('spinHistory')) || [];
let isMuted = localStorage.getItem('isMuted') === 'true';
let volume = parseFloat(localStorage.getItem('volume')) || 0.7;
let audioInitialized = localStorage.getItem('audioInitialized') === 'true';

// スピン制御用の変数
let spinAnimationInterval = null;
let finalResult = null;
let spinTimeouts = [];

// 音声オブジェクト
let audioElements = {};
let audioContext = null;

// DOM要素を取得
const elements = {
    spinBtn: null,
    diceContainer: null,
    diceFace: null,
    diceNumber: null,
    resultGlow: null,
    resultMessage: null,
    payoutDisplay: null,
    spinProgress: null,
    progressFill: null,
    settingsBtn: null,
    settingsContent: null,
    muteBtn: null,
    volumeSlider: null,
    resetBtn: null,
    statsGrid: null,
    totalSpins: null,
    jackpotCount: null,
    particlesContainer: null,
    flashEffect: null,
    jackpotPopup: null,
    floatingParticles: null,
    initAudioBtn: null,
    audioInitPanel: null
};

// =================================
// 初期化
// =================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM読み込み完了');
    initializeElements();
    initializeAudioElements();
    initializeGame();
    setupEventListeners();
    updateStatistics();
    startBackgroundAnimation();
    
    // 音声初期化状態を確認
    checkAudioInitialization();
});

function initializeElements() {
    // DOM要素を安全に取得
    elements.spinBtn = document.getElementById('spinBtn');
    elements.diceContainer = document.getElementById('diceContainer');
    elements.diceFace = document.getElementById('diceFace');
    elements.diceNumber = document.getElementById('diceNumber');
    elements.resultGlow = document.getElementById('resultGlow');
    elements.resultMessage = document.getElementById('resultMessage');
    elements.payoutDisplay = document.getElementById('payoutDisplay');
    elements.spinProgress = document.getElementById('spinProgress');
    elements.progressFill = document.getElementById('progressFill');
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
    elements.initAudioBtn = document.getElementById('initAudioBtn');
    elements.audioInitPanel = document.getElementById('audioInitPanel');

    console.log('DOM要素取得完了');
}

// =================================
// 音声システム初期化（修正版）
// =================================
function initializeAudioElements() {
    // 音声要素を取得
    const audioIds = ['jackpot', 'click', 'result-big', 'result-normal', 'spin-start', 'spinning'];
    
    audioIds.forEach(id => {
        const element = document.getElementById(`audio-${id}`);
        if (element) {
            audioElements[id] = element;
            
            // 音量を設定
            element.volume = volume;
            
            // 音声読み込み完了イベント
            element.addEventListener('canplaythrough', () => {
                console.log(`音声読み込み完了: ${id}`);
            });
            
            // 音声エラーイベント
            element.addEventListener('error', (e) => {
                console.error(`音声エラー: ${id}`, e);
            });
            
            // iOS対応：タッチ操作で音声を初期化
            element.addEventListener('loadstart', () => {
                console.log(`音声読み込み開始: ${id}`);
            });
        } else {
            console.warn(`音声要素が見つかりません: audio-${id}`);
        }
    });
    
    console.log('音声要素初期化完了', audioElements);
}

// 音声初期化状態チェック
function checkAudioInitialization() {
    if (audioInitialized) {
        hideAudioInitPanel();
    } else {
        showAudioInitPanel();
    }
}

function showAudioInitPanel() {
    if (elements.audioInitPanel) {
        elements.audioInitPanel.style.display = 'block';
    }
}

function hideAudioInitPanel() {
    if (elements.audioInitPanel) {
        elements.audioInitPanel.style.display = 'none';
    }
}

// 音声初期化処理
async function initializeAudio() {
    try {
        console.log('音声システム初期化開始');
        
        // AudioContext作成（ユーザーインタラクション後）
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        // 各音声要素を準備
        const promises = Object.values(audioElements).map(async (audio) => {
            try {
                // 音声を一瞬だけ再生して初期化（ミュート状態で）
                const originalVolume = audio.volume;
                audio.volume = 0;
                audio.currentTime = 0;
                
                await audio.play();
                audio.pause();
                audio.currentTime = 0;
                audio.volume = originalVolume;
                
                console.log('音声初期化成功:', audio.id);
                return Promise.resolve();
            } catch (error) {
                console.warn('音声初期化エラー:', audio.id, error);
                return Promise.resolve(); // エラーでも続行
            }
        });
        
        await Promise.all(promises);
        
        // 初期化完了
        audioInitialized = true;
        localStorage.setItem('audioInitialized', 'true');
        hideAudioInitPanel();
        
        // 成功メッセージ表示
        showAudioWarning('🎵 音声が有効化されました！', 'success');
        
        console.log('音声システム初期化完了');
        
    } catch (error) {
        console.error('音声初期化エラー:', error);
        showAudioWarning('⚠️ 音声初期化に失敗しました', 'error');
    }
}

// 音声再生関数（修正版）
async function playAudio(audioName, delay = 0) {
    if (isMuted) {
        console.log('音声ミュート中:', audioName);
        return;
    }
    
    if (!audioInitialized) {
        console.log('音声未初期化:', audioName);
        return;
    }
    
    const audio = audioElements[audioName];
    if (!audio) {
        console.warn('音声要素が見つかりません:', audioName);
        return;
    }
    
    try {
        if (delay > 0) {
            setTimeout(async () => {
                await playAudioInternal(audio, audioName);
            }, delay);
        } else {
            await playAudioInternal(audio, audioName);
        }
    } catch (error) {
        console.error('音声再生エラー:', audioName, error);
    }
}

// 内部音声再生関数
async function playAudioInternal(audio, audioName) {
    try {
        // 既に再生中の場合は停止してリセット
        if (!audio.paused) {
            audio.pause();
        }
        
        audio.currentTime = 0;
        audio.volume = volume;
        
        await audio.play();
        console.log('音声再生成功:', audioName);
        
    } catch (error) {
        console.error('音声再生内部エラー:', audioName, error);
        
        // フォールバック：Web Audio APIを使用
        if (audioName === 'click') {
            playBeepSound();
        }
    }
}

// フォールバック用ビープ音
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
        
    } catch (error) {
        console.error('ビープ音生成エラー:', error);
    }
}

// 音声警告表示
function showAudioWarning(message, type = 'info') {
    const existing = document.querySelector('.audio-warning');
    if (existing) {
        existing.remove();
    }
    
    const warning = document.createElement('div');
    warning.className = 'audio-warning';
    warning.textContent = message;
    
    if (type === 'success') {
        warning.style.background = 'rgba(40, 167, 69, 0.9)';
        warning.style.color = 'white';
    } else if (type === 'error') {
        warning.style.background = 'rgba(220, 53, 69, 0.9)';
        warning.style.color = 'white';
    }
    
    document.body.appendChild(warning);
    
    setTimeout(() => {
        if (warning.parentNode) {
            warning.parentNode.removeChild(warning);
        }
    }, 3000);
}

function initializeGame() {
    // 音量設定を適用
    if (elements.volumeSlider) {
        elements.volumeSlider.value = volume * 100;
    }
    
    // 音声要素の音量を更新
    Object.values(audioElements).forEach(audio => {
        if (audio) {
            audio.volume = volume;
        }
    });
    
    // ミュート状態を反映
    updateMuteButton();
    
    console.log('ゲーム初期化完了');
}

// =================================
// イベントリスナー設定（修正版）
// =================================
function setupEventListeners() {
    // スピンボタン
    if (elements.spinBtn) {
        elements.spinBtn.addEventListener('click', handleSpin);
        elements.spinBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
        });
    }

    // 音声初期化ボタン
    if (elements.initAudioBtn) {
        elements.initAudioBtn.addEventListener('click', async () => {
            await initializeAudio();
        });
    }

    // 設定ボタン
    if (elements.settingsBtn) {
        elements.settingsBtn.addEventListener('click', toggleSettings);
    }

    // ミュートボタン
    if (elements.muteBtn) {
        elements.muteBtn.addEventListener('click', toggleMute);
    }

    // 音量スライダー
    if (elements.volumeSlider) {
        elements.volumeSlider.addEventListener('input', updateVolume);
    }

    // リセットボタン
    if (elements.resetBtn) {
        elements.resetBtn.addEventListener('click', resetStatistics);
    }

    // ジャックポットポップアップクリック
    if (elements.jackpotPopup) {
        elements.jackpotPopup.addEventListener('click', hideJackpotPopup);
    }

    // 設定パネル外をクリックしたら閉じる
    document.addEventListener('click', function(e) {
        if (elements.settingsContent && 
            !elements.settingsBtn.contains(e.target) && 
            !elements.settingsContent.contains(e.target)) {
            hideSettings();
        }
    });

    console.log('イベントリスナー設定完了');
}

// =================================
// メインスピン機能（音声対応版）
// =================================
function handleSpin() {
    if (isSpinning) return;
    
    console.log('=== スピン開始 ===');
    
    // 既存の処理を完全にクリア
    clearAllSpinProcesses();
    
    isSpinning = true;
    
    // 最終結果を決定
    finalResult = Math.floor(Math.random() * 6) + 1;
    console.log('確定結果:', finalResult);
    
    // UI状態をスピン中に変更
    setSpinningState(true);
    
    // 【修正】音声再生（初期化済みの場合のみ）
    playAudio('click');
    playAudio('spin-start', 200);
    
    // スピンアニメーション開始
    startSpinAnimation();
    
    // スピン時間
    const spinDuration = 3000;
    
    // プログレスバー開始
    showProgress(spinDuration);
    
    // スピン中音声
    playAudio('spinning', 500);
    
    // スピン停止処理
    const stopTimeout = setTimeout(() => {
        console.log('=== スピン停止処理開始 ===');
        
        // スピン中音声を停止
        stopSpinningSound();
        
        stopSpinAnimation();
        finalizeSpin(finalResult);
    }, spinDuration);
    
    spinTimeouts.push(stopTimeout);
}

// スピン中音声停止
function stopSpinningSound() {
    const spinningAudio = audioElements['spinning'];
    if (spinningAudio && !spinningAudio.paused) {
        spinningAudio.pause();
        spinningAudio.currentTime = 0;
    }
}

function clearAllSpinProcesses() {
    // 既存のインターバルをクリア
    if (spinAnimationInterval) {
        clearInterval(spinAnimationInterval);
        spinAnimationInterval = null;
    }
    
    // 既存のタイムアウトをすべてクリア
    spinTimeouts.forEach(timeout => clearTimeout(timeout));
    spinTimeouts = [];
    
    // スピン中音声を停止
    stopSpinningSound();
    
    console.log('既存処理をクリア');
}

function startSpinAnimation() {
    if (!elements.diceFace || !elements.diceNumber) return;
    
    console.log('スピンアニメーション開始');
    
    // スピンクラスを追加
    elements.diceFace.classList.add('spinning');
    
    // 制御されたインターバルでランダム数字表示
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
    
    if (elements.diceFace && elements.diceNumber) {
        elements.diceFace.offsetHeight;
    }
}

// =================================
// 演出・エフェクト（音声対応版）
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
    
    // 【修正】結果に応じた音声再生
    if (displayResult === 6) {
        playAudio('jackpot');
    } else if (displayResult >= 4) {
        playAudio('result-big');
    } else {
        playAudio('result-normal');
    }
    
    // 光るエフェクト
    if (elements.resultGlow) {
        elements.resultGlow.classList.add('active');
    }
    
    // パーティクル効果
    createParticleEffect(displayResult);
    
    // フラッシュ効果（高得点時）
    if (displayResult >= 4) {
        createFlashEffect();
    }
    
    // ジャックポット演出
    if (displayResult === 6) {
        setTimeout(() => {
            showJackpotPopup();
        }, 1000);
    }
    
    // 統計更新
    updateStatistics();
    
    // エフェクトのクリーンアップ
    setTimeout(() => {
        if (elements.payoutDisplay) {
            elements.payoutDisplay.classList.remove('show');
        }
        if (elements.resultGlow) {
            elements.resultGlow.classList.remove('active');
        }
    }, 3000);
}

// =================================
// 音声・設定制御（修正版）
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

// 以下、既存の関数は同じため省略...
// （createParticleEffect, createSingleParticle, createFlashEffect, showJackpotPopup, hideJackpotPopup, setSpinningState, showProgress, toggleSettings, showSettings, hideSettings, addToHistory, updateStatistics, resetStatistics, startBackgroundAnimation, createBackgroundParticle）

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
                elements.resultMessage.textContent = 'タップしてスタート！';
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

if (elements.spinBtn) {
    elements.spinBtn.addEventListener('click', () => {
        vibrate([30, 20, 30]);
    });
}

console.log('スクリプト読み込み完了');

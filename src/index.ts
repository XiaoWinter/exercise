import './index.scss';

let timer: number;
let isRunning: boolean = false;
let isPaused: boolean = false;
let timeRemaining: number = 0; // 当前剩余时间
let currentExercise: number = 0; // 当前锻炼项目索引
let isResting: boolean = false; // 是否在休息时间

// 运动计划列表
const exercises = [
    { name: "深蹲", duration: 20 }, // 20秒完成15-20次
    { name: "哑铃卧推", duration: 30 }, // 30秒完成
    { name: "弓步蹲", duration: 30 }, // 30秒
    { name: "平板支撑", duration: 30 }, // 30秒
    { name: "俄罗斯转体", duration: 30 }, // 30秒
];

// 休息时间
const restDuration: number = 15; // 每个锻炼项目后休息 15 秒

// 创建 Web Audio API 上下文
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

// 播放提示音的函数
function playBeep(): void {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'square'; // 波形类型：方波
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // 设置频率（1000Hz）
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // 设置音量

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1); // 播放持续时间 0.1秒
}

// 使用 SpeechSynthesis API 朗读文本
function speak(text: string, callback: () => void): void {
    const utterance = new SpeechSynthesisUtterance(text);
    
    // 当语音播报完毕时，执行回调
    utterance.onend = () => {
        callback();
    };

    speechSynthesis.speak(utterance);
}

// 更新计时器显示
function updateTimerDisplay(): void {
    const minutes: number = Math.floor(timeRemaining / 60);
    const seconds: number = timeRemaining % 60;
    const timerElement: HTMLElement | null = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // 更新进度条宽度（通知栏）
    const progressBar: HTMLElement | null = document.getElementById('progress-bar');
    if (progressBar) {
        const progress = (timeRemaining / exercises[currentExercise].duration) * 100;
        progressBar.style.width = `${100 - progress}%`; // 进度条反向填充
    }
}

// 启动锻炼计时器
function startExerciseTimer(): void {
    if (timeRemaining === 0) {
        timeRemaining = exercises[currentExercise].duration;
    }
    document.getElementById('notification')!.textContent = `${exercises[currentExercise].name}开始！`;
    speak(`${exercises[currentExercise].name} 开始！`, () => {
        timer = window.setInterval(() => {
            if (timeRemaining > 0) {
                timeRemaining--;
                updateTimerDisplay();
                playBeep(); // 每秒播放一次提示音
            } else {
                clearInterval(timer);
                notifyExerciseComplete();
            }
        }, 1000);
    });

    isRunning = true;
    document.getElementById('startBtn')!.disabled = true;
    document.getElementById('pauseBtn')!.disabled = false;
    document.getElementById('continueBtn')!.disabled = false;
}

// 启动休息计时器
function startRestTimer(): void {
    timeRemaining = restDuration;
    isResting = true;

    speak(`休息时间 ${restDuration} 秒`, () => {
        timer = window.setInterval(() => {
            if (timeRemaining > 0) {
                timeRemaining--;
                updateTimerDisplay();
                playBeep(); // 每秒播放一次提示音
            } else {
                clearInterval(timer);
                notifyRestComplete();
            }
        }, 1000);
    });

    document.getElementById('pauseBtn')!.disabled = false;
    document.getElementById('continueBtn')!.disabled = false;
}

// 暂停计时器
function pauseTimer(): void {
    clearInterval(timer);
    isRunning = false;
    isPaused = true;
    document.getElementById('pauseBtn')!.disabled = true;
    document.getElementById('continueBtn')!.disabled = false;
}

// 继续计时器
function continueTimer(): void {
    if (isResting) {
        startRestTimer();
    } else {
        startExerciseTimer();
    }
    isPaused = false;
}

// 锻炼项目完成后，进入休息时间
function notifyExerciseComplete(): void {
    currentExercise++;
    if (currentExercise < exercises.length) {
        document.getElementById('notification')!.textContent = '休息';
        speak(`下一个动作，${exercises[currentExercise].name} ！`, () => {
            timeRemaining = restDuration;
            isResting = true;
            startRestTimer(); // 进入休息时间
        });
    } else {
        document.getElementById('notification')!.textContent = "所有动作已完成！";
        document.getElementById('startBtn')!.disabled = false;
    }
}

// 休息时间完成后，开始下一个锻炼项目
function notifyRestComplete(): void {
    document.getElementById('notification')!.textContent = `${exercises[currentExercise].name} 开始！`;
    speak(`休息结束！`, () => {
        timeRemaining = exercises[currentExercise].duration;
        updateTimerDisplay();
        isResting = false;
        startExerciseTimer(); // 进入下一个锻炼项目
    });
}

// 重置计时器
function resetTimer(): void {
    clearInterval(timer);
    timeRemaining = 0;
    currentExercise = 0;
    isResting = false;
    isRunning = false;
    isPaused = false;

    // 恢复按钮状态
    document.getElementById('startBtn')!.disabled = false;
    document.getElementById('pauseBtn')!.disabled = true;
    document.getElementById('continueBtn')!.disabled = true;

    // 更新计时器显示
    updateTimerDisplay();
    document.getElementById('notification')!.textContent = '';
    
    // 播放重置语音提示
    speak("计时器已重置，运动计划已恢复初始状态", () => {});
}

// 添加事件监听器
document.getElementById('startBtn')!.addEventListener('click', startExerciseTimer);
document.getElementById('pauseBtn')!.addEventListener('click', pauseTimer);
document.getElementById('continueBtn')!.addEventListener('click', continueTimer);
document.getElementById('resetBtn')!.addEventListener('click', resetTimer);

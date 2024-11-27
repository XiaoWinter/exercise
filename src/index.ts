import "./index.scss";

// 定义状态枚举
enum TimerState {
  INIT = "INIT",
  RUNNING = "RUNNING",
  PAUSED = "PAUSED",
  RESTING = "RESTING",
  COMPLETED = "COMPLETED",
}

// 初始状态
let state: TimerState = TimerState.INIT;
let timer: number;
let timeRemaining: number = 0; // 当前剩余时间
let currentExercise: number = 0; // 当前锻炼项目索引

// 运动计划列表
const exercises = [
  { name: "深蹲", duration: 20 },
  { name: "哑铃卧推", duration: 30 },
  { name: "弓步蹲", duration: 30 },
  { name: "平板支撑", duration: 30 },
  { name: "俄罗斯转体", duration: 30 },
];

// 节流函数，确保在指定时间间隔内只会触发一次事件
function throttle(func: Function, delay: number) {
  let lastTime = 0;
  return function (...args: any[]) {
    const now = Date.now();
    if(now - lastTime >= delay){
        func(args);
    }
    lastTime = now;
  };
}

// 休息时间
const restDuration: number = 15; // 每个锻炼项目后休息 15 秒

// 创建 Web Audio API 上下文
const audioContext = new (window.AudioContext ||
  (window as any).webkitAudioContext)();

// 播放提示音的函数
function playBeep(): void {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "square"; // 波形类型：方波
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
  const timerElement: HTMLElement | null = document.getElementById("timer");
  if (timerElement) {
    timerElement.textContent = `${String(minutes).padStart(2, "0")}:${String(
      seconds,
    ).padStart(2, "0")}`;
  }

  // 更新进度条宽度（通知栏）
  const progressBar: HTMLElement | null =
    document.getElementById("progress-bar");
  if (progressBar) {
    const duration =
      state === TimerState.RESTING
        ? restDuration
        : exercises[currentExercise].duration;
    const progress = (timeRemaining / duration) * 100;
    progressBar.style.width = `${100 - progress}%`; // 进度条反向填充
  }
}

// 进入下一个状态
function changeState(newState: TimerState): void {
  state = newState;
  const startBn = document.getElementById("startBtn") as HTMLButtonElement;
  const pauseBtn = document.getElementById("pauseBtn") as HTMLButtonElement;
  const continueBtn = document.getElementById(
    "continueBtn",
  ) as HTMLButtonElement;
  const resetBtn = document.getElementById("resetBtn") as HTMLButtonElement;

  // 根据状态更新按钮的可用性
  switch (state) {
    case TimerState.INIT:
      // 初始化状态，所有按钮可用
      startBn!.disabled = false;
      pauseBtn!.disabled = true;
      continueBtn!.disabled = true;
      resetBtn!.disabled = true;
      break;
    case TimerState.RUNNING:
      // 运行状态，暂停和重置按钮可用
      startBn!.disabled = true;
      pauseBtn!.disabled = false;
      continueBtn!.disabled = true;
      resetBtn!.disabled = false;
      break;
    case TimerState.PAUSED:
      // 暂停状态，继续按钮可用
      startBn!.disabled = true;
      pauseBtn!.disabled = true;
      continueBtn!.disabled = false;
      resetBtn!.disabled = false;
      break;
    case TimerState.RESTING:
      // 休息状态，暂停和重置按钮可用
      startBn!.disabled = true;
      pauseBtn!.disabled = false;
      continueBtn!.disabled = true;
      resetBtn!.disabled = false;
      break;
    case TimerState.COMPLETED:
      // 完成状态，重新开始按钮可用
      startBn!.disabled = false;
      pauseBtn!.disabled = true;
      continueBtn!.disabled = true;
      resetBtn!.disabled = false;
      break;
  }
}

// 启动锻炼计时器
function startExerciseTimer(): void {
  if (timeRemaining === 0) {
    timeRemaining = exercises[currentExercise].duration;
  }
  document.getElementById(
    "notification",
  )!.textContent = `${exercises[currentExercise].name}开始！`;
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

  changeState(TimerState.RUNNING);
}

// 启动休息计时器
function startRestTimer(): void {
  timeRemaining = restDuration;
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

  changeState(TimerState.RESTING);
}

// 暂停计时器
function pauseTimer(): void {
  clearInterval(timer);
  changeState(TimerState.PAUSED);
}

// 继续计时器
function continueTimer(): void {
  if (state === TimerState.PAUSED) {
    startExerciseTimer();
  } else if (state === TimerState.RESTING) {
    startRestTimer();
  }
}

// 锻炼项目完成后，进入休息时间
function notifyExerciseComplete(): void {
      // 当前锻炼项目完成，修改背景色
  const completedExercise = document.getElementsByClassName('exercise')[currentExercise] as HTMLDivElement;
  if (completedExercise) {
    completedExercise.style.backgroundColor = '#81c784';  // 设置为完成后的背景色
  }
  currentExercise++;
  if (currentExercise < exercises.length) {
    document.getElementById("notification")!.textContent = "休息";
    speak(`下一个动作，${exercises[currentExercise].name} ！`, () => {
      timeRemaining = restDuration;
      startRestTimer();
    });
  } else {
    document.getElementById("notification")!.textContent = "所有动作已完成！";
    changeState(TimerState.COMPLETED);
  }
}

// 休息时间完成后，开始下一个锻炼项目
function notifyRestComplete(): void {
  document.getElementById(
    "notification",
  )!.textContent = `${exercises[currentExercise].name} 开始！`;
  speak(`休息结束！`, () => {
    timeRemaining = exercises[currentExercise].duration;
    updateTimerDisplay();
    startExerciseTimer();
  });
}

// 重置计时器
function resetTimer(): void {
  clearInterval(timer);
  timeRemaining = 0;
  currentExercise = 0;
  changeState(TimerState.INIT);
  updateTimerDisplay();
  document.getElementById("notification")!.textContent = "";
  speak("计时器已重置，运动计划已恢复初始状态", () => {});
}

// 启动锻炼计时器
const startExerciseTimerThrottled = throttle(startExerciseTimer, 1000);
const pauseTimerThrottled = throttle(pauseTimer, 1000);
const continueTimerThrottled = throttle(continueTimer, 1000);
const resetTimerThrottled = throttle(resetTimer, 1000);

// 添加事件监听器
document
  .getElementById("startBtn")!
  .addEventListener("click", startExerciseTimerThrottled);
document
  .getElementById("pauseBtn")!
  .addEventListener("click", pauseTimerThrottled);
document
  .getElementById("continueBtn")!
  .addEventListener("click", continueTimerThrottled);
document
  .getElementById("resetBtn")!
  .addEventListener("click", resetTimerThrottled);
